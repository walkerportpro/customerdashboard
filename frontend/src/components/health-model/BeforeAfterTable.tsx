import React, { useState } from "react";
import { ChevronDown, ChevronRight, ArrowRight } from "lucide-react";
import type { SimulationResult } from "../../types";

interface BeforeAfterTableProps {
  results: SimulationResult[];
  expandable?: boolean;
}

const bandBadgeClass: Record<string, string> = {
  healthy: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  monitor: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  "at-risk": "bg-red-500/10 text-red-400 border border-red-500/20",
  critical: "bg-red-500/10 text-red-400 border border-red-500/20",
  good: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
  fair: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
  poor: "bg-red-500/10 text-red-400 border border-red-500/20",
};

function getBandClass(band: string): string {
  return bandBadgeClass[band.toLowerCase()] ?? "bg-dark-700/50 text-dark-400 border border-dark-600/50";
}

export default function BeforeAfterTable({ results, expandable = false }: BeforeAfterTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-dark-700/50">
            {expandable && <th className="w-8" />}
            <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">
              Customer
            </th>
            <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">
              Old Score
            </th>
            <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">
              New Score
            </th>
            <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">
              Delta
            </th>
            <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">
              Band Change
            </th>
          </tr>
        </thead>
        <tbody>
          {results.map((result) => {
            const isExpanded = expandedRows.has(result.customer_id);
            const bandChanged = result.old_band !== result.new_band;

            return (
              <React.Fragment key={result.customer_id}>
                <tr
                  className={`border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors ${
                    expandable ? "cursor-pointer" : ""
                  }`}
                  onClick={expandable ? () => toggleRow(result.customer_id) : undefined}
                >
                  {expandable && (
                    <td className="py-3 px-2">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-dark-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-dark-400" />
                      )}
                    </td>
                  )}
                  <td className="py-3 px-3 text-gray-100 font-medium">
                    {result.customer_name}
                  </td>
                  <td className="py-3 px-3 text-right text-dark-400 tabular-nums">
                    {result.old_score.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right text-gray-100 font-medium tabular-nums">
                    {result.new_score.toFixed(1)}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <span
                      className={`text-sm font-medium tabular-nums ${
                        result.delta > 0
                          ? "text-emerald-400"
                          : result.delta < 0
                          ? "text-red-400"
                          : "text-dark-400"
                      }`}
                    >
                      {result.delta > 0 ? "+" : ""}
                      {result.delta.toFixed(1)}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${getBandClass(
                          result.old_band
                        )}`}
                      >
                        {result.old_band}
                      </span>
                      {bandChanged && (
                        <>
                          <ArrowRight className="w-3.5 h-3.5 text-dark-400 shrink-0" />
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${getBandClass(
                              result.new_band
                            )}`}
                          >
                            {result.new_band}
                          </span>
                        </>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {expandable && isExpanded && result.top_contributors.length > 0 && (
                  <tr className="bg-dark-800/30">
                    <td />
                    <td colSpan={5} className="py-3 px-3">
                      <div className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-2">
                        Top Contributors
                      </div>
                      <div className="space-y-1">
                        {result.top_contributors.map((contributor, idx) => {
                          const name = String(contributor["name"] ?? contributor["component"] ?? `Component ${idx + 1}`);
                          const delta = Number(contributor["delta"] ?? contributor["impact"] ?? 0);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm py-1 px-2 rounded hover:bg-dark-800/40"
                            >
                              <span className="text-gray-100">{name}</span>
                              <span
                                className={`font-medium tabular-nums ${
                                  delta > 0
                                    ? "text-emerald-400"
                                    : delta < 0
                                    ? "text-red-400"
                                    : "text-dark-400"
                                }`}
                              >
                                {delta > 0 ? "+" : ""}
                                {delta.toFixed(1)}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
