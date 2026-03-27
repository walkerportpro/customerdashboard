from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field

import uuid


def _id() -> str:
    return str(uuid.uuid4())[:8]


# ---------------------------------------------------------------------------
# Low-level building blocks (order matters for forward references)
# ---------------------------------------------------------------------------

class ScoreBand(BaseModel):
    label: str  # "Healthy", "Monitor", "At Risk", "Critical"
    color: str  # hex color
    min_score: int
    max_score: int


class SensitivityConfig(BaseModel):
    weight: float = 0  # 0-100, percentage
    min_impact: float = 0
    max_impact: float = 100
    lookback_days: int = 30
    decay_period_days: int = 0
    smoothing: Literal["none", "light", "moderate", "heavy"] = "none"
    volatility_cap: float = 20  # max score change per recalc
    directionality: Literal["higher_better", "lower_better", "deviation_bad"] = "higher_better"


class NullHandling(BaseModel):
    strategy: Literal["ignore_redistribute", "assign_neutral", "assign_penalty", "mark_low_confidence"] = "assign_neutral"
    penalty_score: int = 30
    confidence_impact: Literal["none", "minor", "major", "critical"] = "minor"


class ComponentThreshold(BaseModel):
    condition: Literal["gte", "lte", "gt", "lt", "eq", "between"] = "gte"
    value: float = 0
    value_upper: float | None = None  # for "between"
    result_score: int = 50  # score assigned when condition met
    label: str = ""


class ScoreComponent(BaseModel):
    id: str = Field(default_factory=_id)
    name: str
    description: str = ""
    source_system: str  # "gainsight", "gong", "stripe", "freshdesk", "rocketlane", "salesforce", "slack", "manual"
    category: str  # "usage", "support", "billing", "relationship", "implementation", "escalation", "engagement", "renewal"
    scoring_method: Literal["threshold", "range", "boolean", "point_accumulation", "recency_decay", "trend", "manual_pulse", "external"] = "range"
    sensitivity: SensitivityConfig = Field(default_factory=SensitivityConfig)
    null_handling: NullHandling = Field(default_factory=NullHandling)
    active: bool = True
    time_window: Literal["7d", "14d", "30d", "90d", "rolling_avg", "latest"] = "30d"
    trend_sensitivity: Literal["absolute", "pct_change", "direction", "acceleration"] = "absolute"
    thresholds: list[ComponentThreshold] = Field(default_factory=list)
    created_at: str = ""
    updated_at: str = ""


class SegmentCondition(BaseModel):
    field: str  # "industry", "health_score", "arr", "lifecycle_stage", etc.
    operator: Literal["eq", "neq", "gt", "lt", "gte", "lte", "in", "not_in", "contains"] = "eq"
    value: str | float | list[str] = ""


class SegmentDefinition(BaseModel):
    id: str = Field(default_factory=_id)
    name: str
    description: str = ""
    conditions: list[SegmentCondition] = Field(default_factory=list)
    weight_overrides: dict[str, float] = Field(default_factory=dict)  # component_id -> weight
    threshold_overrides: list[ScoreBand] | None = None
    active: bool = True
    priority: int = 0  # higher = checked first
    customer_count: int = 0


class ExceptionCondition(BaseModel):
    signal: str  # "open_p1_tickets", "invoice_days_overdue", "project_status", etc.
    operator: Literal["eq", "neq", "gt", "lt", "gte", "lte"] = "gte"
    value: str | float = 0
    conjunction: Literal["and", "or"] = "and"


class ExceptionRule(BaseModel):
    id: str = Field(default_factory=_id)
    name: str
    description: str = ""
    conditions: list[ExceptionCondition] = Field(default_factory=list)
    action: Literal["force_band", "cap_score", "floor_score", "add_points", "subtract_points"] = "force_band"
    action_value: str | int = "at_risk"  # band label or point value
    priority: int = 0
    active: bool = True
    is_hard_override: bool = True  # hard override vs soft modifier


class TriggerAction(BaseModel):
    type: Literal["slack_alert", "email_notify", "create_task", "assign_playbook", "flag_exec_review"] = "slack_alert"
    config: dict = Field(default_factory=dict)  # channel, recipient, template, etc.


class AutomationTrigger(BaseModel):
    id: str = Field(default_factory=_id)
    name: str
    description: str = ""
    trigger_type: Literal["enters_band", "exits_band", "score_drops", "score_rises", "component_threshold", "sustained_state"] = "enters_band"
    trigger_config: dict = Field(default_factory=dict)  # band, points, days, component_id, etc.
    actions: list[TriggerAction] = Field(default_factory=list)
    active: bool = True


class AuditLogEntry(BaseModel):
    id: str = Field(default_factory=_id)
    timestamp: str = ""
    user: str = "admin"
    action: str  # "published", "updated_component", "added_exception", etc.
    details: str = ""
    version: int = 1
    changes: dict = Field(default_factory=dict)


class SimulationResult(BaseModel):
    customer_id: str
    customer_name: str
    old_score: int
    new_score: int
    old_band: str
    new_band: str
    delta: int
    top_contributors: list[dict] = Field(default_factory=list)


class SimulationSummary(BaseModel):
    total_customers: int = 0
    avg_score_delta: float = 0
    band_migrations: dict[str, int] = Field(default_factory=dict)  # "at_risk_to_monitor": 3
    most_affected: list[SimulationResult] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)


class HealthModel(BaseModel):
    id: str = Field(default_factory=_id)
    name: str = "Default Health Model"
    description: str = ""
    status: Literal["draft", "published"] = "draft"
    version: int = 1
    scoring_mode: Literal["weighted_average", "rule_based"] = "weighted_average"
    components: list[ScoreComponent] = Field(default_factory=list)
    bands: list[ScoreBand] = Field(default_factory=list)
    segments: list[SegmentDefinition] = Field(default_factory=list)
    exceptions: list[ExceptionRule] = Field(default_factory=list)
    missing_data_rules: list[NullHandling] = Field(default_factory=list)
    triggers: list[AutomationTrigger] = Field(default_factory=list)
    audit_log: list[AuditLogEntry] = Field(default_factory=list)
    published_at: str = ""
    published_by: str = ""
    created_at: str = ""
    updated_at: str = ""
    last_recalculation: str = ""


# ---------------------------------------------------------------------------
# Health engine result types
# ---------------------------------------------------------------------------

class ComponentScoreDetail(BaseModel):
    component_id: str
    component_name: str
    category: str
    raw_value: float | None = None
    score: int = 50
    weight: float = 0
    weighted_contribution: float = 0
    source_system: str = ""
    data_available: bool = True
    explanation: str = ""


class HealthScoreResult(BaseModel):
    overall_score: int = 50
    band: str = "Monitor"
    component_scores: list[ComponentScoreDetail] = Field(default_factory=list)
    exceptions_applied: list[str] = Field(default_factory=list)
    segment_applied: str | None = None
    confidence: float = 1.0
    explanation: list[str] = Field(default_factory=list)
