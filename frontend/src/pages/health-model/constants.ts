/**
 * Shared constants and utilities for the Health Model admin area.
 * Single source of truth for labels, colors, and formatting.
 */

import type {
  Database,
} from "lucide-react";

// Re-export icon imports so tabs don't need to import lucide-react individually for source icons
export {
  TrendingUp,
  Headphones,
  CreditCard,
  Target,
  Rocket,
  Database,
} from "lucide-react";

// ─── Source system config ──────────────────────────────────────────

export const SOURCE_CONFIG: Record<string, { label: string; iconName: string; color: string }> = {
  gainsight: { label: "Gainsight", iconName: "TrendingUp", color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  freshdesk: { label: "Freshdesk", iconName: "Headphones", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  stripe: { label: "Stripe", iconName: "CreditCard", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  gong: { label: "Gong", iconName: "Target", color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  rocketlane: { label: "Rocketlane", iconName: "Rocket", color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  salesforce: { label: "Salesforce", iconName: "Database", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

export function sourceLabel(source: string): string {
  return SOURCE_CONFIG[source]?.label ?? source;
}

// ─── Category badge colors ─────────────────────────────────────────

export const CATEGORY_BADGE: Record<string, string> = {
  engagement: "bg-accent-500/10 text-accent-400 border-accent-500/20",
  support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  financial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  relationship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  onboarding: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  commercial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export const CATEGORY_BAR_COLOR: Record<string, string> = {
  engagement: "accent-500",
  support: "emerald-500",
  financial: "purple-500",
  relationship: "violet-500",
  onboarding: "cyan-500",
  commercial: "blue-500",
};

// ─── Scoring method labels ─────────────────────────────────────────

export const SCORING_METHOD_LABELS: Record<string, string> = {
  threshold: "Threshold — first matching rule wins",
  range: "Range — linear interpolation",
  boolean: "Boolean — binary condition",
  trend: "Trend — direction of change",
  point_accumulation: "Point Accumulation — event count",
  recency_decay: "Recency Decay — time since event",
  manual_pulse: "Manual Pulse — CSM input",
  external: "External — third-party model",
};

export const SCORING_METHOD_SHORT: Record<string, string> = {
  threshold: "Threshold",
  range: "Range",
  boolean: "Boolean",
  trend: "Trend",
  point_accumulation: "Point Accum.",
  recency_decay: "Recency Decay",
  manual_pulse: "Manual Pulse",
  external: "External",
};

// ─── Directionality labels ─────────────────────────────────────────

export const DIRECTIONALITY_LABELS: Record<string, string> = {
  higher_better: "↑ Higher is better",
  lower_better: "↓ Lower is better",
  deviation_bad: "↔ Deviation is bad",
};

// ─── Null handling strategy labels ─────────────────────────────────

export const NULL_STRATEGY_LABELS: Record<string, string> = {
  assign_neutral: "Assign Neutral (50)",
  assign_penalty: "Assign Penalty",
  ignore_redistribute: "Ignore & Redistribute",
  mark_low_confidence: "Mark Low Confidence",
};

export const CONFIDENCE_IMPACT_LABELS: Record<string, string> = {
  none: "None",
  minor: "Minor (−5%)",
  major: "Major (−15%)",
  critical: "Critical (−30%)",
};

// ─── Exception action labels ───────────────────────────────────────

export function actionLabel(action: string, value: string | number): string {
  switch (action) {
    case "force_band": return `Force → ${value}`;
    case "cap_score": return `Cap at ${value}`;
    case "floor_score": return `Floor at ${value}`;
    case "subtract_score": return `−${value} pts`;
    case "add_score": return `+${value} pts`;
    default: return `${action}: ${value}`;
  }
}

export const ACTION_TYPE_LABELS: Record<string, string> = {
  force_band: "Force Band",
  cap_score: "Cap Score At",
  floor_score: "Floor Score At",
  add_score: "Add Points",
  subtract_score: "Subtract Points",
};

// ─── Date formatters ───────────────────────────────────────────────

export function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  } catch {
    return "";
  }
}

// ─── Metric map (component ID → metric fields) ────────────────────

export const METRIC_MAP: Record<string, string> = {
  "comp-usg": "mobile_app_usage_pct, tariffs_automation_pct",
  "comp-sup": "total_open_tickets",
  "comp-bil": "invoice_days_overdue",
  "comp-rel": "sentiment_score",
  "comp-imp": "percent_complete",
  "comp-esc": "escalated_ticket_count",
  "comp-eng": "recent_executive_calls",
  "comp-rnw": "volume_change_pct",
};
