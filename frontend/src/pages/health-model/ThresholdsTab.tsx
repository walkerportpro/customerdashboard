import { useState, useMemo } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Info,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import ThresholdEditor from "../../components/health-model/ThresholdEditor";
import BandGradientBar from "../../components/health-model/BandGradientBar";
import type { ComponentThreshold, ScoreBand } from "../../types";

// ─── Constants ─────────────────────────────────────────────────────

const DEFAULT_BANDS: ScoreBand[] = [
  { label: "Healthy", min_score: 80, max_score: 100, color: "#10b981" },
  { label: "Monitor", min_score: 60, max_score: 79, color: "#f59e0b" },
  { label: "At Risk", min_score: 40, max_score: 59, color: "#ef4444" },
  { label: "Critical", min_score: 0, max_score: 39, color: "#991b1b" },
];

const SCORING_METHOD_LABELS: Record<string, string> = {
  threshold: "Threshold — first matching rule wins",
  range: "Range — linear interpolation",
  boolean: "Boolean — binary condition",
  trend: "Trend — direction of change",
  recency_decay: "Recency Decay — time since event",
  point_accumulation: "Point Accumulation — event count",
  manual_pulse: "Manual Pulse — CSM input",
  external: "External — third-party model",
};

const DIRECTIONALITY_LABELS: Record<string, string> = {
  higher_better: "↑ Higher is better",
  lower_better: "↓ Lower is better",
  deviation_bad: "↔ Deviation is bad",
};

// ─── Band validation ───────────────────────────────────────────────

interface BandIssue {
  severity: "error" | "warning";
  message: string;
}

function validateBands(bands: ScoreBand[]): BandIssue[] {
  const issues: BandIssue[] = [];
  if (bands.length === 0) {
    issues.push({ severity: "error", message: "At least one score band must be defined." });
    return issues;
  }

  const sorted = [...bands].sort((a, b) => a.min_score - b.min_score);

  // Must start at 0
  if (sorted[0].min_score !== 0) {
    issues.push({ severity: "error", message: `Bands must start at 0. Lowest band "${sorted[0].label}" starts at ${sorted[0].min_score}.` });
  }

  // Must end at 100
  if (sorted[sorted.length - 1].max_score !== 100) {
    issues.push({ severity: "error", message: `Bands must end at 100. Highest band "${sorted[sorted.length - 1].label}" ends at ${sorted[sorted.length - 1].max_score}.` });
  }

  // Check for gaps and overlaps
  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];
    if (curr.min_score > prev.max_score + 1) {
      issues.push({
        severity: "error",
        message: `Gap between "${prev.label}" (ends at ${prev.max_score}) and "${curr.label}" (starts at ${curr.min_score}). Scores ${prev.max_score + 1}–${curr.min_score - 1} are unassigned.`,
      });
    } else if (curr.min_score <= prev.max_score) {
      issues.push({
        severity: "error",
        message: `Overlap between "${prev.label}" (ends at ${prev.max_score}) and "${curr.label}" (starts at ${curr.min_score}). Scores ${curr.min_score}–${prev.max_score} are in both bands.`,
      });
    }
  }

  // Per-band min > max
  for (const band of sorted) {
    if (band.min_score > band.max_score) {
      issues.push({ severity: "error", message: `"${band.label}" has min (${band.min_score}) > max (${band.max_score}).` });
    }
  }

  return issues;
}

// ─── Score-to-band preview ─────────────────────────────────────────

function scoreToBand(score: number, bands: ScoreBand[]): string {
  for (const b of bands) {
    if (score >= b.min_score && score <= b.max_score) return b.label;
  }
  return "Unknown";
}

// ─── Component ─────────────────────────────────────────────────────

export default function ThresholdsTab() {
  const { draft, published, updateDraft } = useHealthModel();
  const [selectedCompId, setSelectedCompId] = useState<string>("");

  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const selected = selectedCompId ? activeComps.find((c) => c.id === selectedCompId) : activeComps[0];
  const effectiveId = selected?.id ?? "";

  const bandIssues = useMemo(() => validateBands(draft.bands), [draft.bands]);
  const hasErrors = bandIssues.some((i) => i.severity === "error");

  // Check if bands differ from published
  const bandsChanged = useMemo(() => {
    if (!published) return false;
    return JSON.stringify(draft.bands) !== JSON.stringify(published.bands);
  }, [draft.bands, published]);

  // ─── Actions ─────────────────────────────────────────────

  const updateBand = (bandLabel: string, field: "min_score" | "max_score" | "label", value: number | string) => {
    updateDraft((d) => ({
      ...d,
      bands: d.bands.map((b) =>
        b.label === bandLabel ? { ...b, [field]: value } : b,
      ),
    }));
  };

  const updateThresholds = (compId: string, thresholds: ComponentThreshold[]) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, thresholds } : c,
      ),
    }));
  };

  const resetBandsToDefault = () => {
    updateDraft((d) => ({ ...d, bands: DEFAULT_BANDS.map((b) => ({ ...b })) }));
  };

  const resetBandsToPublished = () => {
    if (!published) return;
    updateDraft((d) => ({ ...d, bands: published.bands.map((b) => ({ ...b })) }));
  };

  // ─── Render ──────────────────────────────────────────────

  // Sample scores for band preview
  const previewScores = [95, 85, 75, 65, 55, 45, 35, 25, 10, 0];

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Validation banner ────────────────────────────── */}
      {bandIssues.length > 0 && (
        <div className="space-y-2">
          {bandIssues.map((issue, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
                issue.severity === "error"
                  ? "bg-red-500/10 border-red-500/20"
                  : "bg-amber-500/10 border-amber-500/20"
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
                issue.severity === "error" ? "text-red-400" : "text-amber-400"
              }`} />
              <p className={`text-sm ${issue.severity === "error" ? "text-red-400" : "text-amber-400"}`}>
                {issue.message}
              </p>
            </div>
          ))}
        </div>
      )}

      {bandIssues.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            Score bands are valid — contiguous coverage from 0 to 100
            {bandsChanged && " · Modified from published"}
          </span>
        </div>
      )}

      {/* ── Band editor ──────────────────────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Score Bands</h3>
            <p className="text-xs text-dark-400 mt-0.5">
              Define how overall scores map to health status labels
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={resetBandsToDefault}
              className="px-3 py-1.5 text-xs text-dark-400 hover:text-gray-300 hover:bg-dark-800/60 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset to Default
            </button>
            {bandsChanged && (
              <button
                onClick={resetBandsToPublished}
                className="px-3 py-1.5 text-xs text-accent-400 hover:text-accent-300 hover:bg-accent-500/10 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset to Published
              </button>
            )}
          </div>
        </div>

        {/* Visual band bar */}
        <BandGradientBar bands={draft.bands} />

        {/* Band table */}
        <div className="mt-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 w-8"></th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5">Band Label</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">Min Score</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">Max Score</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">Range</th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-2.5 px-3">Color</th>
              </tr>
            </thead>
            <tbody>
              {[...draft.bands].sort((a, b) => b.min_score - a.min_score).map((band) => {
                const rangeWidth = band.max_score - band.min_score + 1;
                const hasIssue = bandIssues.some((i) => i.message.includes(`"${band.label}"`));
                return (
                  <tr key={band.label} className={`border-b border-dark-700/30 ${hasIssue ? "bg-red-500/5" : "hover:bg-dark-800/40"} transition-colors`}>
                    <td className="py-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: band.color }} />
                    </td>
                    <td className="py-3">
                      <span className="text-gray-100 font-medium">{band.label}</span>
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={`w-16 px-2 py-1.5 bg-dark-800/80 border rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none transition-all ${
                          hasIssue ? "border-red-500/50" : "border-dark-700/50"
                        }`}
                        value={band.min_score}
                        onChange={(e) => updateBand(band.label, "min_score", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        className={`w-16 px-2 py-1.5 bg-dark-800/80 border rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none transition-all ${
                          hasIssue ? "border-red-500/50" : "border-dark-700/50"
                        }`}
                        value={band.max_score}
                        onChange={(e) => updateBand(band.label, "max_score", Number(e.target.value))}
                      />
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span className="text-xs text-dark-400">{rangeWidth} pts</span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={band.color}
                          onChange={(e) => updateBand(band.label, "label", band.label)}
                          className="w-6 h-6 rounded border border-dark-700/50 cursor-pointer bg-transparent"
                          style={{ backgroundColor: band.color }}
                          disabled
                        />
                        <span className="text-xs text-dark-400 font-mono">{band.color}</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Help text */}
        <div className="flex items-start gap-2 mt-4 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
          <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
          <p className="text-xs text-dark-400">
            Bands must be contiguous with no gaps or overlaps, covering the full 0–100 range.
            Each customer&apos;s overall health score maps to exactly one band. Exception rules can force a customer
            into a specific band regardless of their calculated score.
          </p>
        </div>
      </div>

      {/* ── Score → Band preview ─────────────────────────── */}
      <div className="glass-card p-6">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Score → Band Preview</h3>
          <p className="text-xs text-dark-400 mt-0.5">See how example scores map into the current band configuration</p>
        </div>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {previewScores.map((score) => {
            const band = scoreToBand(score, draft.bands);
            const bandObj = draft.bands.find((b) => b.label === band);
            return (
              <div key={score} className="text-center">
                <div className="text-lg font-bold text-gray-100">{score}</div>
                <div
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded mt-1 border"
                  style={{
                    backgroundColor: bandObj ? `${bandObj.color}20` : undefined,
                    borderColor: bandObj ? `${bandObj.color}40` : undefined,
                    color: bandObj?.color,
                  }}
                >
                  {band}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Component threshold editor ───────────────────── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Component Scoring Rules</h3>
            <p className="text-xs text-dark-400 mt-0.5">
              Define how raw metric values map to 0–100 component scores
            </p>
          </div>
          <select
            className="px-3 py-1.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-sm text-gray-100 focus:ring-2 focus:ring-accent-500/40 outline-none"
            value={effectiveId}
            onChange={(e) => setSelectedCompId(e.target.value)}
          >
            {activeComps.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.thresholds.length} rules)
              </option>
            ))}
          </select>
        </div>

        {selected && (
          <div className="space-y-5">
            {/* Component metadata */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="px-3 py-2.5 rounded-lg bg-dark-800/40 border border-dark-700/30">
                <span className="text-[10px] uppercase tracking-wider text-dark-500">Method</span>
                <p className="text-xs text-gray-300 mt-0.5">{SCORING_METHOD_LABELS[selected.scoring_method] ?? selected.scoring_method}</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-dark-800/40 border border-dark-700/30">
                <span className="text-[10px] uppercase tracking-wider text-dark-500">Direction</span>
                <p className="text-xs text-gray-300 mt-0.5">{DIRECTIONALITY_LABELS[selected.sensitivity.directionality] ?? selected.sensitivity.directionality}</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-dark-800/40 border border-dark-700/30">
                <span className="text-[10px] uppercase tracking-wider text-dark-500">Time Window</span>
                <p className="text-xs text-gray-300 mt-0.5">{selected.time_window} lookback</p>
              </div>
              <div className="px-3 py-2.5 rounded-lg bg-dark-800/40 border border-dark-700/30">
                <span className="text-[10px] uppercase tracking-wider text-dark-500">Weight</span>
                <p className="text-xs text-gray-300 mt-0.5">{selected.sensitivity.weight}% of total</p>
              </div>
            </div>

            {/* Threshold table */}
            <ThresholdEditor
              thresholds={selected.thresholds}
              onChange={(t) => updateThresholds(selected.id, t)}
            />

            {/* Empty state warning */}
            {selected.thresholds.length === 0 && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <span className="text-sm text-red-400">No thresholds defined — this component cannot produce a score and will use null handling.</span>
              </div>
            )}

            {/* Threshold help */}
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
              <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
              <p className="text-xs text-dark-400">
                Thresholds are evaluated top-to-bottom. The first matching condition determines the component&apos;s score.
                For &ldquo;{selected.sensitivity.directionality.replace(/_/g, " ")}&rdquo; components, arrange conditions so the
                {selected.sensitivity.directionality === "lower_better" ? " lowest " : " highest "}
                values match first. The last row acts as a catch-all fallback.
              </p>
            </div>

            {/* Component navigation */}
            <div className="flex items-center justify-between pt-2 border-t border-dark-700/30">
              <span className="text-xs text-dark-500">{selected.thresholds.length} threshold rules for {selected.name}</span>
              {activeComps.length > 1 && (
                <div className="flex items-center gap-2">
                  {activeComps.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedCompId(c.id)}
                      className={`text-[10px] px-2 py-1 rounded transition-colors ${
                        c.id === effectiveId
                          ? "bg-accent-500/15 text-accent-400 border border-accent-500/20"
                          : "text-dark-400 hover:text-gray-300 hover:bg-dark-800/60"
                      }`}
                    >
                      {c.name.split(" ")[0]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
