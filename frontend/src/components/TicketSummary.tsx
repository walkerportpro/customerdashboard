import { useState } from "react";
import type { TicketSummary as TicketData } from "../types";

const PRIORITY_COLORS: Record<string, string> = {
  P1: "bg-red-600",
  P2: "bg-orange-500",
  P3: "bg-yellow-500",
  P4: "bg-blue-400",
  P5: "bg-gray-400",
};

const PRIORITY_TEXT: Record<string, string> = {
  P1: "text-red-700 bg-red-100",
  P2: "text-orange-700 bg-orange-100",
  P3: "text-yellow-700 bg-yellow-100",
  P4: "text-blue-700 bg-blue-100",
  P5: "text-gray-700 bg-gray-100",
};

export default function TicketSummaryCard({ data }: { data: TicketData }) {
  const [expanded, setExpanded] = useState(false);
  const priorities = ["P1", "P2", "P3", "P4", "P5"];
  const maxCount = Math.max(...Object.values(data.by_priority), 1);

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600">
        <span className="font-semibold text-gray-900 text-lg">{data.total_open}</span>{" "}
        open tickets
      </div>

      {/* Priority bar chart */}
      <div className="space-y-2">
        {priorities.map((p) => {
          const count = data.by_priority[p] || 0;
          return (
            <div key={p} className="flex items-center gap-2">
              <span className="text-xs font-mono w-6">{p}</span>
              <div className="flex-1 bg-gray-100 rounded h-4 relative">
                <div
                  className={`h-4 rounded ${PRIORITY_COLORS[p]}`}
                  style={{ width: `${(count / maxCount) * 100}%`, minWidth: count > 0 ? '8px' : '0' }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
            </div>
          );
        })}
      </div>

      {/* Ticket list toggle */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        {expanded ? "Hide tickets" : "Show all tickets"}
      </button>

      {expanded && (
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {data.tickets.map((t) => (
            <div
              key={t.id}
              className="flex items-start gap-2 py-1.5 border-b border-gray-100 last:border-0"
            >
              <span
                className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${PRIORITY_TEXT[t.priority] || "text-gray-600 bg-gray-100"}`}
              >
                {t.priority}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm text-gray-800 truncate">{t.subject}</div>
                <div className="text-xs text-gray-400">
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
