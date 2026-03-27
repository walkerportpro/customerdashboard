"""Health scoring engine.

Calculates customer health scores from a HealthModel configuration and
integration data coming from Gainsight, Gong, Freshdesk, Rocketlane,
Salesforce / Stripe mock data.
"""

from __future__ import annotations

import copy
from datetime import datetime

from models.schemas import (
    Customer,
    GainsightMetrics,
    GongData,
    OnboardingProject,
    TicketSummary,
    VolumeTrend,
)
from models.health_models import (
    ComponentScoreDetail,
    ExceptionRule,
    HealthModel,
    HealthScoreResult,
    ScoreBand,
    ScoreComponent,
    SegmentDefinition,
    SimulationResult,
    SimulationSummary,
)


# ---------------------------------------------------------------------------
# Band helpers
# ---------------------------------------------------------------------------

def _band_for_score(score: int, bands: list[ScoreBand]) -> str:
    """Return the label of the band that contains *score*."""
    for b in sorted(bands, key=lambda b: b.min_score, reverse=True):
        if b.min_score <= score <= b.max_score:
            return b.label
    # Fallback: find closest band
    if score <= 0:
        return bands[-1].label if bands else "Unknown"
    return bands[0].label if bands else "Unknown"


def _band_score_range(band_label: str, bands: list[ScoreBand]) -> tuple[int, int]:
    for b in bands:
        if b.label == band_label:
            return b.min_score, b.max_score
    return 0, 100


# ---------------------------------------------------------------------------
# Extract raw metric values from integration data
# ---------------------------------------------------------------------------

def _extract_raw_value(
    component: ScoreComponent,
    gainsight: GainsightMetrics | None,
    gong: GongData | None,
    tickets: TicketSummary | None,
    onboarding: list[OnboardingProject] | None,
    volumes: VolumeTrend | None,
) -> tuple[float | None, str]:
    """Return (raw_value, explanation) for a given component.

    The raw value is a number in the domain of the component (e.g. percentage,
    count, sentiment score).  *None* means data is missing.
    """

    cid = component.id
    src = component.source_system
    cat = component.category

    # -- Product Usage (gainsight) --
    if cid == "comp-usg" or (src == "gainsight" and cat == "usage"):
        if gainsight is None:
            return None, "No Gainsight data available"
        # Use average of the two usage metrics as a composite usage score
        avg_usage = (gainsight.mobile_app_usage_pct + gainsight.tariffs_automation_pct) / 2
        # Clamp to 0-100
        avg_usage = max(0.0, min(100.0, avg_usage))
        return avg_usage, f"Avg platform usage {avg_usage:.1f}% (mobile {gainsight.mobile_app_usage_pct}%, tariffs {gainsight.tariffs_automation_pct}%)"

    # -- Support Burden (freshdesk, support) --
    if cid == "comp-sup" or (src == "freshdesk" and cat == "support"):
        if tickets is None:
            return None, "No Freshdesk ticket data available"
        return float(tickets.total_open), f"{tickets.total_open} open tickets"

    # -- Billing Health (stripe) --
    if cid == "comp-bil" or (src == "stripe" and cat == "billing"):
        # We don't have a real Stripe integration; derive a proxy from volumes
        if volumes is None:
            return None, "No billing data available"
        # Treat negative volume trend as overdue-days proxy (0 = current)
        if volumes.change_pct >= 0:
            return 0.0, "Billing current (volume trend stable/up)"
        # Map negative change_pct to pseudo days-overdue: -10% -> ~10 days
        pseudo_days = min(abs(volumes.change_pct), 60.0)
        return pseudo_days, f"Billing proxy: ~{pseudo_days:.0f} days equivalent (volume declining {volumes.change_pct}%)"

    # -- Relationship Sentiment (gong, relationship) --
    if cid == "comp-rel" or (src == "gong" and cat == "relationship"):
        if gong is None:
            return None, "No Gong data available"
        return gong.sentiment_score, f"Gong sentiment {gong.sentiment_score:.2f} ({gong.overall_sentiment})"

    # -- Implementation Status (rocketlane) --
    if cid == "comp-imp" or (src == "rocketlane" and cat == "implementation"):
        if onboarding is None or len(onboarding) == 0:
            return None, "No Rocketlane onboarding projects"
        avg_pct = sum(p.percent_complete for p in onboarding) / len(onboarding)
        return avg_pct, f"Avg implementation progress {avg_pct:.0f}% across {len(onboarding)} projects"

    # -- Escalation Risk (freshdesk, escalation) --
    if cid == "comp-esc" or (src == "freshdesk" and cat == "escalation"):
        if tickets is None:
            return None, "No Freshdesk data for escalation"
        escalated = sum(1 for t in tickets.tickets if t.status == "Escalated")
        return float(escalated), f"{escalated} escalated tickets"

    # -- Executive Engagement (gong, engagement) --
    if cid == "comp-eng" or (src == "gong" and cat == "engagement"):
        if gong is None:
            return None, "No Gong engagement data"
        return float(gong.recent_calls), f"{gong.recent_calls} recent calls"

    # -- Renewal Risk (salesforce, renewal) --
    if cid == "comp-ren" or (src == "salesforce" and cat == "renewal"):
        if volumes is None:
            return None, "No Salesforce volume data for renewal signal"
        return volumes.change_pct, f"Volume trend {volumes.change_pct:+.1f}%"

    return None, f"No extraction rule for component {component.name}"


# ---------------------------------------------------------------------------
# Score a single component
# ---------------------------------------------------------------------------

def _score_component(component: ScoreComponent, raw_value: float | None) -> int:
    """Map a raw value to a 0-100 score using the component's thresholds."""
    if raw_value is None:
        # Use null handling strategy
        strat = component.null_handling.strategy
        if strat == "assign_penalty":
            return component.null_handling.penalty_score
        if strat == "assign_neutral":
            return 50
        # ignore_redistribute / mark_low_confidence -> neutral
        return 50

    thresholds = component.thresholds
    if not thresholds:
        # No thresholds defined: clamp raw value as score
        return max(0, min(100, int(raw_value)))

    direction = component.sensitivity.directionality

    # For "lower_better" components the thresholds are written such that
    # lower raw values yield higher scores.  We evaluate thresholds in the
    # order they are defined and return the first match.

    for th in thresholds:
        matched = False
        if th.condition == "gte":
            matched = raw_value >= th.value
        elif th.condition == "lte":
            matched = raw_value <= th.value
        elif th.condition == "gt":
            matched = raw_value > th.value
        elif th.condition == "lt":
            matched = raw_value < th.value
        elif th.condition == "eq":
            matched = raw_value == th.value
        elif th.condition == "between":
            upper = th.value_upper if th.value_upper is not None else th.value
            matched = th.value <= raw_value <= upper

        if matched:
            return th.result_score

    # No threshold matched - return last threshold's score as fallback
    return thresholds[-1].result_score if thresholds else 50


# ---------------------------------------------------------------------------
# Segment matching
# ---------------------------------------------------------------------------

def _matches_segment(
    customer: Customer,
    segment: SegmentDefinition,
    onboarding: list[OnboardingProject] | None,
) -> bool:
    """Check if a customer matches all conditions of a segment."""
    for cond in segment.conditions:
        field = cond.field
        op = cond.operator

        # Resolve the customer attribute
        if field == "industry":
            actual: str | float | list[str] = customer.industry
        elif field == "health_score":
            actual = float(customer.health_score)
        elif field == "has_active_onboarding":
            has_active = False
            if onboarding:
                has_active = any(
                    p.status in ("On Track", "At Risk", "Behind Schedule") for p in onboarding
                )
            actual = "true" if has_active else "false"
        else:
            # Unknown field - skip
            continue

        # Evaluate operator
        target = cond.value
        if op == "eq":
            if str(actual).lower() != str(target).lower():
                return False
        elif op == "neq":
            if str(actual).lower() == str(target).lower():
                return False
        elif op == "in":
            if isinstance(target, list):
                if actual not in target:
                    return False
            else:
                if actual != target:
                    return False
        elif op == "not_in":
            if isinstance(target, list):
                if actual in target:
                    return False
            else:
                if actual == target:
                    return False
        elif op == "contains":
            if str(target).lower() not in str(actual).lower():
                return False
        elif op in ("gt", "lt", "gte", "lte"):
            try:
                a = float(actual)  # type: ignore[arg-type]
                b = float(target)  # type: ignore[arg-type]
            except (ValueError, TypeError):
                return False
            if op == "gt" and not (a > b):
                return False
            if op == "lt" and not (a < b):
                return False
            if op == "gte" and not (a >= b):
                return False
            if op == "lte" and not (a <= b):
                return False

    return True


# ---------------------------------------------------------------------------
# Exception signal extraction
# ---------------------------------------------------------------------------

def _extract_signal(
    signal: str,
    tickets: TicketSummary | None,
    gong: GongData | None,
    onboarding: list[OnboardingProject] | None,
    volumes: VolumeTrend | None,
    current_score: int,
) -> float | None:
    """Extract a numeric signal value used by exception rules."""

    if signal == "open_p1_ticket_hours":
        if tickets is None:
            return None
        p1_count = sum(1 for t in tickets.tickets if t.priority == "P1" and t.status in ("Open", "In Progress", "Escalated"))
        # Assume each open P1 has been open ~72 hours if it exists (mock data has no real timestamps)
        return 72.0 if p1_count > 0 else 0.0

    if signal == "invoice_days_overdue":
        if volumes is None:
            return None
        if volumes.change_pct >= 0:
            return 0.0
        return min(abs(volumes.change_pct), 90.0)

    if signal == "implementation_days_behind":
        if onboarding is None or len(onboarding) == 0:
            return None
        behind = [p for p in onboarding if p.status == "Behind Schedule"]
        if not behind:
            return 0.0
        # Estimate days behind from percent_complete gap (rough proxy)
        avg_pct = sum(p.percent_complete for p in behind) / len(behind)
        days_behind = max(0, (100 - avg_pct) * 0.5)  # rough: each 2% gap = 1 day
        return days_behind

    if signal == "gong_sentiment_score":
        if gong is None:
            return None
        return gong.sentiment_score

    if signal == "days_in_critical":
        # Without historical data we use score as proxy:
        # score < 30 -> assume 20 days in critical, score < 40 -> 10 days
        if current_score < 30:
            return 20.0
        if current_score < 40:
            return 10.0
        return 0.0

    return None


def _evaluate_exception(
    rule: ExceptionRule,
    tickets: TicketSummary | None,
    gong: GongData | None,
    onboarding: list[OnboardingProject] | None,
    volumes: VolumeTrend | None,
    current_score: int,
) -> bool:
    """Return True if all conditions of *rule* are met."""
    if not rule.active:
        return False

    results: list[bool] = []
    for cond in rule.conditions:
        sig_val = _extract_signal(cond.signal, tickets, gong, onboarding, volumes, current_score)
        if sig_val is None:
            results.append(False)
            continue
        try:
            target = float(cond.value)
        except (ValueError, TypeError):
            results.append(False)
            continue

        if cond.operator == "gt":
            results.append(sig_val > target)
        elif cond.operator == "lt":
            results.append(sig_val < target)
        elif cond.operator == "gte":
            results.append(sig_val >= target)
        elif cond.operator == "lte":
            results.append(sig_val <= target)
        elif cond.operator == "eq":
            results.append(sig_val == target)
        elif cond.operator == "neq":
            results.append(sig_val != target)
        else:
            results.append(False)

    if not results:
        return False

    # All conditions use conjunction "and" by default
    conjunctions = [c.conjunction for c in rule.conditions]
    if all(c == "and" for c in conjunctions):
        return all(results)
    # Mixed: process left-to-right grouping OR
    combined = results[0]
    for i in range(1, len(results)):
        if conjunctions[i] == "or":
            combined = combined or results[i]
        else:
            combined = combined and results[i]
    return combined


# ---------------------------------------------------------------------------
# Main scoring function
# ---------------------------------------------------------------------------

def calculate_health_score(
    customer: Customer,
    model: HealthModel,
    gainsight: GainsightMetrics | None,
    gong: GongData | None,
    tickets: TicketSummary | None,
    onboarding: list[OnboardingProject] | None,
    volumes: VolumeTrend | None,
) -> HealthScoreResult:
    """Calculate the health score for a single customer."""

    bands = model.bands or []
    explanations: list[str] = []
    component_details: list[ComponentScoreDetail] = []
    confidence = 1.0

    # ── 1. Determine matching segment ──
    matched_segment: SegmentDefinition | None = None
    for seg in sorted(model.segments, key=lambda s: s.priority, reverse=True):
        if seg.active and _matches_segment(customer, seg, onboarding):
            matched_segment = seg
            break

    segment_name = matched_segment.name if matched_segment else None
    if segment_name:
        explanations.append(f"Segment: {segment_name}")

    # ── 2. Build effective weight map ──
    weight_map: dict[str, float] = {}
    for comp in model.components:
        if comp.active:
            weight_map[comp.id] = comp.sensitivity.weight

    # Apply segment weight overrides
    if matched_segment and matched_segment.weight_overrides:
        for cid, w in matched_segment.weight_overrides.items():
            if cid in weight_map:
                weight_map[cid] = w

    # Normalise weights to sum to 100
    total_weight = sum(weight_map.values())
    if total_weight > 0 and abs(total_weight - 100) > 0.01:
        factor = 100.0 / total_weight
        weight_map = {k: v * factor for k, v in weight_map.items()}

    # ── 3. Score each component ──
    missing_count = 0
    for comp in model.components:
        if not comp.active:
            continue

        raw_value, raw_explanation = _extract_raw_value(
            comp, gainsight, gong, tickets, onboarding, volumes,
        )
        data_available = raw_value is not None
        if not data_available:
            missing_count += 1
            # Adjust confidence based on null handling
            ci = comp.null_handling.confidence_impact
            if ci == "minor":
                confidence -= 0.05
            elif ci == "major":
                confidence -= 0.15
            elif ci == "critical":
                confidence -= 0.30

        comp_score = _score_component(comp, raw_value)
        eff_weight = weight_map.get(comp.id, 0)
        weighted_contrib = comp_score * eff_weight / 100.0

        detail = ComponentScoreDetail(
            component_id=comp.id,
            component_name=comp.name,
            category=comp.category,
            raw_value=raw_value,
            score=comp_score,
            weight=eff_weight,
            weighted_contribution=round(weighted_contrib, 2),
            source_system=comp.source_system,
            data_available=data_available,
            explanation=raw_explanation,
        )
        component_details.append(detail)

    confidence = max(0.0, min(1.0, confidence))

    # ── 4. Compute weighted average ──
    overall = sum(d.weighted_contribution for d in component_details)
    overall_score = max(0, min(100, round(overall)))

    # ── 5. Apply exception rules ──
    exceptions_applied: list[str] = []
    sorted_exceptions = sorted(model.exceptions, key=lambda e: e.priority, reverse=True)

    for rule in sorted_exceptions:
        if not rule.active:
            continue
        if _evaluate_exception(rule, tickets, gong, onboarding, volumes, overall_score):
            exceptions_applied.append(rule.name)
            explanations.append(f"Exception: {rule.name}")

            if rule.action == "force_band":
                band_label = str(rule.action_value)
                min_s, max_s = _band_score_range(band_label, bands)
                # Force score into the middle of the target band
                forced = (min_s + max_s) // 2
                if rule.is_hard_override:
                    overall_score = forced
                else:
                    overall_score = min(overall_score, forced)

            elif rule.action == "cap_score":
                cap = int(rule.action_value) if isinstance(rule.action_value, int) else int(rule.action_value)
                overall_score = min(overall_score, cap)

            elif rule.action == "floor_score":
                floor = int(rule.action_value) if isinstance(rule.action_value, int) else int(rule.action_value)
                overall_score = max(overall_score, floor)

            elif rule.action == "add_points":
                pts = int(rule.action_value) if isinstance(rule.action_value, int) else int(rule.action_value)
                overall_score = min(100, overall_score + pts)

            elif rule.action == "subtract_points":
                pts = int(rule.action_value) if isinstance(rule.action_value, int) else int(rule.action_value)
                overall_score = max(0, overall_score - pts)

    overall_score = max(0, min(100, overall_score))

    # ── 6. Determine band ──
    band = _band_for_score(overall_score, bands)

    # ── 7. Build explanation summary ──
    top_positive = sorted(
        [d for d in component_details if d.data_available],
        key=lambda d: d.weighted_contribution,
        reverse=True,
    )
    if top_positive:
        top = top_positive[0]
        explanations.append(f"Top contributor: {top.component_name} ({top.score} pts, {top.weight:.0f}% weight)")
    bottom = sorted(
        [d for d in component_details if d.data_available],
        key=lambda d: d.weighted_contribution,
    )
    if bottom:
        low = bottom[0]
        explanations.append(f"Weakest signal: {low.component_name} ({low.score} pts, {low.weight:.0f}% weight)")

    if missing_count > 0:
        explanations.append(f"{missing_count} component(s) missing data; confidence {confidence:.0%}")

    return HealthScoreResult(
        overall_score=overall_score,
        band=band,
        component_scores=component_details,
        exceptions_applied=exceptions_applied,
        segment_applied=segment_name,
        confidence=confidence,
        explanation=explanations,
    )


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------

def simulate(
    draft_model: HealthModel,
    published_model: HealthModel,
    customers: list[Customer],
    data_fetcher,  # callable(customer_id) -> (gainsight, gong, tickets, onboarding, volumes)
) -> SimulationSummary:
    """Run a simulation comparing draft vs published model across all customers."""

    results: list[SimulationResult] = []
    total_delta = 0.0
    band_migrations: dict[str, int] = {}

    for cust in customers:
        gs, gong_d, tix, onb, vol = data_fetcher(cust.id)

        old_result = calculate_health_score(cust, published_model, gs, gong_d, tix, onb, vol)
        new_result = calculate_health_score(cust, draft_model, gs, gong_d, tix, onb, vol)

        delta = new_result.overall_score - old_result.overall_score
        total_delta += delta

        sim = SimulationResult(
            customer_id=cust.id,
            customer_name=cust.name,
            old_score=old_result.overall_score,
            new_score=new_result.overall_score,
            old_band=old_result.band,
            new_band=new_result.band,
            delta=delta,
            top_contributors=[
                {"name": d.component_name, "score": d.score, "weight": d.weight}
                for d in sorted(new_result.component_scores, key=lambda x: x.weighted_contribution, reverse=True)[:3]
            ],
        )
        results.append(sim)

        if old_result.band != new_result.band:
            key = f"{old_result.band.lower().replace(' ', '_')}_to_{new_result.band.lower().replace(' ', '_')}"
            band_migrations[key] = band_migrations.get(key, 0) + 1

    n = max(len(customers), 1)
    avg_delta = round(total_delta / n, 2)

    # Sort by absolute delta descending to find most affected
    most_affected = sorted(results, key=lambda r: abs(r.delta), reverse=True)[:10]

    warnings: list[str] = []
    total_weight = sum(c.sensitivity.weight for c in draft_model.components if c.active)
    if abs(total_weight - 100) > 1:
        warnings.append(f"Component weights sum to {total_weight:.0f}% (expected 100%)")
    if len(band_migrations) > 3:
        warnings.append(f"{sum(band_migrations.values())} customers would change bands")
    if abs(avg_delta) > 10:
        warnings.append(f"Large average score shift of {avg_delta:+.1f} points")

    return SimulationSummary(
        total_customers=len(customers),
        avg_score_delta=avg_delta,
        band_migrations=band_migrations,
        most_affected=most_affected,
        warnings=warnings,
    )
