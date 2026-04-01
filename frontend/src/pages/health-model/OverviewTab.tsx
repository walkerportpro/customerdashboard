import {
  Activity,
  Layers,
  GitBranch,
  Shield,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import StackedWeightBar from "../../components/health-model/StackedWeightBar";
import BandGradientBar from "../../components/health-model/BandGradientBar";

const categoryColor: Record<string, string> = {
  engagement: "accent-500",
  support: "emerald-500",
  financial: "purple-500",
  relationship: "violet-500",
  onboarding: "cyan-500",
  commercial: "blue-500",
};

export default function OverviewTab({ onTabChange }: { onTabChange: (tab: string) => void }) {
  const { draft, published, hasChanges, changeSummary, validationErrors, validationWarnings } = useHealthModel();
  const model = draft ?? published;
  if (!model) return null;

  const activeComponents = model.components.filter((c) => c.active);
  const totalWeight = activeComponents.reduce((s, c) => s + c.sensitivity.weight, 0);

  const weights = activeComponents.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.sensitivity.weight,
    color: categoryColor[c.category] ?? "dark-500",
  }));

  const stats = [
    { label: "Components", value: activeComponents.length, sub: `of ${model.components.length} total`, icon: Layers, color: "accent" },
    { label: "Score Bands", value: model.bands.length, sub: "Covering 0–100", icon: BarChart3, color: "emerald" },
    { label: "Segments", value: model.segments.filter((s) => s.active).length, sub: `${model.segments.reduce((s, seg) => s + seg.customer_count, 0)} customers matched`, icon: GitBranch, color: "violet" },
    { label: "Exception Rules", value: model.exceptions.filter((e) => e.active).length, sub: `${model.exceptions.filter((e) => e.is_hard_override).length} hard overrides`, icon: Shield, color: "amber" },
  ];

  const colorMap: Record<string, string> = {
    accent: "from-accent-500/20 to-accent-500/5 border-accent-500/20 text-accent-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    violet: "from-violet-500/20 to-violet-500/5 border-violet-500/20 text-violet-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((s) => (
          <div key={s.label} className={`glass-card p-5 bg-gradient-to-br ${colorMap[s.color]}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium text-dark-300 uppercase tracking-wider">{s.label}</span>
              <s.icon className="w-4 h-4 opacity-60" />
            </div>
            <div className="text-3xl font-bold text-gray-100">{s.value}</div>
            <p className="text-xs text-dark-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Weight distribution + Band preview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Weight Distribution</h3>
            <span className="text-xs text-dark-400">Total: {totalWeight}%</span>
          </div>
          <StackedWeightBar weights={weights} />
          <button onClick={() => onTabChange("weights")} className="text-xs text-accent-400 hover:text-accent-300 mt-4 flex items-center gap-1 transition-colors">
            Edit weights <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Score Bands</h3>
            <span className="text-xs text-dark-400">{model.bands.length} bands</span>
          </div>
          <BandGradientBar bands={model.bands} />
          <button onClick={() => onTabChange("thresholds")} className="text-xs text-accent-400 hover:text-accent-300 mt-4 flex items-center gap-1 transition-colors">
            Edit bands <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Draft changes */}
      {hasChanges && changeSummary.length > 0 && (
        <div className="glass-card p-5 border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-amber-400">
              {changeSummary.length} Unpublished {changeSummary.length === 1 ? "Change" : "Changes"}
            </h3>
            <button onClick={() => onTabChange("preview")} className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors">
              Run Simulation <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <ul className="space-y-1.5">
            {changeSummary.map((c, i) => (
              <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                <span className="text-dark-400 shrink-0">&bull;</span>{c}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!hasChanges && (
        <div className="glass-card p-5 border-l-4 border-l-emerald-500">
          <p className="text-sm text-emerald-400 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Published &middot; v{model.version} &middot; No pending changes
          </p>
        </div>
      )}

      {/* Validation issues */}
      {(validationErrors.length > 0 || validationWarnings.length > 0) && (
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-3">Configuration Status</h3>
          <div className="space-y-2">
            {validationErrors.map((e, i) => (
              <div key={`e-${i}`} className="text-sm text-red-400 flex items-start gap-2">
                <span className="shrink-0">✕</span>{e}
              </div>
            ))}
            {validationWarnings.map((w, i) => (
              <div key={`w-${i}`} className="text-sm text-amber-400 flex items-start gap-2">
                <span className="shrink-0">⚠</span>{w}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Model metadata */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Model Information</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-dark-400">Version</span>
            <p className="text-gray-100 font-medium mt-0.5">v{model.version}</p>
          </div>
          <div>
            <span className="text-dark-400">Published</span>
            <p className="text-gray-100 font-medium mt-0.5">{model.published_at ? new Date(model.published_at).toLocaleDateString() : "Never"}</p>
          </div>
          <div>
            <span className="text-dark-400">Published By</span>
            <p className="text-gray-100 font-medium mt-0.5">{model.published_by || "—"}</p>
          </div>
          <div>
            <span className="text-dark-400">Scoring Mode</span>
            <p className="text-gray-100 font-medium mt-0.5 capitalize">{model.scoring_mode.replace("_", " ")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
