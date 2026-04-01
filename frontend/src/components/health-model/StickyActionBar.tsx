import React from "react";
import { Save, Eye, Upload, Undo2, Loader2 } from "lucide-react";

interface StickyActionBarProps {
  hasChanges: boolean;
  changeCount: number;
  onSave: () => void;
  onDiscard: () => void;
  onPreview: () => void;
  onPublish: () => void;
  saving: boolean;
  publishDisabled: boolean;
}

export default function StickyActionBar({
  hasChanges,
  changeCount,
  onSave,
  onDiscard,
  onPreview,
  onPublish,
  saving,
  publishDisabled,
}: StickyActionBarProps) {
  return (
    <div className="fixed bottom-0 right-0 left-60 z-40 bg-dark-900/95 backdrop-blur border-t border-dark-700/50 px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {hasChanges && (
          <span className="text-sm text-amber-400 font-medium">
            {changeCount} unsaved {changeCount === 1 ? "change" : "changes"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onDiscard}
          disabled={!hasChanges}
          className="px-4 py-2 text-dark-400 hover:text-gray-300 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Undo2 className="w-4 h-4" />
          Discard
        </button>

        <button
          onClick={onPreview}
          className="px-4 py-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 rounded-lg font-medium text-sm border border-dark-600/50 transition-all duration-150 flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          Preview
        </button>

        <button
          onClick={onSave}
          disabled={!hasChanges || saving}
          className="px-4 py-2 bg-dark-700/50 hover:bg-dark-700 text-gray-300 rounded-lg font-medium text-sm border border-dark-600/50 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          Save Draft
        </button>

        <button
          onClick={onPublish}
          disabled={!hasChanges || publishDisabled}
          className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-150 shadow-lg flex items-center gap-2 ${
            publishDisabled
              ? "bg-dark-700/50 text-dark-400 border border-dark-600/50 cursor-not-allowed"
              : "bg-accent-500 hover:bg-accent-600 text-white shadow-accent-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
          }`}
        >
          <Upload className="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>
  );
}
