import { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
  PartyPopper,
  History,
  ArrowRight,
} from "lucide-react";
import type { SimulationSummary } from "../../types";

interface PublishModalProps {
  open: boolean;
  onClose: () => void;
  onPublish: (note: string) => void;
  changeSummary: string[];
  validationErrors: string[];
  validationWarnings: string[];
  simulationSummary?: SimulationSummary | null;
  currentVersion: number;
}

export default function PublishModal({
  open,
  onClose,
  onPublish,
  changeSummary,
  validationErrors,
  validationWarnings,
  simulationSummary,
  currentVersion,
}: PublishModalProps) {
  const [note, setNote] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);

  if (!open) return null;

  const hasErrors = validationErrors.length > 0;
  const passedChecks = !hasErrors;
  const totalChecks = validationErrors.length + validationWarnings.length + (passedChecks && validationWarnings.length === 0 ? 1 : 0);

  const handlePublish = () => {
    setPublishing(true);
    // Simulate a short delay for realism, then call onPublish
    setTimeout(() => {
      onPublish(note);
      setPublishing(false);
      setPublished(true);
    }, 800);
  };

  const handleClose = () => {
    setNote("");
    setPublishing(false);
    setPublished(false);
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-dark-950/60 backdrop-blur-sm"
        onClick={published ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-dark-900 border border-dark-700/50 rounded-xl max-w-lg w-full pointer-events-auto animate-fade-in shadow-2xl max-h-[85vh] flex flex-col">

          {/* ── Success state ─────────────────────────────────── */}
          {published && (
            <div className="p-10 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-5">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100 mb-2">
                Version {currentVersion + 1} Published
              </h2>
              <p className="text-sm text-dark-400 max-w-sm mx-auto mb-6">
                Your health model changes are now live. Scores will be recalculated for all customers using the updated configuration.
              </p>
              {note && (
                <div className="p-3 rounded-lg bg-dark-800/40 border border-dark-700/30 text-left mb-6 max-w-sm mx-auto">
                  <span className="text-[10px] uppercase tracking-wider text-dark-500 font-medium">Publish Note</span>
                  <p className="text-sm text-gray-300 mt-1">{note}</p>
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleClose}
                  className="btn-primary text-sm px-6"
                >
                  Done
                </button>
              </div>
            </div>
          )}

          {/* ── Pre-publish state ─────────────────────────────── */}
          {!published && (
            <>
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50 shrink-0">
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    Publish Health Model
                  </h2>
                  <p className="text-sm text-dark-400 mt-0.5">
                    Version {currentVersion} &rarr; Version {currentVersion + 1}
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  className="p-1.5 text-dark-400 hover:text-gray-300 hover:bg-dark-800/60 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

                {/* Validation checklist */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                    Pre-publish Validation
                  </h3>
                  <div className="space-y-2 p-4 rounded-lg bg-dark-800/30 border border-dark-700/30">
                    {validationErrors.length === 0 && validationWarnings.length === 0 && (
                      <div className="flex items-center gap-2.5 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="text-emerald-400 font-medium">All validation checks passed</span>
                      </div>
                    )}
                    {validationErrors.map((error, idx) => (
                      <div key={`err-${idx}`} className="flex items-start gap-2.5 text-sm">
                        <XCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="text-red-400">{error}</span>
                      </div>
                    ))}
                    {validationWarnings.map((warning, idx) => (
                      <div key={`warn-${idx}`} className="flex items-start gap-2.5 text-sm">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <span className="text-amber-400">{warning}</span>
                      </div>
                    ))}
                  </div>
                  {hasErrors && (
                    <p className="text-xs text-red-400 mt-2">
                      Fix the errors above before publishing. Warnings are non-blocking.
                    </p>
                  )}
                </div>

                {/* Change summary */}
                {changeSummary.length > 0 && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                      Changes ({changeSummary.length})
                    </h3>
                    <ul className="space-y-1.5 p-4 rounded-lg bg-dark-800/30 border border-dark-700/30">
                      {changeSummary.map((change, idx) => (
                        <li key={idx} className="text-sm text-gray-200 flex items-start gap-2">
                          <span className="text-accent-400 shrink-0 mt-0.5">&bull;</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Simulation summary */}
                {simulationSummary && (
                  <div>
                    <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                      Simulation Results
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-dark-800/60 border border-dark-700/50">
                        <div className="text-lg font-bold text-gray-100">
                          {simulationSummary.total_customers}
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Customers scored</div>
                      </div>
                      <div className="p-3 rounded-lg bg-dark-800/60 border border-dark-700/50">
                        <div className={`text-lg font-bold ${simulationSummary.avg_score_delta >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {simulationSummary.avg_score_delta >= 0 ? "+" : ""}
                          {simulationSummary.avg_score_delta.toFixed(1)}
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Avg delta</div>
                      </div>
                      <div className="p-3 rounded-lg bg-dark-800/60 border border-dark-700/50">
                        <div className="text-lg font-bold text-gray-100">
                          {Object.values(simulationSummary.band_migrations).reduce((s, v) => s + v, 0)}
                        </div>
                        <div className="text-[10px] text-dark-400 mt-0.5">Band changes</div>
                      </div>
                    </div>
                    {simulationSummary.warnings.length > 0 && (
                      <div className="mt-3 space-y-1">
                        {simulationSummary.warnings.map((warning, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-amber-400">
                            <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" />
                            {warning}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {!simulationSummary && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <p className="text-xs text-amber-400">
                      No simulation has been run for this draft. Consider running a preview to see how changes affect customer scores.
                    </p>
                  </div>
                )}

                {/* Publish note */}
                <div>
                  <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                    Publish Note <span className="text-dark-500 normal-case">(optional)</span>
                  </h3>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Describe what changed and why — this will appear in the version history..."
                    rows={3}
                    className="w-full px-4 py-2.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 placeholder-dark-400 focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 outline-none transition-all duration-150 resize-none text-sm"
                  />
                  <p className="text-[10px] text-dark-500 mt-1">Good notes help your team understand why this version was published.</p>
                </div>
              </div>

              {/* Footer */}
              <div className="shrink-0 px-6 py-4 border-t border-dark-700/50 flex items-center justify-between">
                <p className="text-xs text-dark-500">
                  Scores will be recalculated for all customers.
                </p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 rounded-lg font-medium text-sm border border-dark-600/50 transition-all duration-150"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePublish}
                    disabled={hasErrors || publishing}
                    className="px-5 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-all duration-150 shadow-lg shadow-accent-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {publishing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    {publishing ? "Publishing..." : `Publish v${currentVersion + 1}`}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
