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
