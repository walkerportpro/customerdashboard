import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Upload,
  Loader2,
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

  if (!open) return null;

  const hasErrors = validationErrors.length > 0;

  const handlePublish = () => {
    setPublishing(true);
    onPublish(note);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-dark-950/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-dark-900 border border-dark-700/50 rounded-xl max-w-lg w-full pointer-events-auto animate-fade-in shadow-2xl max-h-[85vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-dark-700/50 shrink-0">
            <div>
              <h2 className="text-lg font-semibold text-gray-100">
                Publish Health Model
              </h2>
              <p className="text-sm text-dark-400 mt-0.5">
                Version {currentVersion} &rarr; {currentVersion + 1}
              </p>
            </div>
            <button
              onClick={onClose}
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
                Validation
              </h3>
              <div className="space-y-2">
                {validationErrors.length === 0 && validationWarnings.length === 0 && (
                  <div className="flex items-center gap-2.5 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-gray-100">All validations passed</span>
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
            </div>

            {/* Change summary */}
            {changeSummary.length > 0 && (
              <div>
                <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                  Changes
                </h3>
                <ul className="space-y-1.5">
                  {changeSummary.map((change, idx) => (
                    <li
                      key={idx}
                      className="text-sm text-gray-100 flex items-start gap-2"
                    >
                      <span className="text-dark-400 shrink-0">&bull;</span>
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-dark-800/60 border border-dark-700/50 rounded-lg p-3">
                    <div className="text-lg font-bold text-gray-100">
                      {simulationSummary.total_customers.toLocaleString()}
                    </div>
                    <div className="text-xs text-dark-400">Customers affected</div>
                  </div>
                  <div className="bg-dark-800/60 border border-dark-700/50 rounded-lg p-3">
                    <div
                      className={`text-lg font-bold ${
                        simulationSummary.avg_score_delta >= 0
                          ? "text-emerald-400"
                          : "text-red-400"
                      }`}
                    >
                      {simulationSummary.avg_score_delta >= 0 ? "+" : ""}
                      {simulationSummary.avg_score_delta.toFixed(1)}
                    </div>
                    <div className="text-xs text-dark-400">Avg score delta</div>
                  </div>
                </div>
                {simulationSummary.warnings.length > 0 && (
                  <div className="mt-3 space-y-1.5">
                    {simulationSummary.warnings.map((warning, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2 text-sm text-amber-400"
                      >
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        {warning}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Publish note */}
            <div>
              <h3 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-3">
                Publish Note
              </h3>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Describe what changed and why..."
                rows={3}
                className="w-full px-4 py-2.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 placeholder-dark-400 focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 outline-none transition-all duration-150 resize-none text-sm"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="shrink-0 px-6 py-4 border-t border-dark-700/50 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 rounded-lg font-medium text-sm border border-dark-600/50 transition-all duration-150"
            >
              Cancel
            </button>
            <button
              onClick={handlePublish}
              disabled={hasErrors || publishing}
              className="px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-all duration-150 shadow-lg shadow-accent-500/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {publishing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Publish v{currentVersion + 1}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
