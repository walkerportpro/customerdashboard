import React from "react";
import { ScoreBand } from "../../types";

interface BandGradientBarProps {
  bands: ScoreBand[];
}

export default function BandGradientBar({ bands }: BandGradientBarProps) {
  const sorted = [...bands].sort((a, b) => a.min_score - b.min_score);
  const totalRange = 100;

  return (
    <div className="w-full">
      <div className="flex h-10 rounded-lg overflow-hidden">
        {sorted.map((band, index) => {
          const width = ((band.max_score - band.min_score) / totalRange) * 100;

          return (
            <div
              key={index}
              className="relative flex items-center justify-center transition-all duration-300"
              style={{
                width: `${width}%`,
                backgroundColor: band.color,
              }}
            >
              <span className="text-[11px] font-semibold text-white drop-shadow-sm truncate px-1">
                {band.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Boundary labels */}
      <div className="flex mt-1.5">
        {sorted.map((band, index) => {
          const width = ((band.max_score - band.min_score) / totalRange) * 100;
          return (
            <div
              key={index}
              className="flex justify-between text-[10px] text-dark-400"
              style={{ width: `${width}%` }}
            >
              <span>{band.min_score}</span>
              {index === sorted.length - 1 && <span>{band.max_score}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
