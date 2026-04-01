import React from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
}

export default function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "primary",
}: ConfirmDialogProps) {
  if (!open) return null;

  const confirmClasses =
    confirmVariant === "danger"
      ? "px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium text-sm transition-all duration-150 shadow-lg shadow-red-500/20"
      : "px-4 py-2 bg-accent-500 hover:bg-accent-600 text-white rounded-lg font-medium text-sm transition-all duration-150 shadow-lg shadow-accent-500/20";

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-dark-950/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-dark-800/60 border border-dark-700/50 rounded-xl p-6 max-w-md w-full pointer-events-auto animate-fade-in shadow-2xl">
          <div className="flex items-start gap-4">
            {confirmVariant === "danger" && (
              <div className="shrink-0 p-2 rounded-lg bg-red-500/10">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-100">{title}</h3>
              <p className="text-sm text-dark-400 mt-2">{description}</p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 rounded-lg font-medium text-sm border border-dark-600/50 transition-all duration-150"
            >
              Cancel
            </button>
            <button onClick={onConfirm} className={confirmClasses}>
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
