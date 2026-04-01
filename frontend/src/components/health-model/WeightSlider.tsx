import React from "react";
import { Gauge } from "lucide-react";

const categoryColors: Record<string, string> = {
  usage: "bg-accent-500/10 text-accent-400 border-accent-500/20",
  support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  billing: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  relationship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  implementation: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  escalation: "bg-rose-500/10 text-rose-400 border-rose-500/20",
  engagement: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  renewal: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

interface WeightSliderProps {
  name: string;
  category: string;
  sourceSystem: string;
  value: number;
  publishedValue?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}

export default function WeightSlider({
  name,
  category,
  sourceSystem,
  value,
  publishedValue,
  onChange,
  disabled = false,
}: WeightSliderProps) {
  const delta = publishedValue !== undefined ? value - publishedValue : null;
  const categoryClass = categoryColors[category] ?? "bg-dark-700/50 text-dark-400 border-dark-600/50";

  return (
    <div className="flex items-center gap-4 py-3 px-4 rounded-lg hover:bg-dark-800/40 transition-colors group">
      {/* Icon */}
      <div className="shrink-0 w-8 h-8 rounded-lg bg-dark-800/80 flex items-center justify-center">
        <Gauge className="w-4 h-4 text-dark-400" />
      </div>

      {/* Name + Category */}
      <div className="min-w-[160px] shrink-0">
        <div className="text-sm font-medium text-gray-100">{name}</div>
        <div className="flex items-center gap-2 mt-0.5">
          <span
            className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${categoryClass}`}
          >
            {category}
          </span>
          <span className="text-[10px] text-dark-400">{sourceSystem}</span>
        </div>
      </div>

      {/* Slider */}
      <div className="flex-1 min-w-0">
        <input
          type="range"
          min={0}
          max={100}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-dark-700/50 rounded-full appearance-none cursor-pointer accent-accent-500 disabled:opacity-40 disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-accent-500/30
            [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-500 [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-lg [&::-moz-range-thumb]:shadow-accent-500/30"
        />
      </div>

      {/* Numeric input */}
      <input
        type="number"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Math.min(100, Math.max(0, Number(e.target.value))))}
        disabled={disabled}
        className="w-16 px-2 py-1.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 focus:border-accent-500/50 outline-none transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
      />

      {/* Delta badge */}
      <div className="w-14 text-right shrink-0">
        {delta !== null && delta !== 0 && (
          <span
            className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              delta > 0
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {delta > 0 ? "+" : ""}
            {delta}%
          </span>
        )}
      </div>
    </div>
  );
}
