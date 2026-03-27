export interface Customer {
  id: string;
  name: string;
  industry: string;
  health_score: number;
  account_manager: string;
}

export interface VolumeDataPoint {
  date: string;
  value: number;
}

export interface VolumeTrend {
  data: VolumeDataPoint[];
  trend: "up" | "down" | "flat";
  change_pct: number;
}

export interface GainsightMetrics {
  health_score: number;
  mobile_app_usage_pct: number;
  tariffs_automation_pct: number;
}

export interface BadCall {
  call_id: string;
  date: string;
  summary: string;
  participants: string[];
  sentiment_score: number;
  url?: string;
}

export interface DashboardData {
  customers: Customer[];
  connected_integrations: string[];
  gong: GongData | null;
  gainsight: GainsightMetrics | null;
  load_volumes: VolumeTrend | null;
  invoice_volumes: VolumeTrend | null;
  tickets: TicketSummary | null;
}

export interface GongData {
  overall_sentiment: "positive" | "neutral" | "negative";
  sentiment_score: number;
  recent_calls: number;
  bad_calls: BadCall[];
}

export interface OnboardingProject {
  project_name: string;
  status: string;
  phase: string;
  percent_complete: number;
  due_date: string;
}

export interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

export interface TicketSummary {
  total_open: number;
  by_priority: Record<string, number>;
  tickets: Ticket[];
}

// Health Model Configuration Types

export interface SensitivityConfig {
  weight: number;
  min_impact: number;
  max_impact: number;
  lookback_days: number;
  decay_period_days: number;
  smoothing: "none" | "light" | "moderate" | "heavy";
  volatility_cap: number;
  directionality: "higher_better" | "lower_better" | "deviation_bad";
}

export interface NullHandling {
  strategy: "ignore_redistribute" | "assign_neutral" | "assign_penalty" | "mark_low_confidence";
  penalty_score: number;
  confidence_impact: "none" | "minor" | "major" | "critical";
}

export interface ComponentThreshold {
  condition: "gte" | "lte" | "gt" | "lt" | "eq" | "between";
  value: number;
  value_upper: number | null;
  result_score: number;
  label: string;
}

export interface ScoreComponent {
  id: string;
  name: string;
  description: string;
  source_system: string;
  category: string;
  scoring_method: string;
  sensitivity: SensitivityConfig;
  null_handling: NullHandling;
  active: boolean;
  time_window: string;
  trend_sensitivity: string;
  thresholds: ComponentThreshold[];
  created_at: string;
  updated_at: string;
}

export interface ScoreBand {
  label: string;
  color: string;
  min_score: number;
  max_score: number;
}

export interface SegmentCondition {
  field: string;
  operator: string;
  value: string | number | string[];
}

export interface SegmentDefinition {
  id: string;
  name: string;
  description: string;
  conditions: SegmentCondition[];
  weight_overrides: Record<string, number>;
  threshold_overrides: ScoreBand[] | null;
  active: boolean;
  priority: number;
  customer_count: number;
}

export interface ExceptionCondition {
  signal: string;
  operator: string;
  value: string | number;
  conjunction: "and" | "or";
}

export interface ExceptionRule {
  id: string;
  name: string;
  description: string;
  conditions: ExceptionCondition[];
  action: string;
  action_value: string | number;
  priority: number;
  active: boolean;
  is_hard_override: boolean;
}

export interface TriggerAction {
  type: string;
  config: Record<string, string>;
}

export interface AutomationTrigger {
  id: string;
  name: string;
  description: string;
  trigger_type: string;
  trigger_config: Record<string, string | number>;
  actions: TriggerAction[];
  active: boolean;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  details: string;
  version: number;
  changes: Record<string, unknown>;
}

export interface SimulationResult {
  customer_id: string;
  customer_name: string;
  old_score: number;
  new_score: number;
  old_band: string;
  new_band: string;
  delta: number;
  top_contributors: Record<string, unknown>[];
}

export interface SimulationSummary {
  total_customers: number;
  avg_score_delta: number;
  band_migrations: Record<string, number>;
  most_affected: SimulationResult[];
  warnings: string[];
}

export interface HealthModel {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published";
  version: number;
  scoring_mode: "weighted_average" | "rule_based";
  components: ScoreComponent[];
  bands: ScoreBand[];
  segments: SegmentDefinition[];
  exceptions: ExceptionRule[];
  missing_data_rules: NullHandling[];
  triggers: AutomationTrigger[];
  audit_log: AuditLogEntry[];
  published_at: string;
  published_by: string;
  created_at: string;
  updated_at: string;
  last_recalculation: string;
}
