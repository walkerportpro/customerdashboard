import React from "react";

interface WeightSegment {
  id: string;
  name: string;
  weight: number;
  color: string;
}

interface StackedWeightBarProps {
  weights: WeightSegment[];
}

const colorMap: Record<string, string> = {
  "accent-500": "bg-accent-500",
  "emerald-500": "bg-emerald-500",
  "purple-500": "bg-purple-500",
  "violet-500": "bg-violet-500",
  "cyan-500": "bg-cyan-500",
  "rose-500": "bg-rose-500",
  "amber-500": "bg-amber-500",
  "blue-500": "bg-blue-500",
};

export default function StackedWeightBar({ weights }: StackedWeightBarProps) {
  const total = weights.reduce((sum, w) => sum + w.weight, 0);
  if (total === 0) return null;

  return (
    <div className="w-full">
      <div className="flex h-8 rounded-lg overflow-hidden">
        {weights.map((segment) => {
          const pct = (segment.weight / total) * 100;
          if (pct <= 0) return null;

          const bgClass = colorMap[segment.color] ?? "bg-dark-500";
          const showLabel = pct >= 8;

          return (
            <div
              key={segment.id}
              className={`${bgClass} relative flex items-center justify-center transition-all duration-300`}
              style={{ width: `${pct}%` }}
              title={`${segment.name}: ${segment.weight}%`}
            >
              {showLabel && (
                <span className="text-[10px] font-medium text-white truncate px-1">
                  {segment.name} {Math.round(pct)}%
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {weights.map((segment) => {
          const bgClass = colorMap[segment.color] ?? "bg-dark-500";
          return (
            <div key={segment.id} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-sm ${bgClass}`} />
              <span className="text-xs text-dark-400">
                {segment.name}{" "}
                <span className="text-gray-300 font-medium">{segment.weight}%</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
