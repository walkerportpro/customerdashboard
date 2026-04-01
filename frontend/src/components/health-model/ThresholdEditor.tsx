import React from "react";
import { Plus, Trash2 } from "lucide-react";
import { ComponentThreshold } from "../../types";

interface ThresholdEditorProps {
  thresholds: ComponentThreshold[];
  onChange: (thresholds: ComponentThreshold[]) => void;
}

const conditionOptions: { value: ComponentThreshold["condition"]; label: string }[] = [
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "eq", label: "=" },
  { value: "between", label: "Between" },
];

export default function ThresholdEditor({ thresholds, onChange }: ThresholdEditorProps) {
  const updateThreshold = (index: number, updates: Partial<ComponentThreshold>) => {
    const updated = thresholds.map((t, i) => (i === index ? { ...t, ...updates } : t));
    onChange(updated);
  };

  const removeThreshold = (index: number) => {
    onChange(thresholds.filter((_, i) => i !== index));
  };

  const addThreshold = () => {
    onChange([
      ...thresholds,
      { condition: "gte", value: 0, value_upper: null, result_score: 100, label: "" },
    ]);
  };

  const inputClass =
    "py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 placeholder-dark-400 focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 outline-none transition-all duration-150";

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="grid grid-cols-[120px_80px_80px_80px_1fr_32px] gap-2 px-2 py-1.5">
        <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Condition</span>
        <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Value</span>
        <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Upper</span>
        <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Score</span>
        <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Label</span>
        <span />
      </div>

      {/* Rows */}
      {thresholds.map((threshold, index) => (
        <div
          key={index}
          className="grid grid-cols-[120px_80px_80px_80px_1fr_32px] gap-2 px-2 py-1.5 rounded-lg hover:bg-dark-800/40 transition-colors items-center"
        >
          <select
            value={threshold.condition}
            onChange={(e) =>
              updateThreshold(index, {
                condition: e.target.value as ComponentThreshold["condition"],
                value_upper: e.target.value === "between" ? threshold.value_upper ?? 0 : null,
              })
            }
            className={inputClass}
          >
            {conditionOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <input
            type="number"
            value={threshold.value}
            onChange={(e) => updateThreshold(index, { value: Number(e.target.value) })}
            className={inputClass}
            placeholder="0"
          />

          {threshold.condition === "between" ? (
            <input
              type="number"
              value={threshold.value_upper ?? ""}
              onChange={(e) => updateThreshold(index, { value_upper: Number(e.target.value) })}
              className={inputClass}
              placeholder="100"
            />
          ) : (
            <div className={`${inputClass} opacity-30 cursor-not-allowed`}>&mdash;</div>
          )}

          <input
            type="number"
            value={threshold.result_score}
            onChange={(e) => updateThreshold(index, { result_score: Number(e.target.value) })}
            className={inputClass}
            placeholder="100"
          />

          <input
            type="text"
            value={threshold.label}
            onChange={(e) => updateThreshold(index, { label: e.target.value })}
            className={inputClass}
            placeholder="Label..."
          />

          <button
            onClick={() => removeThreshold(index)}
            className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ))}

      {/* Add button */}
      <button
        onClick={addThreshold}
        className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors mt-2"
      >
        <Plus className="w-4 h-4" />
        Add Threshold
      </button>
    </div>
  );
}
