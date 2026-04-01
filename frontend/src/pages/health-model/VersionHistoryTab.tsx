import { useState } from "react";
import { Clock, User, FileText, RotateCcw, ChevronDown, ChevronRight } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import type { AuditLogEntry } from "../../types";

const actionLabels: Record<string, string> = {
  publish: "Published",
  draft_save: "Draft Saved",
  rollback: "Rolled Back",
  created: "Created",
};

const actionColors: Record<string, string> = {
  publish: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  draft_save: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  rollback: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  created: "bg-accent-500/10 text-accent-400 border-accent-500/20",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function VersionHistoryTab() {
  const { draft, published } = useHealthModel();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<"versions" | "audit">("versions");

  const model = draft ?? published;
  if (!model) return null;

  const auditLog = [...model.audit_log].sort((a, b) => b.timestamp.localeCompare(a.timestamp));

  // Build version list from audit log publish entries
  const versions = auditLog
    .filter((e) => e.action === "publish" || e.action === "created")
    .map((e) => ({
      version: e.version,
      published_at: e.timestamp,
      published_by: e.user,
      details: e.details,
      changes: e.changes,
      isActive: e.version === model.version,
    }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-dark-700/50">
        <button
          onClick={() => setActiveSubTab("versions")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeSubTab === "versions" ? "border-b-2 border-accent-500 text-accent-400" : "text-dark-400 hover:text-gray-300"}`}
        >
          Version History
        </button>
        <button
          onClick={() => setActiveSubTab("audit")}
          className={`px-4 py-2.5 text-sm font-medium transition-colors ${activeSubTab === "audit" ? "border-b-2 border-accent-500 text-accent-400" : "text-dark-400 hover:text-gray-300"}`}
        >
          Audit Log
        </button>
      </div>

      {activeSubTab === "versions" && (
        <div className="space-y-3">
          {versions.map((v) => (
            <div key={v.version} className={`glass-card p-5 ${v.isActive ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-dark-600"}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-dark-800/80 border border-dark-700/50">
                    <span className="text-sm font-bold text-gray-200">v{v.version}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-100">Version {v.version}</span>
                      {v.isActive && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-dark-400">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(v.published_at)}</span>
                      <span className="flex items-center gap-1"><User className="w-3 h-3" />{v.published_by}</span>
                    </div>
                  </div>
                </div>
                {!v.isActive && (
                  <button className="btn-secondary flex items-center gap-2 text-xs">
                    <RotateCcw className="w-3.5 h-3.5" /> Restore as Draft
                  </button>
                )}
              </div>
              {v.details && (
                <p className="text-sm text-dark-400 mt-3 pl-[52px]">{v.details}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {activeSubTab === "audit" && (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-700/50">
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Time</th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">User</th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Action</th>
                <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Version</th>
                <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Details</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {auditLog.map((entry) => {
                const isExpanded = expandedId === entry.id;
                const colorClass = actionColors[entry.action] ?? "bg-dark-700/50 text-dark-400 border-dark-600/50";
                return (
                  <tr
                    key={entry.id}
                    className="border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : entry.id)}
                  >
                    <td className="py-3 px-4 text-dark-400 whitespace-nowrap">{formatDate(entry.timestamp)}</td>
                    <td className="py-3 px-4 text-gray-300">{entry.user}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${colorClass}`}>
                        {actionLabels[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center text-gray-300">v{entry.version}</td>
                    <td className="py-3 px-4 text-dark-400 max-w-xs truncate">{entry.details}</td>
                    <td className="py-3 px-2">
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
