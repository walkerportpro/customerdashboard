import {
  Layers,
  GitBranch,
  Shield,
  BarChart3,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Zap,
  User,
  RefreshCw,
  Database,
  TrendingUp,
  Target,
  Headphones,
  CreditCard,
  Rocket,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import StackedWeightBar from "../../components/health-model/StackedWeightBar";
import BandGradientBar from "../../components/health-model/BandGradientBar";

// ─── Color maps ────────────────────────────────────────────────────

const categoryColor: Record<string, string> = {
  engagement: "accent-500",
  support: "emerald-500",
  financial: "purple-500",
  relationship: "violet-500",
  onboarding: "cyan-500",
  commercial: "blue-500",
};

const categoryBadge: Record<string, string> = {
  engagement: "bg-accent-500/10 text-accent-400 border-accent-500/20",
  support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  financial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  relationship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  onboarding: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  commercial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const sourceIcon: Record<string, typeof Database> = {
  gainsight: TrendingUp,
  freshdesk: Headphones,
  stripe: CreditCard,
  gong: Target,
  rocketlane: Rocket,
  salesforce: Database,
};

const nullStrategyLabel: Record<string, string> = {
  assign_neutral: "Assign Neutral (50)",
  assign_penalty: "Assign Penalty",
  ignore_redistribute: "Ignore & Redistribute",
  mark_low_confidence: "Mark Low Confidence",
};

const actionLabel = (action: string, value: string | number) => {
  switch (action) {
    case "force_band": return `Force → ${value}`;
    case "cap_score": return `Cap at ${value}`;
    case "floor_score": return `Floor at ${value}`;
    case "subtract_score": return `−${value} pts`;
    case "add_score": return `+${value} pts`;
    default: return `${action}: ${value}`;
  }
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

// ─── Preset definitions ────────────────────────────────────────────

const PRESETS = [
  {
    id: "preset-balanced",
    name: "Balanced",
    description: "Equal emphasis across product usage, support, billing, and relationship signals. Best for general-purpose health monitoring.",
    weights: { "Product Usage": 25, "Support": 15, "Billing": 15, "Relationship": 15, "Implementation": 10, "Escalation": 5, "Engagement": 5, "Renewal": 10 },
    icon: BarChart3,
    color: "accent",
  },
  {
    id: "preset-growth",
    name: "Growth Focused",
    description: "Heavy weight on product adoption and executive engagement to identify expansion opportunities and feature champions.",
    weights: { "Product Usage": 35, "Engagement": 15, "Renewal": 15, "Relationship": 10, "Other": 25 },
    icon: TrendingUp,
    color: "emerald",
  },
  {
    id: "preset-support",
    name: "Support Heavy",
    description: "Prioritizes support ticket burden and escalation patterns. Ideal for support-led customer success organizations.",
    weights: { "Support": 30, "Escalation": 15, "Product Usage": 15, "Relationship": 10, "Other": 30 },
    icon: Headphones,
    color: "amber",
  },
  {
    id: "preset-payment",
    name: "Payment Risk",
    description: "Focuses on billing health and renewal signals to protect revenue and identify churn risk from payment patterns.",
    weights: { "Billing": 30, "Renewal": 30, "Product Usage": 10, "Support": 10, "Other": 20 },
    icon: CreditCard,
    color: "rose",
  },
  {
    id: "preset-onboarding",
    name: "Onboarding First",
    description: "Implementation progress as the dominant signal. Best for customers in active onboarding with Rocketlane projects.",
    weights: { "Implementation": 35, "Product Usage": 15, "Engagement": 10, "Support": 10, "Other": 30 },
    icon: Rocket,
    color: "cyan",
  },
];

const presetColorMap: Record<string, string> = {
  accent: "border-accent-500/20 hover:border-accent-500/40 hover:bg-accent-500/5",
  emerald: "border-emerald-500/20 hover:border-emerald-500/40 hover:bg-emerald-500/5",
  amber: "border-amber-500/20 hover:border-amber-500/40 hover:bg-amber-500/5",
  rose: "border-rose-500/20 hover:border-rose-500/40 hover:bg-rose-500/5",
  cyan: "border-cyan-500/20 hover:border-cyan-500/40 hover:bg-cyan-500/5",
};

const presetIconColor: Record<string, string> = {
  accent: "text-accent-400 bg-accent-500/10",
  emerald: "text-emerald-400 bg-emerald-500/10",
  amber: "text-amber-400 bg-amber-500/10",
  rose: "text-rose-400 bg-rose-500/10",
  cyan: "text-cyan-400 bg-cyan-500/10",
};

// ─── Component ─────────────────────────────────────────────────────

export default function OverviewTab({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const { draft, published, hasChanges, changeSummary, validationErrors, validationWarnings, loadPreset } = useHealthModel();
  const model = draft ?? published;
  if (!model) return null;

  const activeComponents = model.components.filter((c) => c.active);
  const totalWeight = activeComponents.reduce((s, c) => s + c.sensitivity.weight, 0);
  const activeSegments = model.segments.filter((s) => s.active);
  const activeExceptions = model.exceptions.filter((e) => e.active);
  const hardOverrides = activeExceptions.filter((e) => e.is_hard_override);
  const totalCustomersMatched = activeSegments.reduce((s, seg) => s + seg.customer_count, 0);
  const recentAudit = [...model.audit_log].sort((a, b) => b.timestamp.localeCompare(a.timestamp)).slice(0, 5);

  // Dominant null strategy
  const strategyCounts: Record<string, number> = {};
  for (const c of activeComponents) {
    const s = c.null_handling.strategy;
    strategyCounts[s] = (strategyCounts[s] || 0) + 1;
  }
  const dominantStrategy = Object.entries(strategyCounts).sort((a, b) => b[1] - a[1])[0];

  // Configuration health warnings (beyond what validation produces)
  const configWarnings: { severity: "error" | "warning" | "info"; message: string }[] = [];

  // From validation
  for (const e of validationErrors) configWarnings.push({ severity: "error", message: e });
  for (const w of validationWarnings) configWarnings.push({ severity: "warning", message: w });

  // Additional contextual warnings
  const maxWeightComp = activeComponents.reduce((max, c) =>
    c.sensitivity.weight > (max?.sensitivity.weight ?? 0) ? c : max, activeComponents[0]);
  if (maxWeightComp && maxWeightComp.sensitivity.weight >= 30 && maxWeightComp.sensitivity.weight <= 50) {
    configWarnings.push({
      severity: "info",
      message: `${maxWeightComp.name} carries ${maxWeightComp.sensitivity.weight}% weight — the largest single contributor to the health score.`,
    });
  }

  if (hardOverrides.length >= 3) {
    configWarnings.push({
      severity: "warning",
      message: `${hardOverrides.length} hard override rules active. Aggressive overrides can mask underlying score signals.`,
    });
  }

  const staleComponents = activeComponents.filter((c) => c.time_window === "90d");
  if (staleComponents.length > 0) {
    configWarnings.push({
      severity: "info",
      message: `${staleComponents.length} component${staleComponents.length > 1 ? "s" : ""} use 90-day lookback windows, which may lag behind recent changes.`,
    });
  }

  if (activeSegments.length > 0) {
    const priorities = activeSegments.map((s) => s.priority);
    const hasDupes = new Set(priorities).size !== priorities.length;
    if (hasDupes) {
      configWarnings.push({
        severity: "warning",
        message: "Multiple segments share the same priority. Matching order may be unpredictable.",
      });
    }
  }

  const weights = activeComponents.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.sensitivity.weight,
    color: categoryColor[c.category] ?? "dark-500",
  }));

  // ─── Stat cards ────────────────────────────────────────────────

  const statGradient: Record<string, string> = {
    accent: "from-accent-500/20 to-accent-500/5 border-accent-500/20 text-accent-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
    blue: "from-blue-500/20 to-blue-500/5 border-blue-500/20 text-blue-400",
  };

  const stats = [
    { label: "Components", value: activeComponents.length, sub: `of ${model.components.length} defined · ${totalWeight}% total weight`, icon: Layers, color: "accent" },
    { label: "Segments", value: activeSegments.length, sub: `${totalCustomersMatched} customers matched`, icon: GitBranch, color: "violet" },
    { label: "Exception Rules", value: activeExceptions.length, sub: `${hardOverrides.length} hard · ${activeExceptions.length - hardOverrides.length} soft`, icon: Shield, color: "amber" },
    { label: "Score Bands", value: model.bands.length, sub: model.bands.map((b) => b.label).join(" · "), icon: BarChart3, color: "emerald" },
    { label: "Last Recalculation", value: model.last_recalculation ? formatDateTime(model.last_recalculation) : "Never", sub: "Scores computed from published model", icon: RefreshCw, color: "blue", isText: true },
    {
      label: "Config Health",
      value: configWarnings.filter((w) => w.severity === "error").length === 0 ? "Healthy" : "Issues Found",
      sub: `${configWarnings.filter((w) => w.severity === "error").length} errors · ${configWarnings.filter((w) => w.severity === "warning").length} warnings`,
      icon: configWarnings.filter((w) => w.severity === "error").length === 0 ? CheckCircle2 : AlertTriangle,
      color: configWarnings.filter((w) => w.severity === "error").length === 0 ? "emerald" : "rose",
      isText: true,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Stat cards ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card p-5 bg-gradient-to-br ${statGradient[s.color]}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-dark-300 uppercase tracking-wider">{s.label}</span>
              <s.icon className="w-4 h-4 opacity-60" />
            </div>
            <div className={`font-bold text-gray-100 ${"isText" in s && s.isText ? "text-lg" : "text-3xl"}`}>{s.value}</div>
            <p className="text-xs text-dark-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Visual Model Summary ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Component groups + weights */}
        <div className="lg:col-span-2 glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Scoring Model</h3>
            <span className="text-xs text-dark-400 font-mono">weighted_average · {activeComponents.length} inputs</span>
          </div>

          {/* Stacked weight bar */}
          <StackedWeightBar weights={weights} />

          {/* Component list */}
          <div className="mt-5 space-y-1">
            {activeComponents.map((comp) => {
              const Icon = sourceIcon[comp.source_system] ?? Database;
              const badge = categoryBadge[comp.category] ?? "bg-dark-700/50 text-dark-400 border-dark-600/50";
              return (
                <div key={comp.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-800/40 transition-colors group">
                  <div className="flex items-center gap-3 min-w-0">
                    <Icon className="w-4 h-4 text-dark-400 shrink-0" />
                    <span className="text-sm text-gray-200 font-medium truncate">{comp.name}</span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border shrink-0 ${badge}`}>{comp.category}</span>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-xs text-dark-500 capitalize">{comp.source_system}</span>
                    <span className="text-sm font-semibold text-gray-100 w-10 text-right">{comp.sensitivity.weight}%</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-dark-700/30">
            <button onClick={() => onTabChange("components")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
              Edit components <ArrowRight className="w-3 h-3" />
            </button>
            <span className="text-dark-600">·</span>
            <button onClick={() => onTabChange("weights")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
              Adjust weights <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Right column: formula + missing data + overrides */}
        <div className="space-y-6">

          {/* Scoring formula */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Scoring Formula</h3>
            <div className="bg-dark-850/80 border border-dark-700/30 rounded-lg p-4 font-mono text-xs text-dark-300 leading-relaxed">
              <div className="text-accent-400 mb-1">health_score =</div>
              <div className="pl-4">
                {activeComponents.slice(0, 4).map((c, i) => (
                  <div key={c.id}>
                    <span className="text-gray-300">{c.name.toLowerCase().replace(/ /g, "_")}</span>
                    <span className="text-dark-500"> × </span>
                    <span className="text-amber-400">{c.sensitivity.weight}%</span>
                    {i < 3 && <span className="text-dark-500"> +</span>}
                  </div>
                ))}
                {activeComponents.length > 4 && (
                  <div className="text-dark-500">+ {activeComponents.length - 4} more components...</div>
                )}
              </div>
              <div className="mt-2 text-dark-500">→ clamp(0, 100) → apply exceptions</div>
            </div>
          </div>

          {/* Missing data summary */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Missing Data</h3>
              <button onClick={() => onTabChange("missing-data")} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {dominantStrategy && (
                <p className="text-sm text-dark-400">
                  Default strategy: <span className="text-gray-300 font-medium">{nullStrategyLabel[dominantStrategy[0]] ?? dominantStrategy[0]}</span> ({dominantStrategy[1]} of {activeComponents.length} components)
                </p>
              )}
              {activeComponents.filter((c) => c.null_handling.strategy !== dominantStrategy?.[0]).map((c) => (
                <div key={c.id} className="text-xs text-dark-400 flex items-center justify-between py-1">
                  <span>{c.name}</span>
                  <span className="text-dark-500">{nullStrategyLabel[c.null_handling.strategy] ?? c.null_handling.strategy}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top overrides */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Active Overrides</h3>
              <button onClick={() => onTabChange("exceptions")} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
                Edit
              </button>
            </div>
            <div className="space-y-2">
              {activeExceptions.sort((a, b) => b.priority - a.priority).slice(0, 4).map((exc) => (
                <div key={exc.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-dark-800/40">
                  <div className="min-w-0">
                    <div className="text-sm text-gray-300 truncate">{exc.name}</div>
                    <div className="text-[10px] text-dark-500 mt-0.5">P{exc.priority}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${exc.is_hard_override ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                      {exc.is_hard_override ? "Hard" : "Soft"}
                    </span>
                    <span className="text-xs text-dark-400">{actionLabel(exc.action, exc.action_value)}</span>
                  </div>
                </div>
              ))}
              {activeExceptions.length > 4 && (
                <p className="text-xs text-dark-500 text-center">+{activeExceptions.length - 4} more rules</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Score Bands ───────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Score Bands</h3>
          <button onClick={() => onTabChange("thresholds")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
            Edit bands <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <BandGradientBar bands={model.bands} />
        <div className="flex items-center justify-between mt-3 px-1">
          {[...model.bands].sort((a, b) => b.min_score - a.min_score).map((band) => (
            <div key={band.label} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: band.color }} />
              <span className="text-xs text-dark-400">{band.label} <span className="text-dark-500">{band.min_score}–{band.max_score}</span></span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Draft Changes / Published Status ──────────────────────── */}
      {hasChanges && changeSummary.length > 0 ? (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-400 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              {changeSummary.length} Unpublished {changeSummary.length === 1 ? "Change" : "Changes"}
            </h3>
            <button onClick={() => onTabChange("preview")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
              Run Simulation <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ul className="space-y-1.5">
            {changeSummary.map((c, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-dark-400 shrink-0 mt-0.5">&bull;</span>{c}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Published &middot; v{model.version} &middot; All changes are live
          </p>
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Recent Activity</h3>
          <button onClick={() => onTabChange("history")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
            View full history <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="space-y-0">
          {recentAudit.map((entry, idx) => {
            const isPublish = entry.action === "publish";
            return (
              <div key={entry.id} className={`flex items-start gap-4 py-3 ${idx < recentAudit.length - 1 ? "border-b border-dark-700/30" : ""}`}>
                {/* Timeline dot */}
                <div className="shrink-0 mt-1">
                  <div className={`w-2.5 h-2.5 rounded-full ${isPublish ? "bg-emerald-400" : "bg-dark-500"}`} />
                </div>
                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded border ${
                      isPublish ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-dark-700/50 text-dark-400 border-dark-600/50"
                    }`}>
                      {isPublish ? `Published v${entry.version}` : entry.action.replace(/_/g, " ")}
                    </span>
                    <span className="text-xs text-dark-500">{formatDate(entry.timestamp)}</span>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">{entry.details}</p>
                  <div className="flex items-center gap-1 mt-1.5 text-xs text-dark-500">
                    <User className="w-3 h-3" />
                    {entry.user}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Configuration Warnings ────────────────────────────────── */}
      {configWarnings.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Configuration Warnings</h3>
          <div className="space-y-2.5">
            {configWarnings.map((w, i) => {
              const icon = w.severity === "error" ? XCircle : w.severity === "warning" ? AlertTriangle : Zap;
              const Icon = icon;
              const color = w.severity === "error" ? "text-red-400" : w.severity === "warning" ? "text-amber-400" : "text-dark-400";
              const bg = w.severity === "error" ? "bg-red-500/5 border-red-500/10" : w.severity === "warning" ? "bg-amber-500/5 border-amber-500/10" : "bg-dark-800/40 border-dark-700/30";
              return (
                <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${bg}`}>
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${color}`} />
                  <span className={`text-sm ${color}`}>{w.message}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Preset Models ─────────────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="mb-5">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Preset Models</h3>
          <p className="text-xs text-dark-400 mt-1">Apply a preset to instantly reconfigure component weights and priorities</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {PRESETS.map((preset) => {
            const colorClass = presetColorMap[preset.color] ?? presetColorMap.accent;
            const iconClass = presetIconColor[preset.color] ?? presetIconColor.accent;
            const Icon = preset.icon;
            return (
              <div
                key={preset.id}
                className={`glass-card p-5 border transition-all duration-200 cursor-pointer ${colorClass}`}
                onClick={() => {
                  if (confirm(`Apply "${preset.name}" preset? This will overwrite your current draft weights.`)) {
                    loadPreset(preset.id);
                  }
                }}
              >
                <div className="flex items-start gap-3 mb-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconClass}`}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-gray-100">{preset.name}</div>
                    <p className="text-xs text-dark-400 mt-1 line-clamp-2">{preset.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {Object.entries(preset.weights).slice(0, 4).map(([name, w]) => (
                    <span key={name} className="text-[10px] px-1.5 py-0.5 rounded bg-dark-800/60 border border-dark-700/30 text-dark-300">
                      {name} {w}%
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Model Metadata Footer ─────────────────────────────────── */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Model Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
          <div>
            <span className="text-dark-400 text-xs">Model ID</span>
            <p className="text-gray-200 font-mono text-xs mt-0.5">{model.id}</p>
          </div>
          <div>
            <span className="text-dark-400 text-xs">Version</span>
            <p className="text-gray-100 font-medium mt-0.5">v{model.version}</p>
          </div>
          <div>
            <span className="text-dark-400 text-xs">Published</span>
            <p className="text-gray-100 font-medium mt-0.5">{model.published_at ? formatDate(model.published_at) : "Never"}</p>
          </div>
          <div>
            <span className="text-dark-400 text-xs">Published By</span>
            <p className="text-gray-100 font-medium mt-0.5">{model.published_by || "—"}</p>
          </div>
          <div>
            <span className="text-dark-400 text-xs">Scoring Mode</span>
            <p className="text-gray-100 font-medium mt-0.5 capitalize">{model.scoring_mode.replace(/_/g, " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
