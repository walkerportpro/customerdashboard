import { useHealthModel } from "../../context/HealthModelContext";

const strategyLabels: Record<string, string> = {
  assign_neutral: "Assign Neutral (50)",
  assign_penalty: "Assign Penalty",
  ignore_redistribute: "Ignore & Redistribute",
  mark_low_confidence: "Mark Low Confidence",
};

const impactLabels: Record<string, string> = {
  none: "None",
  minor: "Minor (−5%)",
  major: "Major (−15%)",
  critical: "Critical (−30%)",
};

const impactColors: Record<string, string> = {
  none: "text-dark-400",
  minor: "text-amber-400",
  major: "text-orange-400",
  critical: "text-red-400",
};

export default function MissingDataTab() {
  const { draft, updateDraft } = useHealthModel();
  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const missingCount = activeComps.filter((c) => c.null_handling.strategy !== "assign_neutral").length;

  const updateNullHandling = (compId: string, field: string, value: string | number) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, null_handling: { ...c.null_handling, [field]: value } } : c
      ),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-5">
        <div className="glass-card p-5">
          <div className="text-2xl font-bold text-gray-100">{activeComps.length}</div>
          <p className="text-xs text-dark-400 mt-1">Active Components</p>
        </div>
        <div className="glass-card p-5">
          <div className="text-2xl font-bold text-gray-100">{missingCount}</div>
          <p className="text-xs text-dark-400 mt-1">Custom Null Handling</p>
        </div>
        <div className="glass-card p-5">
          <div className="text-2xl font-bold text-emerald-400">
            {Math.round((activeComps.filter((c) => c.null_handling.strategy !== "ignore_redistribute").length / Math.max(activeComps.length, 1)) * 100)}%
          </div>
          <p className="text-xs text-dark-400 mt-1">Components Scoring (not redistributed)</p>
        </div>
      </div>

      {/* Per-component table */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Component</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Source</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Strategy</th>
              <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Penalty</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Confidence Impact</th>
            </tr>
          </thead>
          <tbody>
            {activeComps.map((comp) => (
              <tr key={comp.id} className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors">
                <td className="py-3 px-4">
                  <div className="text-gray-100 font-medium">{comp.name}</div>
                </td>
                <td className="py-3 px-4 text-dark-400 capitalize">{comp.source_system}</td>
                <td className="py-3 px-4">
                  <select
                    className="py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 focus:ring-2 focus:ring-accent-500/40 outline-none"
                    value={comp.null_handling.strategy}
                    onChange={(e) => updateNullHandling(comp.id, "strategy", e.target.value)}
                  >
                    {Object.entries(strategyLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-center">
                  {comp.null_handling.strategy === "assign_penalty" ? (
                    <input
                      type="number"
                      className="w-16 px-2 py-1 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                      value={comp.null_handling.penalty_score}
                      onChange={(e) => updateNullHandling(comp.id, "penalty_score", Number(e.target.value))}
                    />
                  ) : (
                    <span className="text-dark-500">—</span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <select
                    className={`py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg focus:ring-2 focus:ring-accent-500/40 outline-none ${impactColors[comp.null_handling.confidence_impact] ?? "text-gray-100"}`}
                    value={comp.null_handling.confidence_impact}
                    onChange={(e) => updateNullHandling(comp.id, "confidence_impact", e.target.value)}
                  >
                    {Object.entries(impactLabels).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confidence simulator */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Confidence Impact Preview</h3>
        <p className="text-sm text-dark-400 mb-4">If a customer is missing data for these components, confidence would be affected:</p>
        <div className="space-y-2">
          {activeComps.map((comp) => {
            const impact = comp.null_handling.confidence_impact;
            const delta = impact === "minor" ? 5 : impact === "major" ? 15 : impact === "critical" ? 30 : 0;
            return (
              <div key={comp.id} className="flex items-center justify-between py-1.5 px-3 rounded-lg hover:bg-dark-800/40 transition-colors">
                <span className="text-sm text-gray-300">{comp.name}</span>
                <span className={`text-xs font-medium ${impactColors[impact]}`}>
                  {delta > 0 ? `−${delta}% confidence` : "No impact"}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
