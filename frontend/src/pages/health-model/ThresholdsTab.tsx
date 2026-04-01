import { useState } from "react";
import { useHealthModel } from "../../context/HealthModelContext";
import ThresholdEditor from "../../components/health-model/ThresholdEditor";
import BandGradientBar from "../../components/health-model/BandGradientBar";
import type { ComponentThreshold } from "../../types";

export default function ThresholdsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [selectedCompId, setSelectedCompId] = useState<string>("");

  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const selected = selectedCompId ? activeComps.find((c) => c.id === selectedCompId) : activeComps[0];
  const effectiveId = selected?.id ?? "";

  const updateBand = (index: number, field: "min_score" | "max_score", value: number) => {
    updateDraft((d) => ({
      ...d,
      bands: d.bands.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    }));
  };

  const updateThresholds = (compId: string, thresholds: ComponentThreshold[]) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, thresholds } : c
      ),
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Band editor */}
      <div className="glass-card p-6">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide mb-4">Score Bands</h3>
        <BandGradientBar bands={draft.bands} />

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2">Band</th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2 px-3">Color</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-2 px-3">Min</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-2 px-3">Max</th>
              </tr>
            </thead>
            <tbody>
              {[...draft.bands].sort((a, b) => b.min_score - a.min_score).map((band, idx) => {
                const sortedIdx = draft.bands.findIndex((b) => b.label === band.label);
                return (
                  <tr key={band.label} className="border-b border-dark-700/30">
                    <td className="py-2.5 text-gray-100 font-medium flex items-center gap-2">
                      <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: band.color }} />
                      {band.label}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-xs text-dark-400 font-mono">{band.color}</span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        className="w-16 px-2 py-1 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                        value={band.min_score}
                        onChange={(e) => updateBand(sortedIdx, "min_score", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <input
                        type="number"
                        className="w-16 px-2 py-1 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                        value={band.max_score}
                        onChange={(e) => updateBand(sortedIdx, "max_score", Number(e.target.value))}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Component threshold editor */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Component Scoring Rules</h3>
          <select
            className="px-3 py-1.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-accent-500/40 outline-none"
            value={effectiveId}
            onChange={(e) => setSelectedCompId(e.target.value)}
          >
            {activeComps.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {selected && (
          <div>
            <p className="text-xs text-dark-400 mb-4">
              {selected.scoring_method} scoring &middot; {selected.sensitivity.directionality.replace(/_/g, " ")} &middot; {selected.time_window} lookback
            </p>
            <ThresholdEditor
              thresholds={selected.thresholds}
              onChange={(t) => updateThresholds(selected.id, t)}
            />
          </div>
        )}
      </div>
    </div>
  );
}
