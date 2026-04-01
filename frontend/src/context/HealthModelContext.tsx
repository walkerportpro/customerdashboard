import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  type ReactNode,
} from "react";
import {
  fetchPublishedModel,
  fetchDraftModel,
  saveDraft as apiSaveDraft,
  publishDraft as apiPublishDraft,
  applyPreset as apiApplyPreset,
  rollbackToVersion as apiRollback,
} from "../api/healthModel";
import type {
  HealthModel,
  ScoreComponent,
  ScoreBand,
  SegmentDefinition,
  ExceptionRule,
  AutomationTrigger,
  AuditLogEntry,
  SimulationSummary,
} from "../types";

// ─── Validation types ───────────────────────────────────────────────

interface ValidationResult {
  errors: string[];
  warnings: string[];
}

// ─── Context shape ──────────────────────────────────────────────────

interface HealthModelState {
  published: HealthModel | null;
  draft: HealthModel | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  hasChanges: boolean;
  changeSummary: string[];
  validationErrors: string[];
  validationWarnings: string[];
  lastSimulation: SimulationSummary | null;
  lastSimulationDraftSnapshot: string | null;
  loadModels: () => Promise<void>;
  updateDraft: (updater: (draft: HealthModel) => HealthModel) => void;
  saveDraft: () => Promise<void>;
  discardDraft: () => void;
  publishDraft: (note: string) => Promise<void>;
  loadPreset: (presetId: string) => Promise<void>;
  rollback: (version: number) => Promise<void>;
  setLastSimulation: (sim: SimulationSummary) => void;
}

const HealthModelContext = createContext<HealthModelState>({
  published: null,
  draft: null,
  loading: false,
  saving: false,
  error: null,
  hasChanges: false,
  changeSummary: [],
  validationErrors: [],
  validationWarnings: [],
  lastSimulation: null,
  lastSimulationDraftSnapshot: null,
  loadModels: async () => {},
  updateDraft: () => {},
  saveDraft: async () => {},
  discardDraft: () => {},
  publishDraft: async () => {},
  loadPreset: async () => {},
  rollback: async () => {},
  setLastSimulation: () => {},
});

export function useHealthModel() {
  return useContext(HealthModelContext);
}

// ─── Seed / fallback data ───────────────────────────────────────────

const now = "2026-03-15T10:00:00Z";

function makeSensitivity(weight: number) {
  return {
    weight,
    min_impact: 0,
    max_impact: 100,
    lookback_days: 30,
    decay_period_days: 7,
    smoothing: "moderate" as const,
    volatility_cap: 20,
    directionality: "higher_better" as const,
  };
}

function makeNullHandling() {
  return {
    strategy: "assign_neutral" as const,
    penalty_score: 50,
    confidence_impact: "minor" as const,
  };
}

const SEED_COMPONENTS: ScoreComponent[] = [
  {
    id: "comp-usg",
    name: "Product Usage",
    description: "Measures depth and frequency of product engagement across key features",
    source_system: "gainsight",
    category: "engagement",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(25),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "30d",
    trend_sensitivity: "medium",
    thresholds: [
      { condition: "gte", value: 80, value_upper: null, result_score: 95, label: "Power User" },
      { condition: "gte", value: 60, value_upper: null, result_score: 75, label: "Active" },
      { condition: "gte", value: 40, value_upper: null, result_score: 50, label: "Light" },
      { condition: "gte", value: 20, value_upper: null, result_score: 30, label: "Minimal" },
      { condition: "lt", value: 20, value_upper: null, result_score: 10, label: "Inactive" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-sup",
    name: "Support Burden",
    description: "Evaluates ticket volume, severity and resolution time trends",
    source_system: "freshdesk",
    category: "support",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(15),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "30d",
    trend_sensitivity: "medium",
    thresholds: [
      { condition: "lte", value: 2, value_upper: null, result_score: 95, label: "Minimal" },
      { condition: "lte", value: 5, value_upper: null, result_score: 75, label: "Normal" },
      { condition: "lte", value: 10, value_upper: null, result_score: 50, label: "Elevated" },
      { condition: "lte", value: 20, value_upper: null, result_score: 30, label: "High" },
      { condition: "gt", value: 20, value_upper: null, result_score: 10, label: "Critical" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-bil",
    name: "Billing Health",
    description: "Tracks payment patterns, invoice disputes and subscription status",
    source_system: "stripe",
    category: "financial",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(15),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "90d",
    trend_sensitivity: "low",
    thresholds: [
      { condition: "gte", value: 95, value_upper: null, result_score: 95, label: "Excellent" },
      { condition: "gte", value: 80, value_upper: null, result_score: 75, label: "Good" },
      { condition: "gte", value: 60, value_upper: null, result_score: 50, label: "Fair" },
      { condition: "gte", value: 40, value_upper: null, result_score: 30, label: "Poor" },
      { condition: "lt", value: 40, value_upper: null, result_score: 10, label: "Delinquent" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-rel",
    name: "Relationship Sentiment",
    description: "Analyzes conversation sentiment and relationship strength from call recordings",
    source_system: "gong",
    category: "relationship",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(15),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "60d",
    trend_sensitivity: "high",
    thresholds: [
      { condition: "gte", value: 0.8, value_upper: null, result_score: 95, label: "Strong" },
      { condition: "gte", value: 0.6, value_upper: null, result_score: 75, label: "Positive" },
      { condition: "gte", value: 0.4, value_upper: null, result_score: 50, label: "Neutral" },
      { condition: "gte", value: 0.2, value_upper: null, result_score: 30, label: "Strained" },
      { condition: "lt", value: 0.2, value_upper: null, result_score: 10, label: "Critical" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-imp",
    name: "Implementation Status",
    description: "Tracks onboarding project progress and milestone completion",
    source_system: "rocketlane",
    category: "onboarding",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(10),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "30d",
    trend_sensitivity: "medium",
    thresholds: [
      { condition: "gte", value: 90, value_upper: null, result_score: 95, label: "On Track" },
      { condition: "gte", value: 70, value_upper: null, result_score: 75, label: "Progressing" },
      { condition: "gte", value: 50, value_upper: null, result_score: 50, label: "Behind" },
      { condition: "gte", value: 30, value_upper: null, result_score: 30, label: "At Risk" },
      { condition: "lt", value: 30, value_upper: null, result_score: 10, label: "Stalled" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-esc",
    name: "Escalation Risk",
    description: "Monitors P1/P2 ticket aging and escalation patterns",
    source_system: "freshdesk",
    category: "support",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(5),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "14d",
    trend_sensitivity: "high",
    thresholds: [
      { condition: "eq", value: 0, value_upper: null, result_score: 95, label: "None" },
      { condition: "lte", value: 1, value_upper: null, result_score: 75, label: "Low" },
      { condition: "lte", value: 3, value_upper: null, result_score: 50, label: "Moderate" },
      { condition: "lte", value: 5, value_upper: null, result_score: 30, label: "High" },
      { condition: "gt", value: 5, value_upper: null, result_score: 10, label: "Critical" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-eng",
    name: "Executive Engagement",
    description: "Tracks frequency and quality of executive-level interactions",
    source_system: "gong",
    category: "relationship",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(5),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "90d",
    trend_sensitivity: "low",
    thresholds: [
      { condition: "gte", value: 4, value_upper: null, result_score: 95, label: "Frequent" },
      { condition: "gte", value: 2, value_upper: null, result_score: 75, label: "Regular" },
      { condition: "gte", value: 1, value_upper: null, result_score: 50, label: "Occasional" },
      { condition: "gt", value: 0, value_upper: null, result_score: 30, label: "Rare" },
      { condition: "eq", value: 0, value_upper: null, result_score: 10, label: "None" },
    ],
    created_at: now,
    updated_at: now,
  },
  {
    id: "comp-rnw",
    name: "Renewal Risk",
    description: "Predicts renewal likelihood based on contract terms and engagement trends",
    source_system: "salesforce",
    category: "commercial",
    scoring_method: "threshold",
    sensitivity: makeSensitivity(10),
    null_handling: makeNullHandling(),
    active: true,
    time_window: "90d",
    trend_sensitivity: "medium",
    thresholds: [
      { condition: "gte", value: 80, value_upper: null, result_score: 95, label: "Likely" },
      { condition: "gte", value: 60, value_upper: null, result_score: 75, label: "Probable" },
      { condition: "gte", value: 40, value_upper: null, result_score: 50, label: "Uncertain" },
      { condition: "gte", value: 20, value_upper: null, result_score: 30, label: "Unlikely" },
      { condition: "lt", value: 20, value_upper: null, result_score: 10, label: "Lost" },
    ],
    created_at: now,
    updated_at: now,
  },
];

const SEED_BANDS: ScoreBand[] = [
  { label: "Healthy", min_score: 80, max_score: 100, color: "#10b981" },
  { label: "Monitor", min_score: 60, max_score: 79, color: "#f59e0b" },
  { label: "At Risk", min_score: 40, max_score: 59, color: "#ef4444" },
  { label: "Critical", min_score: 0, max_score: 39, color: "#991b1b" },
];

const SEED_SEGMENTS: SegmentDefinition[] = [
  {
    id: "seg-onb",
    name: "Onboarding",
    description: "Customers currently in active onboarding with priority on implementation progress",
    conditions: [
      { field: "has_active_onboarding", operator: "eq", value: "true" },
    ],
    weight_overrides: { "comp-imp": 25, "comp-usg": 15 },
    threshold_overrides: null,
    active: true,
    priority: 20,
    customer_count: 8,
  },
  {
    id: "seg-strategic",
    name: "Strategic Accounts",
    description: "High-value named accounts with dedicated executive sponsors and custom SLAs",
    conditions: [
      { field: "arr", operator: "gte", value: 500000 },
      { field: "account_tier", operator: "eq", value: "strategic" },
    ],
    weight_overrides: { "comp-rel": 25, "comp-eng": 15, "comp-rnw": 15 },
    threshold_overrides: null,
    active: true,
    priority: 18,
    customer_count: 5,
  },
  {
    id: "seg-ent",
    name: "Enterprise",
    description: "Large enterprise accounts in logistics and freight verticals",
    conditions: [
      { field: "industry", operator: "in", value: ["Logistics", "Freight"] },
    ],
    weight_overrides: { "comp-rel": 20, "comp-eng": 10 },
    threshold_overrides: null,
    active: true,
    priority: 10,
    customer_count: 15,
  },
  {
    id: "seg-smb",
    name: "SMB",
    description: "Small and mid-size businesses outside core logistics verticals",
    conditions: [
      { field: "industry", operator: "not_in", value: ["Logistics", "Freight"] },
    ],
    weight_overrides: { "comp-usg": 30, "comp-sup": 20 },
    threshold_overrides: null,
    active: true,
    priority: 5,
    customer_count: 22,
  },
  {
    id: "seg-no-telemetry",
    name: "No Telemetry",
    description: "Customers without connected product analytics — usage data is unavailable",
    conditions: [
      { field: "has_gainsight", operator: "eq", value: "false" },
    ],
    weight_overrides: { "comp-usg": 0, "comp-sup": 25, "comp-rel": 25, "comp-bil": 20 },
    threshold_overrides: null,
    active: true,
    priority: 12,
    customer_count: 3,
  },
  {
    id: "seg-live",
    name: "Live Customers",
    description: "Post-onboarding customers in steady-state operations with full data coverage",
    conditions: [
      { field: "has_active_onboarding", operator: "eq", value: "false" },
      { field: "account_age_days", operator: "gte", value: 90 },
    ],
    weight_overrides: {},
    threshold_overrides: null,
    active: true,
    priority: 3,
    customer_count: 30,
  },
];

const SEED_EXCEPTIONS: ExceptionRule[] = [
  {
    id: "exc-p1-aging",
    name: "P1 Ticket Aging Override",
    description: "Force Critical when a P1 ticket has been open for more than 48 hours with no resolution in sight",
    conditions: [
      { signal: "open_p1_ticket_count", operator: "gte", value: 1, conjunction: "and" },
      { signal: "p1_ticket_age_hours", operator: "gt", value: 48, conjunction: "and" },
    ],
    action: "force_band",
    action_value: "Critical",
    priority: 100,
    active: true,
    is_hard_override: true,
  },
  {
    id: "exc-sustained-critical",
    name: "Sustained Critical Override",
    description: "Force Critical when a customer has been in critical band for 14 or more consecutive days",
    conditions: [
      { signal: "days_in_critical_band", operator: "gte", value: 14, conjunction: "and" },
    ],
    action: "force_band",
    action_value: "Critical",
    priority: 95,
    active: true,
    is_hard_override: true,
  },
  {
    id: "exc-invoice-overdue",
    name: "Invoice 30+ Days Past Due",
    description: "Cap score at 40 when an invoice is more than 30 days past due — prevents Healthy/Monitor status with outstanding payment issues",
    conditions: [
      { signal: "invoice_days_overdue", operator: "gte", value: 30, conjunction: "and" },
    ],
    action: "cap_score",
    action_value: 40,
    priority: 90,
    active: true,
    is_hard_override: true,
  },
  {
    id: "exc-exec-escalation",
    name: "Executive Escalation Floor",
    description: "Ensure minimum At Risk status when an active executive escalation exists — prevents the score from masking a serious relationship issue",
    conditions: [
      { signal: "active_exec_escalation", operator: "gte", value: 1, conjunction: "and" },
    ],
    action: "force_band",
    action_value: "At Risk",
    priority: 85,
    active: true,
    is_hard_override: true,
  },
  {
    id: "exc-impl-blocked",
    name: "Implementation Blocked",
    description: "Subtract 15 points when a Rocketlane project has been marked as blocked — signals stalled onboarding",
    conditions: [
      { signal: "rocketlane_blocked_projects", operator: "gte", value: 1, conjunction: "and" },
    ],
    action: "subtract_score",
    action_value: 15,
    priority: 75,
    active: true,
    is_hard_override: false,
  },
  {
    id: "exc-low-sentiment",
    name: "Low Sentiment Penalty",
    description: "Subtract 15 points when average Gong sentiment score drops below 0.25 — acts as an early warning for relationship deterioration",
    conditions: [
      { signal: "avg_sentiment_score", operator: "lt", value: 0.25, conjunction: "and" },
    ],
    action: "subtract_score",
    action_value: 15,
    priority: 70,
    active: true,
    is_hard_override: false,
  },
];

const SEED_TRIGGERS: AutomationTrigger[] = [
  {
    id: "trg-at-risk-slack",
    name: "At Risk Slack Alert",
    description: "Send Slack notification when a customer enters the At Risk band",
    trigger_type: "band_entry",
    trigger_config: { band: "At Risk" },
    actions: [
      { type: "slack", config: { channel: "#cs-alerts", template: "at_risk_entry" } },
    ],
    active: true,
  },
  {
    id: "trg-score-drop-email",
    name: "Score Drop Email",
    description: "Email account manager when health score drops by more than 15 points",
    trigger_type: "score_drop",
    trigger_config: { threshold: "15" },
    actions: [
      { type: "email", config: { to: "account_manager", template: "score_drop_alert" } },
    ],
    active: true,
  },
  {
    id: "trg-critical-review",
    name: "Critical Executive Review",
    description: "Create executive review task when a customer enters the Critical band",
    trigger_type: "band_entry",
    trigger_config: { band: "Critical" },
    actions: [
      { type: "exec_review", config: { assignee: "cs_director", template: "critical_review" } },
    ],
    active: true,
  },
];

const SEED_AUDIT_LOG: AuditLogEntry[] = [
  {
    id: "audit-001",
    timestamp: "2026-03-15T10:00:00Z",
    user: "sarah.chen@example.com",
    action: "publish",
    details: "Published version 5 — updated support burden thresholds and added escalation risk component. Simulation showed 3% average improvement across portfolio.",
    version: 5,
    changes: { components_added: ["Escalation Risk"], components_modified: ["Support Burden"], weights_changed: true, simulation_delta: "+3.2%" },
  },
  {
    id: "audit-002",
    timestamp: "2026-03-12T14:30:00Z",
    user: "sarah.chen@example.com",
    action: "draft_save",
    details: "Adjusted Support Burden thresholds — lowered 'Elevated' threshold from 12 to 10 open tickets. Added Escalation Risk as a new scoring component at 5% weight.",
    version: 5,
    changes: { components_added: ["Escalation Risk"], thresholds_modified: ["Support Burden"] },
  },
  {
    id: "audit-003",
    timestamp: "2026-03-10T09:15:00Z",
    user: "mike.johnson@example.com",
    action: "draft_save",
    details: "Experimented with higher Product Usage weight (30%) — reverted after simulation showed 5 customers regressing.",
    version: 5,
    changes: { weights_modified: ["Product Usage"], reverted: true },
  },
  {
    id: "audit-004",
    timestamp: "2026-03-01T09:15:00Z",
    user: "mike.johnson@example.com",
    action: "publish",
    details: "Published version 4 — added Renewal Risk component (10% weight). Redistributed weights from Billing Health and Implementation Status.",
    version: 4,
    changes: { components_added: ["Renewal Risk"], weights_modified: ["Billing Health", "Implementation Status", "Renewal Risk"] },
  },
  {
    id: "audit-005",
    timestamp: "2026-02-20T16:45:00Z",
    user: "lisa.park@example.com",
    action: "publish",
    details: "Published version 3 — added segment-based weight overrides for Onboarding, Enterprise, and SMB customer cohorts. Added 5 exception rules for critical business signals.",
    version: 3,
    changes: { segments_added: ["Onboarding", "Enterprise", "SMB"], exceptions_added: 5 },
  },
  {
    id: "audit-006",
    timestamp: "2026-02-18T11:00:00Z",
    user: "lisa.park@example.com",
    action: "draft_save",
    details: "Configured P1 Ticket Aging Override and Invoice Overdue Cap exception rules. Set P1 ticket rule at priority 100 (highest).",
    version: 3,
    changes: { exceptions_added: ["P1 Ticket Aging Override", "Invoice Overdue Cap"] },
  },
  {
    id: "audit-007",
    timestamp: "2026-02-01T14:00:00Z",
    user: "sarah.chen@example.com",
    action: "publish",
    details: "Published version 2 — rebalanced weights after 2-week observation period. Reduced Support Burden from 20% to 15%, increased Relationship Sentiment from 10% to 15%.",
    version: 2,
    changes: { weights_modified: ["Support Burden", "Relationship Sentiment"] },
  },
  {
    id: "audit-008",
    timestamp: "2026-01-20T11:00:00Z",
    user: "mike.johnson@example.com",
    action: "publish",
    details: "Initial health model published with 6 core components: Product Usage, Support Burden, Billing Health, Relationship Sentiment, Implementation Status, and Executive Engagement.",
    version: 1,
    changes: { initial_setup: true, component_count: 6, scoring_mode: "weighted_average" },
  },
];

function buildSeedModel(status: "published" | "draft"): HealthModel {
  return {
    id: "hm-default",
    name: "Customer Health Score v5",
    description: "Composite health scoring model combining product usage, support metrics, billing health, relationship sentiment, and operational signals",
    status,
    version: 5,
    scoring_mode: "weighted_average",
    components: SEED_COMPONENTS,
    bands: SEED_BANDS,
    segments: SEED_SEGMENTS,
    exceptions: SEED_EXCEPTIONS,
    missing_data_rules: [makeNullHandling()],
    triggers: SEED_TRIGGERS,
    audit_log: SEED_AUDIT_LOG,
    published_at: "2026-03-15T10:00:00Z",
    published_by: "sarah.chen@example.com",
    created_at: "2026-01-20T11:00:00Z",
    updated_at: "2026-03-15T10:00:00Z",
    last_recalculation: "2026-03-15T10:05:00Z",
  };
}

// ─── Validation ─────────────────────────────────────────────────────

function validate(
  model: HealthModel,
  lastSimulation: SimulationSummary | null,
  lastSimDraftSnapshot: string | null,
  currentDraftSnapshot: string,
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // --- Errors ---

  // At least one active component
  const activeComponents = model.components.filter((c) => c.active);
  if (activeComponents.length === 0) {
    errors.push("At least one scoring component must be active.");
  }

  // Bands must cover 0-100 contiguously
  if (model.bands.length > 0) {
    const sorted = [...model.bands].sort((a, b) => a.min_score - b.min_score);
    if (sorted[0].min_score !== 0) {
      errors.push(`Score bands must start at 0 (currently starts at ${sorted[0].min_score}).`);
    }
    if (sorted[sorted.length - 1].max_score !== 100) {
      errors.push(`Score bands must end at 100 (currently ends at ${sorted[sorted.length - 1].max_score}).`);
    }
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].min_score !== sorted[i - 1].max_score + 1) {
        errors.push(
          `Gap or overlap between bands "${sorted[i - 1].label}" (${sorted[i - 1].max_score}) and "${sorted[i].label}" (${sorted[i].min_score}).`,
        );
      }
    }
  } else {
    errors.push("At least one score band must be defined.");
  }

  // Active components must have at least one threshold
  for (const comp of activeComponents) {
    if (comp.thresholds.length === 0) {
      errors.push(`Component "${comp.name}" has no thresholds defined.`);
    }
  }

  // Exception rules with force_band must reference valid band labels
  const bandLabels = new Set(model.bands.map((b) => b.label));
  for (const exc of model.exceptions.filter((e) => e.active)) {
    if (exc.action === "force_band" && !bandLabels.has(String(exc.action_value))) {
      errors.push(
        `Exception "${exc.name}" references band "${exc.action_value}" which does not exist.`,
      );
    }
  }

  // --- Warnings ---

  // Weights not summing to 100
  const totalWeight = activeComponents.reduce((sum, c) => sum + c.sensitivity.weight, 0);
  if (totalWeight !== 100 && activeComponents.length > 0) {
    warnings.push(
      `Active component weights sum to ${totalWeight}% (will be normalized to 100%).`,
    );
  }

  // Single component >50%
  for (const comp of activeComponents) {
    if (comp.sensitivity.weight > 50) {
      warnings.push(
        `"${comp.name}" has weight ${comp.sensitivity.weight}%, which exceeds 50% of the total score.`,
      );
    }
  }

  // Simulation not run
  if (!lastSimulation) {
    warnings.push("No simulation has been run for the current draft.");
  }

  // Simulation stale
  if (lastSimulation && lastSimDraftSnapshot && lastSimDraftSnapshot !== currentDraftSnapshot) {
    warnings.push("Draft has changed since the last simulation. Re-run simulation to preview impact.");
  }

  return { errors, warnings };
}

// ─── Change summary ─────────────────────────────────────────────────

function computeChangeSummary(
  published: HealthModel,
  draft: HealthModel,
): string[] {
  const changes: string[] = [];

  // Weight changes
  const pubWeights = new Map(published.components.map((c) => [c.id, c]));
  const draftWeights = new Map(draft.components.map((c) => [c.id, c]));

  for (const [id, dc] of draftWeights) {
    const pc = pubWeights.get(id);
    if (!pc) {
      changes.push(`Added component: ${dc.name}`);
    } else {
      if (dc.sensitivity.weight !== pc.sensitivity.weight) {
        changes.push(
          `Weight: ${dc.name} ${pc.sensitivity.weight}% \u2192 ${dc.sensitivity.weight}%`,
        );
      }
      if (dc.active !== pc.active) {
        changes.push(`${dc.active ? "Enabled" : "Disabled"} component: ${dc.name}`);
      }
      if (JSON.stringify(dc.thresholds) !== JSON.stringify(pc.thresholds)) {
        changes.push(`Modified thresholds for ${dc.name}`);
      }
    }
  }
  for (const [id, pc] of pubWeights) {
    if (!draftWeights.has(id)) {
      changes.push(`Removed component: ${pc.name}`);
    }
  }

  // Band changes
  if (JSON.stringify(draft.bands) !== JSON.stringify(published.bands)) {
    changes.push("Modified score bands");
  }

  // Segment changes
  const pubSegIds = new Set(published.segments.map((s) => s.id));
  const draftSegIds = new Set(draft.segments.map((s) => s.id));
  for (const seg of draft.segments) {
    if (!pubSegIds.has(seg.id)) {
      changes.push(`Added segment: ${seg.name}`);
    } else {
      const pubSeg = published.segments.find((s) => s.id === seg.id)!;
      if (JSON.stringify(seg) !== JSON.stringify(pubSeg)) {
        changes.push(`Modified segment: ${seg.name}`);
      }
    }
  }
  for (const seg of published.segments) {
    if (!draftSegIds.has(seg.id)) {
      changes.push(`Removed segment: ${seg.name}`);
    }
  }

  // Exception changes
  const pubExcIds = new Set(published.exceptions.map((e) => e.id));
  const draftExcIds = new Set(draft.exceptions.map((e) => e.id));
  for (const exc of draft.exceptions) {
    if (!pubExcIds.has(exc.id)) {
      changes.push(`Added exception: ${exc.name}`);
    } else {
      const pubExc = published.exceptions.find((e) => e.id === exc.id)!;
      if (exc.active !== pubExc.active) {
        changes.push(`${exc.active ? "Enabled" : "Disabled"} exception: ${exc.name}`);
      } else if (JSON.stringify(exc) !== JSON.stringify(pubExc)) {
        changes.push(`Modified exception: ${exc.name}`);
      }
    }
  }
  for (const exc of published.exceptions) {
    if (!draftExcIds.has(exc.id)) {
      changes.push(`Removed exception: ${exc.name}`);
    }
  }

  // Trigger changes
  if (JSON.stringify(draft.triggers) !== JSON.stringify(published.triggers)) {
    changes.push("Modified automation triggers");
  }

  return changes;
}

// ─── Provider ───────────────────────────────────────────────────────

export function HealthModelProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<HealthModel | null>(null);
  const [draft, setDraft] = useState<HealthModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSimulation, setLastSimulation] = useState<SimulationSummary | null>(null);
  const [lastSimulationDraftSnapshot, setLastSimulationDraftSnapshot] = useState<string | null>(null);

  // Load both published and draft models from API, falling back to seed data
  const loadModels = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pub, dft] = await Promise.all([
        fetchPublishedModel(),
        fetchDraftModel(),
      ]);
      setPublished(pub);
      setDraft(dft);
    } catch {
      // API unavailable — use seed data
      setPublished(buildSeedModel("published"));
      setDraft(buildSeedModel("draft"));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount
  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Update draft locally
  const updateDraft = useCallback(
    (updater: (current: HealthModel) => HealthModel) => {
      setDraft((prev) => (prev ? updater(prev) : prev));
    },
    [],
  );

  // Save draft to API
  const saveDraftFn = useCallback(async () => {
    if (!draft) return;
    setSaving(true);
    setError(null);
    try {
      const saved = await apiSaveDraft(draft);
      setDraft(saved);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save draft";
      setError(message);
    } finally {
      setSaving(false);
    }
  }, [draft]);

  // Discard draft — reset to published
  const discardDraft = useCallback(() => {
    if (published) {
      setDraft({ ...published, status: "draft" });
      setLastSimulation(null);
      setLastSimulationDraftSnapshot(null);
    }
  }, [published]);

  // Publish draft
  const publishDraftFn = useCallback(
    async (note: string) => {
      setSaving(true);
      setError(null);
      try {
        const result = await apiPublishDraft("current_user", note);
        setPublished(result);
        setDraft({ ...result, status: "draft" });
        setLastSimulation(null);
        setLastSimulationDraftSnapshot(null);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to publish";
        setError(message);
      } finally {
        setSaving(false);
      }
    },
    [],
  );

  // Apply a preset
  const loadPreset = useCallback(async (presetId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiApplyPreset(presetId);
      setDraft(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to apply preset";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Rollback to a version
  const rollback = useCallback(async (version: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiRollback(version);
      setPublished(result);
      setDraft({ ...result, status: "draft" });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to rollback";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Track simulation
  const handleSetLastSimulation = useCallback(
    (sim: SimulationSummary) => {
      setLastSimulation(sim);
      setLastSimulationDraftSnapshot(draft ? JSON.stringify(draft) : null);
    },
    [draft],
  );

  // Derived state
  const draftSnapshot = useMemo(() => (draft ? JSON.stringify(draft) : ""), [draft]);

  const hasChanges = useMemo(() => {
    if (!published || !draft) return false;
    // Compare ignoring status field
    const pubCopy = { ...published, status: "draft" as const };
    return JSON.stringify(pubCopy) !== JSON.stringify(draft);
  }, [published, draft]);

  const changeSummary = useMemo(() => {
    if (!published || !draft || !hasChanges) return [];
    return computeChangeSummary(published, draft);
  }, [published, draft, hasChanges]);

  const { validationErrors, validationWarnings } = useMemo(() => {
    if (!draft) return { validationErrors: [], validationWarnings: [] };
    const result = validate(draft, lastSimulation, lastSimulationDraftSnapshot, draftSnapshot);
    return { validationErrors: result.errors, validationWarnings: result.warnings };
  }, [draft, lastSimulation, lastSimulationDraftSnapshot, draftSnapshot]);

  const value = useMemo<HealthModelState>(
    () => ({
      published,
      draft,
      loading,
      saving,
      error,
      hasChanges,
      changeSummary,
      validationErrors,
      validationWarnings,
      lastSimulation,
      lastSimulationDraftSnapshot,
      loadModels,
      updateDraft,
      saveDraft: saveDraftFn,
      discardDraft,
      publishDraft: publishDraftFn,
      loadPreset,
      rollback,
      setLastSimulation: handleSetLastSimulation,
    }),
    [
      published,
      draft,
      loading,
      saving,
      error,
      hasChanges,
      changeSummary,
      validationErrors,
      validationWarnings,
      lastSimulation,
      lastSimulationDraftSnapshot,
      loadModels,
      updateDraft,
      saveDraftFn,
      discardDraft,
      publishDraftFn,
      loadPreset,
      rollback,
      handleSetLastSimulation,
    ],
  );

  return (
    <HealthModelContext.Provider value={value}>
      {children}
    </HealthModelContext.Provider>
  );
}
