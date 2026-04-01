import { useHealthModel } from "../../context/HealthModelContext";
import WeightSlider from "../../components/health-model/WeightSlider";
import StackedWeightBar from "../../components/health-model/StackedWeightBar";

const categoryColor: Record<string, string> = {
  engagement: "accent-500",
  support: "emerald-500",
  financial: "purple-500",
  relationship: "violet-500",
  onboarding: "cyan-500",
  commercial: "blue-500",
};

export default function WeightsTab() {
  const { draft, published, updateDraft } = useHealthModel();
  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const totalWeight = activeComps.reduce((s, c) => s + c.sensitivity.weight, 0);

  const publishedWeights = new Map(
    (published?.components ?? []).map((c) => [c.id, c.sensitivity.weight])
  );

  const weights = activeComps.map((c) => ({
    id: c.id,
    name: c.name,
    weight: c.sensitivity.weight,
    color: categoryColor[c.category] ?? "dark-500",
  }));

  const updateWeight = (compId: string, newWeight: number) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, sensitivity: { ...c.sensitivity, weight: newWeight } } : c
      ),
    }));
  };

  const distributeEqually = () => {
    const perComp = Math.floor(100 / activeComps.length);
    const remainder = 100 - perComp * activeComps.length;
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c, i) => {
        if (!c.active) return c;
        const activeIdx = activeComps.findIndex((ac) => ac.id === c.id);
        const w = perComp + (activeIdx < remainder ? 1 : 0);
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
        if (pub) return { ...c, sensitivity: { ...c.sensitivity, weight: pub.sensitivity.weight } };
        return c;
      }),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Stacked bar */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Weight Distribution</h3>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-medium ${totalWeight === 100 ? "text-emerald-400" : "text-amber-400"}`}>
              Total: {totalWeight}% {totalWeight === 100 ? "✓" : "(will normalize)"}
            </span>
          </div>
        </div>
        <StackedWeightBar weights={weights} />
        <div className="flex items-center gap-3 mt-4">
          <button onClick={distributeEqually} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
            Distribute Equally
          </button>
          <span className="text-dark-600">·</span>
          <button onClick={resetToPublished} className="text-xs text-dark-400 hover:text-gray-300 transition-colors">
            Reset to Published
          </button>
        </div>
      </div>

      {/* Sliders */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Component Weights</h3>
        <div className="space-y-1">
          {activeComps.map((comp) => (
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

        {totalWeight !== 100 && (
          <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400">
              Weights sum to {totalWeight}%. They will be normalized to 100% during score calculation.
            </p>
          </div>
        )}

        {activeComps.some((c) => c.sensitivity.weight > 50) && (
          <div className="mt-4 px-4 py-3 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <p className="text-sm text-amber-400">
              ⚠ {activeComps.find((c) => c.sensitivity.weight > 50)?.name} has &gt;50% weight — the score depends heavily on a single signal.
            </p>
          </div>
        )}
      </div>

      {/* Segment override preview */}
      {draft.segments.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Segment Weight Overrides</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2 pr-4">Component</th>
                  <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-2 px-3">Base</th>
                  {draft.segments.filter((s) => s.active).map((seg) => (
                    <th key={seg.id} className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-2 px-3">{seg.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activeComps.map((comp) => (
                  <tr key={comp.id} className="border-b border-dark-700/30">
                    <td className="py-2 pr-4 text-gray-300">{comp.name}</td>
                    <td className="py-2 px-3 text-right text-gray-100 font-medium">{comp.sensitivity.weight}%</td>
                    {draft.segments.filter((s) => s.active).map((seg) => {
                      const override = seg.weight_overrides[comp.id];
                      const isOverridden = override !== undefined;
                      return (
                        <td key={seg.id} className={`py-2 px-3 text-right ${isOverridden ? "text-accent-400 font-medium" : "text-dark-500"}`}>
                          {isOverridden ? `${override}%` : `${comp.sensitivity.weight}%`}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
