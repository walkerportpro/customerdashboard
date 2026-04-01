import { useState, useMemo } from "react";
import {
  Clock,
  User,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  GitCompare,
  History,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Shield,
  GitBranch,
  BarChart3,
  ArrowRight,
  Filter,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import type { AuditLogEntry } from "../../types";

// ─── Constants ─────────────────────────────────────────────────────

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: typeof FileText }> = {
  publish: { label: "Published", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", icon: CheckCircle2 },
  draft_save: { label: "Draft Saved", color: "bg-amber-500/10 text-amber-400 border-amber-500/20", icon: FileText },
  rollback: { label: "Rolled Back", color: "bg-violet-500/10 text-violet-400 border-violet-500/20", icon: RotateCcw },
  created: { label: "Created", color: "bg-accent-500/10 text-accent-400 border-accent-500/20", icon: Layers },
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric",
    });
  } catch {
    return iso;
  }
}

function formatDateTime(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    if (days < 365) return `${Math.floor(days / 30)} months ago`;
    return `${Math.floor(days / 365)} years ago`;
  } catch {
    return "";
  }
}

// ─── Mock version comparison data ──────────────────────────────────

interface VersionDiff {
  category: string;
  icon: typeof Layers;
  changes: { type: "added" | "removed" | "modified"; label: string; detail?: string }[];
}

function getMockVersionDiffs(fromVersion: number, toVersion: number): VersionDiff[] {
  // Realistic mock diffs between versions
  const diffs: Record<string, VersionDiff[]> = {
    "4-5": [
      {
        category: "Components",
        icon: Layers,
        changes: [
          { type: "added", label: "Escalation Risk", detail: "New component at 5% weight, sourced from Freshdesk" },
          { type: "modified", label: "Support Burden", detail: "Threshold 'Elevated' changed from 12 to 10 open tickets" },
        ],
      },
      {
        category: "Weights",
        icon: BarChart3,
        changes: [
          { type: "modified", label: "Support Burden", detail: "15% → 15% (unchanged)" },
          { type: "modified", label: "Executive Engagement", detail: "10% → 5% (−5%)" },
          { type: "added", label: "Escalation Risk", detail: "0% → 5% (new)" },
        ],
      },
    ],
    "3-4": [
      {
        category: "Components",
        icon: Layers,
        changes: [
          { type: "added", label: "Renewal Risk", detail: "New component at 10% weight, sourced from Salesforce" },
        ],
      },
      {
        category: "Weights",
        icon: BarChart3,
        changes: [
          { type: "modified", label: "Billing Health", detail: "20% → 15% (−5%)" },
          { type: "modified", label: "Implementation Status", detail: "15% → 10% (−5%)" },
          { type: "added", label: "Renewal Risk", detail: "0% → 10% (new)" },
        ],
      },
    ],
    "2-3": [
      {
        category: "Segments",
        icon: GitBranch,
        changes: [
          { type: "added", label: "Onboarding", detail: "Priority 20 — has_active_onboarding = true" },
          { type: "added", label: "Enterprise", detail: "Priority 10 — industry IN [Logistics, Freight]" },
          { type: "added", label: "SMB", detail: "Priority 5 — industry NOT IN [Logistics, Freight]" },
        ],
      },
      {
        category: "Exception Rules",
        icon: Shield,
        changes: [
          { type: "added", label: "P1 Ticket Aging Override", detail: "Hard override — Force Critical at P100" },
          { type: "added", label: "Invoice 30+ Days Past Due", detail: "Hard override — Cap at 40 at P90" },
          { type: "added", label: "Sustained Critical Override", detail: "Hard override — Force Critical at P95" },
          { type: "added", label: "Low Sentiment Penalty", detail: "Soft modifier — Subtract 15 pts at P70" },
          { type: "added", label: "Implementation Behind Schedule", detail: "Soft modifier — Subtract 15 pts at P75" },
        ],
      },
    ],
    "1-2": [
      {
        category: "Weights",
        icon: BarChart3,
        changes: [
          { type: "modified", label: "Support Burden", detail: "20% → 15% (−5%)" },
          { type: "modified", label: "Relationship Sentiment", detail: "10% → 15% (+5%)" },
        ],
      },
    ],
  };

  const key = `${fromVersion}-${toVersion}`;
  return diffs[key] ?? [{ category: "Summary", icon: FileText, changes: [{ type: "modified", label: "Configuration updated", detail: `Changes between v${fromVersion} and v${toVersion}` }] }];
}

// ─── Component ─────────────────────────────────────────────────────

export default function VersionHistoryTab() {
  const { draft, published, rollback } = useHealthModel();
  const [activeSubTab, setActiveSubTab] = useState<"versions" | "audit" | "compare">("versions");
  const [expandedVersion, setExpandedVersion] = useState<number | null>(null);
  const [expandedAuditId, setExpandedAuditId] = useState<string | null>(null);
  const [compareFrom, setCompareFrom] = useState<number | null>(null);
  const [compareTo, setCompareTo] = useState<number | null>(null);
  const [auditFilter, setAuditFilter] = useState<"all" | "publish" | "draft_save">("all");
  const [showRollbackConfirm, setShowRollbackConfirm] = useState<number | null>(null);

  const model = draft ?? published;
  if (!model) return null;

  const auditLog = useMemo(
    () => [...model.audit_log].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [model.audit_log],
  );

  const filteredAudit = useMemo(
    () => auditFilter === "all" ? auditLog : auditLog.filter((e) => e.action === auditFilter),
    [auditLog, auditFilter],
  );

  // Build version list from publish entries
  const versions = useMemo(
    () => auditLog
      .filter((e) => e.action === "publish")
      .map((e) => ({
        version: e.version,
        published_at: e.timestamp,
        published_by: e.user,
        details: e.details,
        changes: e.changes,
        isActive: e.version === model.version,
      })),
    [auditLog, model.version],
  );

  // Compare diffs
  const compareDiffs = useMemo(() => {
    if (compareFrom === null || compareTo === null) return [];
    return getMockVersionDiffs(Math.min(compareFrom, compareTo), Math.max(compareFrom, compareTo));
  }, [compareFrom, compareTo]);

  const handleRollback = async (version: number) => {
    await rollback(version);
    setShowRollbackConfirm(null);
  };

  const openCompare = (fromV: number, toV: number) => {
    setCompareFrom(fromV);
    setCompareTo(toV);
    setActiveSubTab("compare");
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Sub-tabs ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 border-b border-dark-700/50">
          {([
            { id: "versions" as const, label: "Versions", icon: History },
            { id: "audit" as const, label: "Audit Log", icon: FileText },
            { id: "compare" as const, label: "Compare", icon: GitCompare },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? "border-b-2 border-accent-500 text-accent-400"
                  : "text-dark-400 hover:text-gray-300"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
        <span className="text-xs text-dark-500">{versions.length} published versions · {auditLog.length} audit entries</span>
      </div>

      {/* ═══════════ VERSIONS SUB-TAB ═══════════ */}
      {activeSubTab === "versions" && (
        <div className="space-y-3">
          {versions.length === 0 && (
            <div className="glass-card p-8 text-center">
              <History className="w-10 h-10 mx-auto mb-3 text-dark-500" />
              <p className="text-sm text-dark-400">No versions published yet. Publish your first model to start tracking history.</p>
            </div>
          )}

          {versions.map((v, idx) => {
            const isExpanded = expandedVersion === v.version;
            const prevVersion = versions[idx + 1];

            return (
              <div key={v.version}>
                <div
                  className={`glass-card overflow-hidden ${v.isActive ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-dark-700"}`}
                >
                  {/* Header row */}
                  <div
                    className="p-5 cursor-pointer hover:bg-dark-800/30 transition-colors"
                    onClick={() => setExpandedVersion(isExpanded ? null : v.version)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        {/* Version number */}
                        <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-dark-800/80 border border-dark-700/50 shrink-0">
                          <span className="text-base font-bold text-gray-200">v{v.version}</span>
                        </div>

                        {/* Meta */}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-gray-100">Version {v.version}</span>
                            {v.isActive && (
                              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                CURRENT
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1.5 text-xs text-dark-400">
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {formatDate(v.published_at)}</span>
                            <span className="flex items-center gap-1"><User className="w-3 h-3" /> {v.published_by}</span>
                            <span className="text-dark-500">{timeAgo(v.published_at)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Compare button */}
                        {prevVersion && (
                          <button
                            onClick={(e) => { e.stopPropagation(); openCompare(prevVersion.version, v.version); }}
                            className="px-3 py-1.5 text-xs text-dark-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                            title={`Compare v${prevVersion.version} → v${v.version}`}
                          >
                            <GitCompare className="w-3.5 h-3.5" /> Compare
                          </button>
                        )}

                        {/* Rollback button */}
                        {!v.isActive && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setShowRollbackConfirm(v.version); }}
                            className="px-3 py-1.5 text-xs text-dark-400 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Restore
                          </button>
                        )}

                        {isExpanded ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-dark-700/30 animate-fade-in">
                      <div className="ml-16 mt-4 space-y-3">
                        {/* Publish note */}
                        <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                          <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-2">Publish Note</h5>
                          <p className="text-sm text-gray-300">{v.details}</p>
                        </div>

                        {/* Changes summary */}
                        {Object.keys(v.changes).length > 0 && (
                          <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                            <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-2">Changes in this Version</h5>
                            <div className="space-y-1.5">
                              {Object.entries(v.changes).map(([key, val]) => (
                                <div key={key} className="text-xs text-dark-400 flex items-center gap-2">
                                  <span className="text-dark-500 font-mono">{key}:</span>
                                  <span className="text-gray-300">{Array.isArray(val) ? val.join(", ") : String(val)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-3">
                          {prevVersion && (
                            <button
                              onClick={() => openCompare(prevVersion.version, v.version)}
                              className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
                            >
                              View diff from v{prevVersion.version} <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Rollback confirmation inline */}
                {showRollbackConfirm === v.version && (
                  <div className="mt-2 p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 animate-fade-in">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm text-amber-400 font-medium">Restore version {v.version} as new draft?</p>
                        <p className="text-xs text-amber-400/70 mt-1">
                          This will overwrite your current draft with the configuration from v{v.version} (published {formatDate(v.published_at)}).
                          You must publish the restored draft to make it active.
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          <button onClick={() => handleRollback(v.version)} className="px-3 py-1.5 text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg hover:bg-amber-500/30 transition-colors">
                            Restore as Draft
                          </button>
                          <button onClick={() => setShowRollbackConfirm(null)} className="px-3 py-1.5 text-xs text-dark-400 hover:text-gray-300 transition-colors">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ AUDIT LOG SUB-TAB ═══════════ */}
      {activeSubTab === "audit" && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-dark-400" />
            <span className="text-xs text-dark-400">Show:</span>
            {([
              { id: "all" as const, label: "All Activity" },
              { id: "publish" as const, label: "Publishes" },
              { id: "draft_save" as const, label: "Draft Saves" },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setAuditFilter(f.id)}
                className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                  auditFilter === f.id
                    ? "bg-accent-500/15 text-accent-400 border border-accent-500/20"
                    : "text-dark-400 hover:text-gray-300 hover:bg-dark-800/60"
                }`}
              >
                {f.label}
              </button>
            ))}
            <span className="text-xs text-dark-500 ml-auto">{filteredAudit.length} entries</span>
          </div>

          {/* Audit table */}
          <div className="glass-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4 w-40">Time</th>
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4 w-48">User</th>
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4 w-28">Action</th>
                  <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4 w-16">Ver</th>
                  <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Details</th>
                  <th className="w-8" />
                </tr>
              </thead>
              <tbody>
                {filteredAudit.map((entry) => {
                  const isExpanded = expandedAuditId === entry.id;
                  const config = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.created;
                  const Icon = config.icon;

                  return (
                    <tr key={entry.id} className="group">
                      <td colSpan={6} className="p-0">
                        <div
                          className={`flex items-start gap-0 px-0 cursor-pointer transition-colors ${isExpanded ? "bg-dark-800/30" : "hover:bg-dark-800/20"}`}
                          onClick={() => setExpandedAuditId(isExpanded ? null : entry.id)}
                        >
                          <div className="py-3 px-4 w-40 shrink-0">
                            <div className="text-xs text-dark-400 whitespace-nowrap">{formatDateTime(entry.timestamp)}</div>
                            <div className="text-[10px] text-dark-500 mt-0.5">{timeAgo(entry.timestamp)}</div>
                          </div>
                          <div className="py-3 px-4 w-48 shrink-0">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-dark-700/60 flex items-center justify-center shrink-0">
                                <User className="w-3 h-3 text-dark-400" />
                              </div>
                              <span className="text-xs text-gray-300 truncate">{entry.user}</span>
                            </div>
                          </div>
                          <div className="py-3 px-4 w-28 shrink-0">
                            <span className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full border ${config.color}`}>
                              <Icon className="w-3 h-3" />
                              {config.label}
                            </span>
                          </div>
                          <div className="py-3 px-4 w-16 shrink-0 text-center">
                            <span className="text-xs text-gray-300 font-mono">v{entry.version}</span>
                          </div>
                          <div className="py-3 px-4 flex-1 min-w-0">
                            <p className={`text-xs text-dark-400 ${isExpanded ? "" : "truncate"}`}>{entry.details}</p>
                          </div>
                          <div className="py-3 px-2 w-8 shrink-0">
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                          </div>
                        </div>

                        {/* Expanded changes */}
                        {isExpanded && Object.keys(entry.changes).length > 0 && (
                          <div className="px-4 pb-3 animate-fade-in">
                            <div className="ml-40 p-3 rounded-lg bg-dark-800/40 border border-dark-700/30">
                              <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-2">Changed Fields</h5>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-1">
                                {Object.entries(entry.changes).map(([key, val]) => (
                                  <div key={key} className="text-xs flex items-baseline gap-2">
                                    <span className="text-dark-500 font-mono shrink-0">{key}</span>
                                    <span className="text-gray-300 truncate">{Array.isArray(val) ? val.join(", ") : String(val)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Row divider */}
                        <div className="border-b border-dark-700/30" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══════════ COMPARE SUB-TAB ═══════════ */}
      {activeSubTab === "compare" && (
        <div className="space-y-5">
          {/* Version selectors */}
          <div className="glass-card p-5">
            <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Compare Versions</h4>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="text-xs text-dark-400 mb-1 block">From (older)</label>
                <select
                  className="input-dark"
                  value={compareFrom ?? ""}
                  onChange={(e) => setCompareFrom(Number(e.target.value))}
                >
                  <option value="">Select version...</option>
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version} — {formatDate(v.published_at)} by {v.published_by}
                    </option>
                  ))}
                </select>
              </div>
              <ArrowRight className="w-5 h-5 text-dark-500 mt-5 shrink-0" />
              <div className="flex-1">
                <label className="text-xs text-dark-400 mb-1 block">To (newer)</label>
                <select
                  className="input-dark"
                  value={compareTo ?? ""}
                  onChange={(e) => setCompareTo(Number(e.target.value))}
                >
                  <option value="">Select version...</option>
                  {versions.map((v) => (
                    <option key={v.version} value={v.version}>
                      v{v.version} — {formatDate(v.published_at)} by {v.published_by} {v.isActive ? "(current)" : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Diff results */}
          {compareFrom !== null && compareTo !== null && compareFrom !== compareTo && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 px-1">
                <span className="text-sm text-gray-200 font-medium">
                  Changes from v{Math.min(compareFrom, compareTo)} to v{Math.max(compareFrom, compareTo)}
                </span>
                <span className="text-xs text-dark-500">
                  {compareDiffs.reduce((s, d) => s + d.changes.length, 0)} changes across {compareDiffs.length} {compareDiffs.length === 1 ? "area" : "areas"}
                </span>
              </div>

              {compareDiffs.map((section, si) => {
                const SectionIcon = section.icon;
                return (
                  <div key={si} className="glass-card p-5">
                    <div className="flex items-center gap-2 mb-4">
                      <SectionIcon className="w-4 h-4 text-dark-400" />
                      <h4 className="text-sm font-semibold text-gray-200">{section.category}</h4>
                      <span className="text-xs text-dark-500">{section.changes.length} changes</span>
                    </div>
                    <div className="space-y-2">
                      {section.changes.map((change, ci) => (
                        <div
                          key={ci}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${
                            change.type === "added" ? "bg-emerald-500/5 border-emerald-500/15" :
                            change.type === "removed" ? "bg-red-500/5 border-red-500/15" :
                            "bg-amber-500/5 border-amber-500/15"
                          }`}
                        >
                          <span className={`text-xs font-bold shrink-0 mt-0.5 ${
                            change.type === "added" ? "text-emerald-400" :
                            change.type === "removed" ? "text-red-400" :
                            "text-amber-400"
                          }`}>
                            {change.type === "added" ? "+" : change.type === "removed" ? "−" : "~"}
                          </span>
                          <div>
                            <span className={`text-sm font-medium ${
                              change.type === "added" ? "text-emerald-400" :
                              change.type === "removed" ? "text-red-400" :
                              "text-amber-400"
                            }`}>
                              {change.label}
                            </span>
                            {change.detail && (
                              <p className="text-xs text-dark-400 mt-0.5">{change.detail}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {(compareFrom === null || compareTo === null) && (
            <div className="glass-card p-8 text-center">
              <GitCompare className="w-10 h-10 mx-auto mb-3 text-dark-500" />
              <p className="text-sm text-dark-400">Select two versions above to see what changed between them.</p>
            </div>
          )}

          {compareFrom !== null && compareTo !== null && compareFrom === compareTo && (
            <div className="glass-card p-8 text-center">
              <GitCompare className="w-10 h-10 mx-auto mb-3 text-dark-500" />
              <p className="text-sm text-dark-400">Select two different versions to compare.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
