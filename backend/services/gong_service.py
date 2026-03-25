"""Real Gong API client.

Uses the Gong v2 REST API with Basic auth (access-key : access-key-secret).
Docs: https://gong.app.gong.io/settings/api/documentation
"""

from __future__ import annotations

import base64
import logging
from datetime import datetime, timedelta, timezone

import httpx

from models.schemas import BadCall, GongData

logger = logging.getLogger(__name__)

GONG_BASE = "https://api.gong.io/v2"


def _auth_header(api_key: str, api_secret: str) -> dict[str, str]:
    token = base64.b64encode(f"{api_key}:{api_secret}".encode()).decode()
    return {"Authorization": f"Basic {token}"}


async def fetch_gong_calls(
    api_key: str,
    api_secret: str,
    days_back: int = 90,
) -> GongData:
    """Fetch recent calls from Gong and compute aggregate sentiment."""
    headers = _auth_header(api_key, api_secret)
    from_dt = datetime.now(timezone.utc) - timedelta(days=days_back)

    all_calls: list[dict] = []
    cursor: str | None = None

    async with httpx.AsyncClient(timeout=30) as client:
        # Paginate through calls
        for _ in range(20):  # safety cap
            body: dict = {
                "filter": {
                    "fromDateTime": from_dt.strftime("%Y-%m-%dT%H:%M:%SZ"),
                },
            }
            if cursor:
                body["cursor"] = cursor

            resp = await client.post(
                f"{GONG_BASE}/calls",
                headers=headers,
                json=body,
            )
            resp.raise_for_status()
            data = resp.json()

            all_calls.extend(data.get("calls", []))
            cursor = data.get("records", {}).get("cursor")
            if not cursor or not data.get("records", {}).get("currentPageSize"):
                break

    # Now fetch detailed stats for these calls (interaction stats)
    call_sentiments: list[dict] = []
    call_ids = [c["id"] for c in all_calls]

    if call_ids:
        # Gong interaction stats endpoint accepts batches
        async with httpx.AsyncClient(timeout=30) as client:
            for i in range(0, len(call_ids), 100):
                batch = call_ids[i : i + 100]
                resp = await client.post(
                    f"{GONG_BASE}/stats/interaction",
                    headers=headers,
                    json={"filter": {"callIds": batch}},
                )
                if resp.status_code == 200:
                    call_sentiments.extend(resp.json().get("callsData", []))

    # Build a lookup of call metadata
    call_map: dict[str, dict] = {}
    for c in all_calls:
        call_map[c["id"]] = c

    # Identify bad calls (negative sentiment or low scores)
    bad_calls: list[BadCall] = []
    total_score = 0.0
    scored_count = 0

    for stat in call_sentiments:
        cid = stat.get("callId", "")
        call_info = call_map.get(cid, {})
        # Gong provides various metrics; look for sentiment indicators
        customer_sentiment = stat.get("customerSentiment")
        if customer_sentiment is not None:
            score = _normalize_sentiment(customer_sentiment)
            total_score += score
            scored_count += 1

            if score < 0.4:
                participants = [
                    p.get("name", p.get("emailAddress", "Unknown"))
                    for p in call_info.get("parties", [])
                ]
                bad_calls.append(
                    BadCall(
                        call_id=cid,
                        date=call_info.get("started", "")[:10],
                        summary=call_info.get("title", "Flagged call with negative sentiment"),
                        participants=participants,
                        sentiment_score=round(score, 2),
                        url=call_info.get("url", f"https://app.gong.io/call?id={cid}"),
                    )
                )

    # If no sentiment stats available, fall back to basic call analysis
    if scored_count == 0 and all_calls:
        # Use call-level data to infer basic metrics
        for c in all_calls:
            scored_count += 1
            total_score += 0.5  # neutral default

    avg_score = round(total_score / max(scored_count, 1), 2)

    if avg_score >= 0.6:
        sentiment = "positive"
    elif avg_score >= 0.4:
        sentiment = "neutral"
    else:
        sentiment = "negative"

    # Sort bad calls by score ascending (worst first), limit to 10
    bad_calls.sort(key=lambda c: c.sentiment_score)
    bad_calls = bad_calls[:10]

    return GongData(
        overall_sentiment=sentiment,
        sentiment_score=avg_score,
        recent_calls=len(all_calls),
        bad_calls=bad_calls,
    )


def _normalize_sentiment(value: float | str) -> float:
    """Normalize various Gong sentiment values to 0-1 scale."""
    if isinstance(value, str):
        mapping = {"positive": 0.8, "neutral": 0.5, "negative": 0.2}
        return mapping.get(value.lower(), 0.5)
    # Assume already 0-1 or percentage
    if value > 1:
        return value / 100.0
    return float(value)
