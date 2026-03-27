"""In-memory store for health model configurations.

Holds the published model, draft model, version history, and preset templates.
"""

from __future__ import annotations

import copy
from datetime import datetime

from models.health_models import (
    AuditLogEntry,
    AutomationTrigger,
    ComponentThreshold,
    ExceptionCondition,
    ExceptionRule,
    HealthModel,
    NullHandling,
    ScoreBand,
    ScoreComponent,
    SegmentCondition,
    SegmentDefinition,
    SensitivityConfig,
    TriggerAction,
)

# ---------------------------------------------------------------------------
# Shared bands
# ---------------------------------------------------------------------------

DEFAULT_BANDS = [
    ScoreBand(label="Healthy", color="#10b981", min_score=80, max_score=100),
    ScoreBand(label="Monitor", color="#f59e0b", min_score=60, max_score=79),
    ScoreBand(label="At Risk", color="#ef4444", min_score=40, max_score=59),
    ScoreBand(label="Critical", color="#991b1b", min_score=0, max_score=39),
]

# ---------------------------------------------------------------------------
# Seed components for the Balanced model
# ---------------------------------------------------------------------------

_NOW = "2026-03-20T10:00:00Z"

BALANCED_COMPONENTS = [
    ScoreComponent(
        id="comp-usg",
        name="Product Usage",
        description="Measures how actively the customer uses the platform based on Gainsight telemetry.",
        source_system="gainsight",
        category="usage",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=25, directionality="higher_better", lookback_days=30, smoothing="light"),
        thresholds=[
            ComponentThreshold(condition="gte", value=80, result_score=95, label="Power user"),
            ComponentThreshold(condition="gte", value=60, result_score=75, label="Active"),
            ComponentThreshold(condition="gte", value=40, result_score=50, label="Moderate"),
            ComponentThreshold(condition="gte", value=20, result_score=30, label="Low usage"),
            ComponentThreshold(condition="lt", value=20, result_score=10, label="Dormant"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-sup",
        name="Support Burden",
        description="Tracks open ticket volume and priority distribution from Freshdesk.",
        source_system="freshdesk",
        category="support",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=15, directionality="lower_better", lookback_days=30),
        thresholds=[
            ComponentThreshold(condition="lte", value=2, result_score=95, label="Minimal"),
            ComponentThreshold(condition="lte", value=5, result_score=75, label="Normal"),
            ComponentThreshold(condition="lte", value=10, result_score=50, label="Elevated"),
            ComponentThreshold(condition="lte", value=15, result_score=30, label="High"),
            ComponentThreshold(condition="gt", value=15, result_score=10, label="Critical"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-bil",
        name="Billing Health",
        description="Evaluates billing status from Stripe: overdue invoices, payment failures.",
        source_system="stripe",
        category="billing",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=15, directionality="lower_better", lookback_days=90),
        thresholds=[
            ComponentThreshold(condition="eq", value=0, result_score=100, label="Current"),
            ComponentThreshold(condition="lte", value=15, result_score=70, label="Slightly overdue"),
            ComponentThreshold(condition="lte", value=30, result_score=40, label="Overdue"),
            ComponentThreshold(condition="gt", value=30, result_score=10, label="Severely overdue"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-rel",
        name="Relationship Sentiment",
        description="Gong call sentiment analysis across recent interactions.",
        source_system="gong",
        category="relationship",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=15, directionality="higher_better", lookback_days=30, smoothing="moderate"),
        thresholds=[
            ComponentThreshold(condition="gte", value=0.7, result_score=95, label="Very positive"),
            ComponentThreshold(condition="gte", value=0.5, result_score=70, label="Positive"),
            ComponentThreshold(condition="gte", value=0.35, result_score=45, label="Neutral"),
            ComponentThreshold(condition="lt", value=0.35, result_score=20, label="Negative"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-imp",
        name="Implementation Status",
        description="Rocketlane project progress vs. timeline.",
        source_system="rocketlane",
        category="implementation",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=10, directionality="higher_better", lookback_days=90),
        thresholds=[
            ComponentThreshold(condition="gte", value=90, result_score=95, label="Complete / on track"),
            ComponentThreshold(condition="gte", value=60, result_score=70, label="Progressing"),
            ComponentThreshold(condition="gte", value=30, result_score=45, label="Behind"),
            ComponentThreshold(condition="lt", value=30, result_score=20, label="Stalled"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-esc",
        name="Escalation Risk",
        description="Number and severity of escalated tickets in Freshdesk.",
        source_system="freshdesk",
        category="escalation",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=5, directionality="lower_better", lookback_days=14),
        thresholds=[
            ComponentThreshold(condition="eq", value=0, result_score=100, label="None"),
            ComponentThreshold(condition="eq", value=1, result_score=60, label="Low"),
            ComponentThreshold(condition="lte", value=3, result_score=35, label="Medium"),
            ComponentThreshold(condition="gt", value=3, result_score=10, label="High"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-eng",
        name="Executive Engagement",
        description="Frequency and recency of executive-level Gong calls.",
        source_system="gong",
        category="engagement",
        scoring_method="range",
        sensitivity=SensitivityConfig(weight=5, directionality="higher_better", lookback_days=60),
        thresholds=[
            ComponentThreshold(condition="gte", value=10, result_score=95, label="High engagement"),
            ComponentThreshold(condition="gte", value=5, result_score=70, label="Moderate"),
            ComponentThreshold(condition="gte", value=2, result_score=45, label="Low"),
            ComponentThreshold(condition="lt", value=2, result_score=20, label="Disengaged"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
    ScoreComponent(
        id="comp-ren",
        name="Renewal Risk",
        description="Salesforce renewal pipeline data and risk signals.",
        source_system="salesforce",
        category="renewal",
        scoring_method="trend",
        sensitivity=SensitivityConfig(weight=10, directionality="higher_better", lookback_days=90, smoothing="moderate"),
        thresholds=[
            ComponentThreshold(condition="gte", value=5, result_score=90, label="Growing"),
            ComponentThreshold(condition="gte", value=0, result_score=70, label="Stable"),
            ComponentThreshold(condition="gte", value=-5, result_score=45, label="Declining"),
            ComponentThreshold(condition="lt", value=-5, result_score=15, label="Churning"),
        ],
        created_at=_NOW,
        updated_at=_NOW,
    ),
]

# ---------------------------------------------------------------------------
# Segments
# ---------------------------------------------------------------------------

BALANCED_SEGMENTS = [
    SegmentDefinition(
        id="seg-ent",
        name="Enterprise",
        description="Large logistics and freight customers",
        conditions=[SegmentCondition(field="industry", operator="in", value=["Logistics", "Freight"])],
        weight_overrides={"comp-rel": 20, "comp-eng": 10},
        priority=10,
        active=True,
    ),
    SegmentDefinition(
        id="seg-smb",
        name="SMB",
        description="Small and mid-market customers",
        conditions=[SegmentCondition(field="industry", operator="not_in", value=["Logistics", "Freight"])],
        weight_overrides={"comp-usg": 30, "comp-sup": 20},
        priority=5,
        active=True,
    ),
    SegmentDefinition(
        id="seg-onb",
        name="Onboarding",
        description="Customers with active Rocketlane projects",
        conditions=[SegmentCondition(field="has_active_onboarding", operator="eq", value="true")],
        weight_overrides={"comp-imp": 25, "comp-usg": 15},
        priority=15,
        active=True,
    ),
]

# ---------------------------------------------------------------------------
# Exception rules
# ---------------------------------------------------------------------------

BALANCED_EXCEPTIONS = [
    ExceptionRule(
        id="exc-p1",
        name="P1 ticket open > 48 hours",
        description="Force At Risk when a P1 ticket has been open longer than 48 hours.",
        conditions=[ExceptionCondition(signal="open_p1_ticket_hours", operator="gt", value=48)],
        action="force_band",
        action_value="At Risk",
        priority=100,
        is_hard_override=True,
    ),
    ExceptionRule(
        id="exc-inv",
        name="Invoice > 30 days overdue",
        description="Cap score at 40 when an invoice is more than 30 days overdue.",
        conditions=[ExceptionCondition(signal="invoice_days_overdue", operator="gt", value=30)],
        action="cap_score",
        action_value=40,
        priority=90,
        is_hard_override=True,
    ),
    ExceptionRule(
        id="exc-impl",
        name="Implementation behind > 21 days",
        description="Force Monitor when implementation is behind schedule by more than 21 days.",
        conditions=[ExceptionCondition(signal="implementation_days_behind", operator="gt", value=21)],
        action="force_band",
        action_value="Monitor",
        priority=80,
        is_hard_override=True,
    ),
    ExceptionRule(
        id="exc-sent",
        name="Low Gong sentiment",
        description="Subtract 15 points when Gong sentiment score is below 0.25.",
        conditions=[ExceptionCondition(signal="gong_sentiment_score", operator="lt", value=0.25)],
        action="subtract_points",
        action_value=15,
        priority=70,
        is_hard_override=False,
    ),
    ExceptionRule(
        id="exc-crit",
        name="Sustained Critical state",
        description="Flag for executive review when health score has been Critical for 14+ days.",
        conditions=[ExceptionCondition(signal="days_in_critical", operator="gte", value=14)],
        action="force_band",
        action_value="Critical",
        priority=95,
        is_hard_override=True,
    ),
]

# ---------------------------------------------------------------------------
# Automation triggers
# ---------------------------------------------------------------------------

BALANCED_TRIGGERS = [
    AutomationTrigger(
        id="trg-atrisk",
        name="Enters At Risk",
        description="Alert Slack when a customer enters the At Risk band.",
        trigger_type="enters_band",
        trigger_config={"band": "At Risk"},
        actions=[TriggerAction(type="slack_alert", config={"channel": "#cs-alerts", "template": "at_risk_entry"})],
    ),
    AutomationTrigger(
        id="trg-drop15",
        name="Score drops > 15 in 7 days",
        description="Notify account owner when score drops more than 15 points within 7 days.",
        trigger_type="score_drops",
        trigger_config={"points": 15, "days": 7},
        actions=[TriggerAction(type="email_notify", config={"recipient": "account_owner", "template": "score_drop_alert"})],
    ),
    AutomationTrigger(
        id="trg-critical",
        name="Enters Critical",
        description="Flag for executive review when a customer enters the Critical band.",
        trigger_type="enters_band",
        trigger_config={"band": "Critical"},
        actions=[TriggerAction(type="flag_exec_review", config={"escalation_level": "VP", "sla_hours": 24})],
    ),
]

# ---------------------------------------------------------------------------
# Audit log seed data
# ---------------------------------------------------------------------------

SEED_AUDIT_LOG = [
    AuditLogEntry(
        id="aud-001",
        timestamp="2026-01-10T09:00:00Z",
        user="sarah.chen@example.com",
        action="created_model",
        details="Initial health model created with 6 components.",
        version=1,
    ),
    AuditLogEntry(
        id="aud-002",
        timestamp="2026-01-25T14:30:00Z",
        user="james.wilson@example.com",
        action="added_component",
        details="Added Executive Engagement and Renewal Risk components.",
        version=2,
        changes={"added": ["comp-eng", "comp-ren"]},
    ),
    AuditLogEntry(
        id="aud-003",
        timestamp="2026-02-05T11:15:00Z",
        user="sarah.chen@example.com",
        action="updated_weights",
        details="Rebalanced weights: reduced Support from 20% to 15%, added 5% to Escalation Risk.",
        version=3,
        changes={"comp-sup": {"old_weight": 20, "new_weight": 15}, "comp-esc": {"old_weight": 0, "new_weight": 5}},
    ),
    AuditLogEntry(
        id="aud-004",
        timestamp="2026-02-20T16:45:00Z",
        user="lisa.park@example.com",
        action="added_exception",
        details="Added P1 ticket and invoice overdue exception rules.",
        version=4,
        changes={"added_exceptions": ["exc-p1", "exc-inv"]},
    ),
    AuditLogEntry(
        id="aud-005",
        timestamp="2026-03-15T10:00:00Z",
        user="sarah.chen@example.com",
        action="published",
        details="Published model v5 after simulation showed 3% average score improvement.",
        version=5,
    ),
]


# ---------------------------------------------------------------------------
# Build the default "Balanced" model
# ---------------------------------------------------------------------------

def _build_balanced_model() -> HealthModel:
    return HealthModel(
        id="model-balanced",
        name="Balanced",
        description="A balanced health model weighing usage, support, billing, and relationship signals evenly.",
        status="published",
        version=5,
        scoring_mode="weighted_average",
        components=copy.deepcopy(BALANCED_COMPONENTS),
        bands=copy.deepcopy(DEFAULT_BANDS),
        segments=copy.deepcopy(BALANCED_SEGMENTS),
        exceptions=copy.deepcopy(BALANCED_EXCEPTIONS),
        missing_data_rules=[NullHandling(strategy="assign_neutral", confidence_impact="minor")],
        triggers=copy.deepcopy(BALANCED_TRIGGERS),
        audit_log=copy.deepcopy(SEED_AUDIT_LOG),
        published_at="2026-03-15T10:00:00Z",
        published_by="sarah.chen@example.com",
        created_at="2026-01-10T09:00:00Z",
        updated_at="2026-03-15T10:00:00Z",
        last_recalculation="2026-03-20T06:00:00Z",
    )


# ---------------------------------------------------------------------------
# Preset templates
# ---------------------------------------------------------------------------

def _build_growth_focused() -> HealthModel:
    comps = copy.deepcopy(BALANCED_COMPONENTS)
    weight_map = {
        "comp-usg": 35, "comp-sup": 10, "comp-bil": 10, "comp-rel": 10,
        "comp-imp": 5, "comp-esc": 5, "comp-eng": 15, "comp-ren": 10,
    }
    for c in comps:
        c.sensitivity.weight = weight_map.get(c.id, c.sensitivity.weight)
    return HealthModel(
        id="preset-growth",
        name="Growth Focused",
        description="Prioritises product usage and executive engagement to drive expansion.",
        status="draft",
        version=1,
        components=comps,
        bands=copy.deepcopy(DEFAULT_BANDS),
        segments=copy.deepcopy(BALANCED_SEGMENTS),
        exceptions=copy.deepcopy(BALANCED_EXCEPTIONS),
        triggers=copy.deepcopy(BALANCED_TRIGGERS),
        created_at=_NOW,
        updated_at=_NOW,
    )


def _build_support_heavy() -> HealthModel:
    comps = copy.deepcopy(BALANCED_COMPONENTS)
    weight_map = {
        "comp-usg": 15, "comp-sup": 30, "comp-bil": 10, "comp-rel": 10,
        "comp-imp": 5, "comp-esc": 15, "comp-eng": 5, "comp-ren": 10,
    }
    for c in comps:
        c.sensitivity.weight = weight_map.get(c.id, c.sensitivity.weight)
    return HealthModel(
        id="preset-support",
        name="Support Heavy",
        description="Emphasises support ticket burden and escalation risk.",
        status="draft",
        version=1,
        components=comps,
        bands=copy.deepcopy(DEFAULT_BANDS),
        segments=copy.deepcopy(BALANCED_SEGMENTS),
        exceptions=copy.deepcopy(BALANCED_EXCEPTIONS),
        triggers=copy.deepcopy(BALANCED_TRIGGERS),
        created_at=_NOW,
        updated_at=_NOW,
    )


def _build_payment_risk() -> HealthModel:
    comps = copy.deepcopy(BALANCED_COMPONENTS)
    weight_map = {
        "comp-usg": 10, "comp-sup": 10, "comp-bil": 30, "comp-rel": 5,
        "comp-imp": 5, "comp-esc": 5, "comp-eng": 5, "comp-ren": 30,
    }
    for c in comps:
        c.sensitivity.weight = weight_map.get(c.id, c.sensitivity.weight)
    return HealthModel(
        id="preset-payment",
        name="Payment Risk",
        description="Focuses on billing health and renewal risk for revenue protection.",
        status="draft",
        version=1,
        components=comps,
        bands=copy.deepcopy(DEFAULT_BANDS),
        segments=copy.deepcopy(BALANCED_SEGMENTS),
        exceptions=copy.deepcopy(BALANCED_EXCEPTIONS),
        triggers=copy.deepcopy(BALANCED_TRIGGERS),
        created_at=_NOW,
        updated_at=_NOW,
    )


def _build_onboarding_first() -> HealthModel:
    comps = copy.deepcopy(BALANCED_COMPONENTS)
    weight_map = {
        "comp-usg": 15, "comp-sup": 10, "comp-bil": 5, "comp-rel": 10,
        "comp-imp": 35, "comp-esc": 5, "comp-eng": 10, "comp-ren": 10,
    }
    for c in comps:
        c.sensitivity.weight = weight_map.get(c.id, c.sensitivity.weight)
    return HealthModel(
        id="preset-onboarding",
        name="Onboarding First",
        description="Heavy weight on implementation progress for onboarding-phase customers.",
        status="draft",
        version=1,
        components=comps,
        bands=copy.deepcopy(DEFAULT_BANDS),
        segments=copy.deepcopy(BALANCED_SEGMENTS),
        exceptions=copy.deepcopy(BALANCED_EXCEPTIONS),
        triggers=copy.deepcopy(BALANCED_TRIGGERS),
        created_at=_NOW,
        updated_at=_NOW,
    )


# ---------------------------------------------------------------------------
# In-memory state
# ---------------------------------------------------------------------------

_published: HealthModel = _build_balanced_model()
_draft: HealthModel = copy.deepcopy(_published)
_draft.status = "draft"
_version_history: list[HealthModel] = [copy.deepcopy(_published)]

_presets: dict[str, HealthModel] = {
    "preset-balanced": _build_balanced_model(),
    "preset-growth": _build_growth_focused(),
    "preset-support": _build_support_heavy(),
    "preset-payment": _build_payment_risk(),
    "preset-onboarding": _build_onboarding_first(),
}


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

def get_published_model() -> HealthModel:
    return copy.deepcopy(_published)


def get_draft_model() -> HealthModel:
    return copy.deepcopy(_draft)


def save_draft(model: HealthModel) -> HealthModel:
    global _draft
    model.status = "draft"
    model.updated_at = datetime.utcnow().isoformat() + "Z"
    _draft = copy.deepcopy(model)
    return copy.deepcopy(_draft)


def publish_draft(user: str = "admin", note: str = "") -> HealthModel:
    global _published, _draft
    now = datetime.utcnow().isoformat() + "Z"

    _draft.version = _published.version + 1
    _draft.status = "published"
    _draft.published_at = now
    _draft.published_by = user
    _draft.updated_at = now
    _draft.audit_log.append(
        AuditLogEntry(
            timestamp=now,
            user=user,
            action="published",
            details=note or f"Published version {_draft.version}",
            version=_draft.version,
        )
    )

    _published = copy.deepcopy(_draft)
    _version_history.append(copy.deepcopy(_published))

    # Reset draft to a copy of the newly published model
    _draft = copy.deepcopy(_published)
    _draft.status = "draft"

    return copy.deepcopy(_published)


def get_version_history() -> list[HealthModel]:
    return [copy.deepcopy(m) for m in _version_history]


def rollback_to_version(version: int) -> HealthModel:
    global _draft
    target = next((m for m in _version_history if m.version == version), None)
    if target is None:
        raise ValueError(f"Version {version} not found in history")
    _draft = copy.deepcopy(target)
    _draft.status = "draft"
    _draft.updated_at = datetime.utcnow().isoformat() + "Z"
    return copy.deepcopy(_draft)


def list_presets() -> list[HealthModel]:
    return [copy.deepcopy(p) for p in _presets.values()]


def get_preset(preset_id: str) -> HealthModel | None:
    p = _presets.get(preset_id)
    return copy.deepcopy(p) if p else None


def apply_preset(preset_id: str) -> HealthModel:
    preset = _presets.get(preset_id)
    if preset is None:
        raise ValueError(f"Preset '{preset_id}' not found")
    return save_draft(copy.deepcopy(preset))
