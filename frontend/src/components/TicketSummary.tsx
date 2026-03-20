import { useState } from "react";
import type { TicketSummary as TicketData } from "../types";

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-red-500",
  P2: "bg-orange-500",
  P3: "bg-amber-500",
  P4: "bg-blue-400",
  P5: "bg-dark-500",
};

const PRIORITY_TEXT: Record<string, string> = {
  P1: "bg-red-500/15 text-red-400 border border-red-500/20",
  P2: "bg-orange-500/15 text-orange-400 border border-orange-500/20",
  P3: "bg-amber-500/15 text-amber-400 border border-amber-500/20",
  P4: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
  P5: "bg-dark-700/50 text-dark-400 border border-dark-600/50",
};

export default function TicketSummaryCard({ data }: { data: TicketData }) {
  const [expanded, setExpanded] = useState(false);
  const priorities = ["P1", "P2", "P3", "P4", "P5"];
  const maxCount = Math.max(...Object.values(data.by_priority), 1);

  return (
    <div className="space-y-4">
      <div className="text-sm text-dark-300">
        <span className="font-semibold text-gray-100 text-lg">{data.total_open}</span>{" "}
        open tickets
      </div>

      {/* Priority bar chart */}
      <div className="space-y-2">
        {priorities.map((p) => {
          const count = data.by_priority[p] || 0;
          return (
            <div key={p} className="flex items-center gap-2">
              <span className="text-xs font-mono w-6 text-dark-400">{p}</span>
              <div className="flex-1 bg-dark-700/30 rounded h-4 relative overflow-hidden">
                <div
                  className={`h-4 rounded ${PRIORITY_COLORS[p]} transition-all duration-500`}
                  style={{ width: `${(count / maxCount) * 100}%`, minWidth: count > 0 ? '8px' : '0' }}
                />
              </div>
              <span className="text-xs text-dark-400 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Ticket list toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
      >
        {expanded ? "Hide tickets" : "Show all tickets"}
      </button>

      {expanded && (
        <div className="space-y-1 max-h-64 overflow-y-auto animate-fade-in">
          {data.tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-2 py-1.5 border-b border-dark-700/30 last:border-0"
            >
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_TEXT[t.priority] || "text-dark-400 bg-dark-700/50"}`}
              >
                {t.priority}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-300 truncate">{t.subject}</div>
                <div className="text-xs text-dark-500">
                  {t.id} &middot; {t.status} &middot; {t.created_at}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
