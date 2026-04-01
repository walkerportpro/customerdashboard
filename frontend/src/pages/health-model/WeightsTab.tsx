import { useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  Scale,
  TrendingUp,
  Headphones,
  CreditCard,
  Target,
  Rocket,
  Database,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import WeightSlider from "../../components/health-model/WeightSlider";
import StackedWeightBar from "../../components/health-model/StackedWeightBar";

// ─── Constants ─────────────────────────────────────────────────────

const CATEGORY_COLOR: Record<string, string> = {
  engagement: "accent-500",
  support: "emerald-500",
  financial: "purple-500",
  relationship: "violet-500",
  onboarding: "cyan-500",
  commercial: "blue-500",
};

const CATEGORY_GROUP_LABEL: Record<string, string> = {
  engagement: "Product & Engagement",
  support: "Support & Operations",
  financial: "Financial Health",
  relationship: "Relationship & Sentiment",
  onboarding: "Onboarding & Implementation",
  commercial: "Commercial & Renewal",
};

const SOURCE_ICON: Record<string, typeof Database> = {
  gainsight: TrendingUp,
  freshdesk: Headphones,
  stripe: CreditCard,
  gong: Target,
  rocketlane: Rocket,
  salesforce: Database,
};

const PRESET_WEIGHTS: Record<string, Record<string, number>> = {
  balanced: { "comp-usg": 25, "comp-sup": 15, "comp-bil": 15, "comp-rel": 15, "comp-imp": 10, "comp-esc": 5, "comp-eng": 5, "comp-rnw": 10 },
  growth: { "comp-usg": 35, "comp-sup": 10, "comp-bil": 10, "comp-rel": 10, "comp-imp": 5, "comp-esc": 5, "comp-eng": 15, "comp-rnw": 10 },
  support: { "comp-usg": 15, "comp-sup": 30, "comp-bil": 10, "comp-rel": 10, "comp-imp": 5, "comp-esc": 15, "comp-eng": 5, "comp-rnw": 10 },
  payment: { "comp-usg": 10, "comp-sup": 10, "comp-bil": 30, "comp-rel": 5, "comp-imp": 5, "comp-esc": 5, "comp-eng": 5, "comp-rnw": 30 },
  onboarding: { "comp-usg": 15, "comp-sup": 10, "comp-bil": 5, "comp-rel": 10, "comp-imp": 35, "comp-esc": 5, "comp-eng": 10, "comp-rnw": 10 },
};

const PRESETS = [
  { id: "balanced", label: "Balanced", desc: "Equal emphasis across all signals" },
  { id: "growth", label: "Growth", desc: "Product adoption + exec engagement" },
  { id: "support", label: "Support Heavy", desc: "Ticket burden + escalation focus" },
  { id: "payment", label: "Payment Risk", desc: "Billing + renewal protection" },
  { id: "onboarding", label: "Onboarding", desc: "Implementation progress first" },
];

// ─── Component ─────────────────────────────────────────────────────

export default function WeightsTab() {
  const { draft, published, updateDraft } = useHealthModel();
  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const inactiveComps = draft.components.filter((c) => !c.active);
  const totalWeight = activeComps.reduce((s, c) => s + c.sensitivity.weight, 0);

  const publishedWeights = useMemo(
    () => new Map((published?.components ?? []).map((c) => [c.id, c.sensitivity.weight])),
    [published],
  );

  // Group by category for grouped display
  const grouped = useMemo(() => {
    const map = new Map<string, typeof activeComps>();
    for (const c of activeComps) {
      const list = map.get(c.category) ?? [];
      list.push(c);
      map.set(c.category, list);
    }
    return map;
  }, [activeComps]);

  const weights = activeComps.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.sensitivity.weight,
    color: CATEGORY_COLOR[c.category] ?? "dark-500",
  }));

  // Dominant component check
  const dominant = activeComps.filter((c) => c.sensitivity.weight > 35);
  const veryDominant = activeComps.filter((c) => c.sensitivity.weight > 50);

  // How many weights changed vs published
  const changedCount = activeComps.filter((c) => {
    const pub = publishedWeights.get(c.id);
    return pub !== undefined && pub !== c.sensitivity.weight;
  }).length;

  // ─── Actions ─────────────────────────────────────────────────

  const updateWeight = (compId: string, newWeight: number) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, sensitivity: { ...c.sensitivity, weight: newWeight } } : c,
      ),
    }));
  };

  const distributeEqually = () => {
    const perComp = Math.floor(100 / activeComps.length);
    const remainder = 100 - perComp * activeComps.length;
    let idx = 0;
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) => {
        if (!c.active) return c;
        const w = perComp + (idx < remainder ? 1 : 0);
        idx++;
        return { ...c, sensitivity: { ...c.sensitivity, weight: w } };
      }),
    }));
  };

  const resetToPublished = () => {
    if (!published) return;
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) => {
        const pub = published.components.find((pc) => pc.id === c.id);
        return pub ? { ...c, sensitivity: { ...c.sensitivity, weight: pub.sensitivity.weight } } : c;
      }),
    }));
  };

  const applyPreset = (presetId: string) => {
    const pw = PRESET_WEIGHTS[presetId];
    if (!pw) return;
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) => {
        const w = pw[c.id];
        return w !== undefined ? { ...c, sensitivity: { ...c.sensitivity, weight: w } } : c;
      }),
    }));
  };

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Validation banner ────────────────────────────── */}
      {totalWeight !== 100 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-amber-400 font-medium">
              Weights sum to {totalWeight}% — expected 100%
            </p>
            <p className="text-xs text-amber-400/70 mt-0.5">
              The scoring engine will auto-normalize to 100% at calculation time, but it&apos;s best to set them explicitly.
            </p>
          </div>
        </div>
      )}
      {totalWeight === 100 && changedCount === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Weights balanced at 100% · Matches published model</span>
        </div>
      )}
      {totalWeight === 100 && changedCount > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-500/10 border border-accent-500/20">
          <CheckCircle2 className="w-4 h-4 text-accent-400" />
          <span className="text-sm text-accent-400 font-medium">
            Weights balanced at 100% · {changedCount} {changedCount === 1 ? "change" : "changes"} from published
          </span>
        </div>
      )}

      {/* ── Dominance warnings ───────────────────────────── */}
      {veryDominant.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-red-400 font-medium">
              {veryDominant[0].name} has {veryDominant[0].sensitivity.weight}% weight
            </p>
            <p className="text-xs text-red-400/70 mt-0.5">
              A single component over 50% means the health score is almost entirely determined by one signal. Consider rebalancing.
            </p>
          </div>
        </div>
      )}
      {veryDominant.length === 0 && dominant.length > 0 && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-400">
            {dominant[0].name} carries {dominant[0].sensitivity.weight}% weight — the largest single contributor to the health score.
          </p>
        </div>
      )}

      {/* ── Stacked weight bar ───────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Weight Distribution</h3>
            <p className="text-xs text-dark-400 mt-0.5">
              {activeComps.length} active components · Total: {totalWeight}%
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={distributeEqually}
              className="px-3 py-1.5 text-xs text-accent-400 hover:text-accent-300 hover:bg-accent-500/10 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Scale className="w-3.5 h-3.5" /> Distribute Equally
            </button>
            <button
              onClick={resetToPublished}
              className="px-3 py-1.5 text-xs text-dark-400 hover:text-gray-300 hover:bg-dark-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Published
            </button>
          </div>
        </div>

        <StackedWeightBar weights={weights} />

        {/* Inline help */}
        <div className="flex items-start gap-2 mt-4 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
          <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
          <p className="text-xs text-dark-400">
            Weights control how much each component contributes to the overall health score.
            The scoring engine computes: <span className="text-dark-300 font-mono">score = Σ(component_score × weight / 100)</span>.
            Weights are normalized to 100% if they don&apos;t already sum to 100.
          </p>
        </div>
      </div>

      {/* ── Grouped weight sliders ───────────────────────── */}
      {Array.from(grouped.entries()).map(([category, comps]) => {
        const groupWeight = comps.reduce((s, c) => s + c.sensitivity.weight, 0);
        const groupLabel = CATEGORY_GROUP_LABEL[category] ?? category;

        return (
          <div key={category} className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">{groupLabel}</h3>
                <span className="text-xs text-dark-500">{comps.length} {comps.length === 1 ? "component" : "components"}</span>
              </div>
              <span className="text-xs font-medium text-dark-300">
                Group total: <span className="text-gray-100">{groupWeight}%</span>
              </span>
            </div>

            <div className="space-y-1">
              {comps.map((comp) => (
                <WeightSlider
                  key={comp.id}
                  name={comp.name}
                  category={comp.category}
                  sourceSystem={comp.source_system}
                  value={comp.sensitivity.weight}
                  publishedValue={publishedWeights.get(comp.id)}
                  onChange={(v) => updateWeight(comp.id, v)}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* ── Inactive components note ─────────────────────── */}
      {inactiveComps.length > 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-dark-800/40 border border-dark-700/30">
          <Info className="w-3.5 h-3.5 text-dark-500" />
          <span className="text-xs text-dark-500">
            {inactiveComps.length} disabled {inactiveComps.length === 1 ? "component" : "components"} excluded from weighting:
            {" "}{inactiveComps.map((c) => c.name).join(", ")}
          </span>
        </div>
      )}

      {/* ── Preset quick-apply ───────────────────────────── */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Preset Weight Profiles</h3>
          <p className="text-xs text-dark-400 mt-0.5">Apply a predefined weight distribution. Overwrites current draft weights.</p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {PRESETS.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className="glass-card p-4 text-left hover:border-accent-500/30 hover:bg-accent-500/5 transition-all group"
            >
              <div className="text-sm font-medium text-gray-200 group-hover:text-accent-400 transition-colors">{preset.label}</div>
              <p className="text-[10px] text-dark-400 mt-1">{preset.desc}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {Object.entries(PRESET_WEIGHTS[preset.id] ?? {}).slice(0, 3).map(([id, w]) => {
                  const comp = draft.components.find((c) => c.id === id);
                  return (
                    <span key={id} className="text-[9px] px-1 py-0.5 rounded bg-dark-800/60 border border-dark-700/30 text-dark-400">
                      {comp?.name.split(" ")[0] ?? id} {w}%
                    </span>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Segment override preview ─────────────────────── */}
      {draft.segments.filter((s) => s.active).length > 0 && (
        <div className="glass-card p-6">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Segment Weight Overrides</h3>
            <p className="text-xs text-dark-400 mt-0.5">
              Segments can override base weights for matched customers. Overrides shown in accent color.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 pr-4">Component</th>
                  <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">Base</th>
                  {draft.segments.filter((s) => s.active).map((seg) => (
                    <th key={seg.id} className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">
                      {seg.name}
                      <div className="text-[10px] text-dark-500 font-normal normal-case mt-0.5">P{seg.priority}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeComps.map((comp) => (
                  <tr key={comp.id} className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors">
                    <td className="py-2.5 pr-4">
                      <div className="flex items-center gap-2">
                        {(() => { const I = SOURCE_ICON[comp.source_system] ?? Database; return <I className="w-3.5 h-3.5 text-dark-400" />; })()}
                        <span className="text-gray-300">{comp.name}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-gray-100 font-medium">{comp.sensitivity.weight}%</td>
                    {draft.segments.filter((s) => s.active).map((seg) => {
                      const override = seg.weight_overrides[comp.id];
                      const isOverridden = override !== undefined;
                      const delta = isOverridden ? override - comp.sensitivity.weight : 0;
                      return (
                        <td key={seg.id} className="py-2.5 px-3 text-right">
                          {isOverridden ? (
                            <div>
                              <span className="text-accent-400 font-medium">{override}%</span>
                              <span className={`text-[10px] ml-1 ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {delta > 0 ? "+" : ""}{delta}
                              </span>
                            </div>
                          ) : (
                            <span className="text-dark-500">{comp.sensitivity.weight}%</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                {/* Totals row */}
                <tr className="border-t border-dark-700/50">
                  <td className="py-2.5 pr-4 text-xs text-dark-400 font-medium">Total</td>
                  <td className="py-2.5 px-3 text-right text-xs text-dark-300 font-medium">{totalWeight}%</td>
                  {draft.segments.filter((s) => s.active).map((seg) => {
                    const segTotal = activeComps.reduce((s, c) => {
                      const ov = seg.weight_overrides[c.id];
                      return s + (ov ?? c.sensitivity.weight);
                    }, 0);
                    return (
                      <td key={seg.id} className="py-2.5 px-3 text-right text-xs text-dark-300 font-medium">
                        {segTotal}%
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Summary footer ───────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-dark-500 px-1">
        <span>{activeComps.length} active components · {inactiveComps.length} disabled</span>
        <span>
          Effective weight: {totalWeight}%
          {totalWeight !== 100 && ` → normalized to 100% (${activeComps.map((c) => `${c.name.split(" ")[0]} ${Math.round(c.sensitivity.weight / totalWeight * 100)}%`).join(", ")})`}
        </span>
      </div>
    </div>
  );
}
