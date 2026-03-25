"""Aggregated dashboard endpoint.

Pulls live data from every connected integration and returns a unified
payload.  Falls back to mock data for integrations that aren't connected.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter

from models.schemas import (
    Customer,
    GainsightMetrics,
    GongData,
    TicketSummary,
    VolumeTrend,
)
from services import integration_store
from services.gong_service import fetch_gong_calls
from mock.mock_customers import get_customers
from mock.mock_gainsight import get_gainsight_metrics
from mock.mock_gong import get_gong_data as get_mock_gong
from mock.mock_salesforce import get_load_volumes, get_invoicing_volumes
from mock.mock_freshdesk import get_tickets

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("")
async def get_dashboard():
    """Return aggregated data from all connected integrations."""

    connected = integration_store.list_connected()

    # ── Customers (always available from internal DB / Stripe) ──
    customers = get_customers()

    # ── Gong ──
    gong: GongData | None = None
    if "gong" in connected:
        creds = integration_store.get_credentials("gong")
        if creds:
            try:
                gong = await fetch_gong_calls(
                    api_key=creds.get("api_key", ""),
                    api_secret=creds.get("api_secret", ""),
                )
            except Exception as exc:
                logger.warning("Gong API call failed, using aggregated mock data: %s", exc)
                gong = _aggregate_gong(customers)

    # ── Gainsight ──
    gainsight: GainsightMetrics | None = None
    if "gainsight" in connected:
        # TODO: real Gainsight API integration
        # For now aggregate mock per-customer data
        gainsight = _aggregate_gainsight(customers)

    # ── Volumes (Salesforce) ──
    load_volumes: VolumeTrend | None = None
    invoice_volumes: VolumeTrend | None = None
    if "salesforce" in connected:
        # TODO: real Salesforce API integration
        load_volumes = get_load_volumes("aggregate")
        invoice_volumes = get_invoicing_volumes("aggregate")

    # ── Freshdesk ──
    tickets: TicketSummary | None = None
    if "freshdesk" in connected:
        # TODO: real Freshdesk API integration
        tickets = get_tickets("aggregate")

    return {
        "customers": [c.model_dump() for c in customers],
        "connected_integrations": connected,
        "gong": gong.model_dump() if gong else None,
        "gainsight": gainsight.model_dump() if gainsight else None,
        "load_volumes": load_volumes.model_dump() if load_volumes else None,
        "invoice_volumes": invoice_volumes.model_dump() if invoice_volumes else None,
        "tickets": tickets.model_dump() if tickets else None,
    }


def _aggregate_gainsight(customers: list[Customer]) -> GainsightMetrics:
    """Aggregate per-customer Gainsight metrics into portfolio view."""
    metrics = [get_gainsight_metrics(c.id) for c in customers]
    n = max(len(metrics), 1)
    return GainsightMetrics(
        health_score=round(sum(m.health_score for m in metrics) / n),
        mobile_app_usage_pct=round(sum(m.mobile_app_usage_pct for m in metrics) / n, 1),
        tariffs_automation_pct=round(sum(m.tariffs_automation_pct for m in metrics) / n, 1),
    )


def _aggregate_gong(customers: list[Customer]) -> GongData:
    """Aggregate per-customer Gong data into portfolio-wide view."""
    all_bad_calls: list = []
    total_score = 0.0
    total_calls = 0

    for c in customers:
        cdata = get_mock_gong(c.id)
        total_score += cdata.sentiment_score * cdata.recent_calls
        total_calls += cdata.recent_calls
        all_bad_calls.extend(cdata.bad_calls)

    avg_score = round(total_score / max(total_calls, 1), 2)
    if avg_score >= 0.6:
        sentiment = "positive"
    elif avg_score >= 0.4:
        sentiment = "neutral"
    else:
        sentiment = "negative"

    # Return worst calls sorted by sentiment score
    all_bad_calls.sort(key=lambda c: c.sentiment_score)

    return GongData(
        overall_sentiment=sentiment,
        sentiment_score=avg_score,
        recent_calls=total_calls,
        bad_calls=all_bad_calls[:10],
    )
