import { useState, useMemo } from "react";
import {
  Plus,
  GitBranch,
  Users,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  Info,
  ArrowUp,
  ArrowDown,
  Trash2,
  CheckCircle2,
  Search,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import RuleBuilder from "../../components/health-model/RuleBuilder";
import type { SegmentDefinition, SegmentCondition } from "../../types";

// ─── Constants ─────────────────────────────────────────────────────

const SEGMENT_FIELDS = [
  { value: "industry", label: "Industry" },
  { value: "has_active_onboarding", label: "Has Active Onboarding" },
  { value: "has_gainsight", label: "Has Gainsight Connected" },
  { value: "arr", label: "ARR ($)" },
  { value: "employee_count", label: "Employee Count" },
  { value: "account_age_days", label: "Account Age (days)" },
  { value: "account_tier", label: "Account Tier" },
  { value: "region", label: "Region" },
  { value: "contract_term_months", label: "Contract Term (months)" },
];

const SEGMENT_OPERATORS = [
  { value: "eq", label: "Equals" },
  { value: "neq", label: "Not equals" },
  { value: "in", label: "Is one of" },
  { value: "not_in", label: "Is not one of" },
  { value: "gt", label: "Greater than" },
  { value: "lt", label: "Less than" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "contains", label: "Contains" },
];

function conditionSummary(conditions: SegmentCondition[]): string {
  if (conditions.length === 0) return "No conditions — matches all customers";
  return conditions.map((c) => {
    const val = Array.isArray(c.value) ? `[${c.value.join(", ")}]` : String(c.value);
    const opLabels: Record<string, string> = { eq: "=", neq: "≠", gt: ">", lt: "<", gte: ">=", lte: "<=", in: "IN", not_in: "NOT IN", contains: "contains" };
    return `${c.field} ${opLabels[c.operator] ?? c.operator} ${val}`;
  }).join("  AND  ");
}

function overrideDiffSummary(overrides: Record<string, number>, baseWeights: Map<string, { name: string; weight: number }>): string[] {
  return Object.entries(overrides).map(([compId, w]) => {
    const base = baseWeights.get(compId);
    if (!base) return `${compId} → ${w}%`;
    const delta = w - base.weight;
    const arrow = delta > 0 ? "↑" : delta < 0 ? "↓" : "=";
    return `${base.name}: ${base.weight}% → ${w}% ${arrow}`;
  });
}

// ─── Component ─────────────────────────────────────────────────────

export default function SegmentsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSeg, setLocalSeg] = useState<SegmentDefinition | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!draft) return null;

  const sorted = useMemo(
    () => [...draft.segments].sort((a, b) => b.priority - a.priority),
    [draft.segments],
  );
  const activeSegments = sorted.filter((s) => s.active);
  const inactiveSegments = sorted.filter((s) => !s.active);
  const activeComps = draft.components.filter((c) => c.active);
  const totalMatched = activeSegments.reduce((s, seg) => s + seg.customer_count, 0);

  const baseWeights = useMemo(
    () => new Map(activeComps.map((c) => [c.id, { name: c.name, weight: c.sensitivity.weight }])),
    [activeComps],
  );

  // ─── Warnings ───────────────────────────────────────────────

  const warnings: string[] = [];

  // Duplicate priorities
  const activePriorities = activeSegments.map((s) => s.priority);
  const hasDupePriorities = new Set(activePriorities).size !== activePriorities.length;
  if (hasDupePriorities) {
    const dupes = activePriorities.filter((p, i) => activePriorities.indexOf(p) !== i);
    warnings.push(`Segments share priority ${[...new Set(dupes)].join(", ")} — matching order is ambiguous. Assign unique priorities.`);
  }

  // Segments with no conditions
  const noConditions = activeSegments.filter((s) => s.conditions.length === 0);
  if (noConditions.length > 0) {
    warnings.push(`${noConditions.map((s) => `"${s.name}"`).join(", ")} ${noConditions.length === 1 ? "has" : "have"} no conditions — will match all customers.`);
  }

  // Segments with overrides that zero out a component
  const zeroOverrides = activeSegments.filter((s) =>
    Object.values(s.weight_overrides).some((w) => w === 0),
  );
  if (zeroOverrides.length > 0) {
    warnings.push(`${zeroOverrides.map((s) => `"${s.name}"`).join(", ")} ${zeroOverrides.length === 1 ? "sets" : "set"} component weight to 0% — that component will be excluded from scoring.`);
  }

  // ─── Handlers ───────────────────────────────────────────────

  const openEditor = (seg: SegmentDefinition) => {
    setLocalSeg(JSON.parse(JSON.stringify(seg)));
    setEditingId(seg.id);
  };

  const closeEditor = () => {
    setEditingId(null);
    setLocalSeg(null);
  };

  const saveSegment = () => {
    if (!localSeg) return;
    updateDraft((d) => ({
      ...d,
      segments: d.segments.map((s) => (s.id === localSeg.id ? localSeg : s)),
    }));
    closeEditor();
  };

  const toggleActive = (segId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateDraft((d) => ({
      ...d,
      segments: d.segments.map((s) =>
        s.id === segId ? { ...s, active: !s.active } : s,
      ),
    }));
  };

  const movePriority = (segId: string, direction: "up" | "down", e: React.MouseEvent) => {
    e.stopPropagation();
    const seg = draft.segments.find((s) => s.id === segId);
    if (!seg) return;
    const delta = direction === "up" ? 5 : -5;
    updateDraft((d) => ({
      ...d,
      segments: d.segments.map((s) =>
        s.id === segId ? { ...s, priority: Math.max(1, s.priority + delta) } : s,
      ),
    }));
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Customer Segments</h3>
          <p className="text-xs text-dark-400 mt-0.5">
            {activeSegments.length} active segments · {totalMatched} customers matched · Highest priority evaluated first
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled title="Coming soon">
          <Plus className="w-4 h-4" /> Add Segment
        </button>
      </div>

      {/* ── Warnings ────────────────────────────────────────── */}
      {warnings.length > 0 && (
        <div className="space-y-2">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-400">{w}</p>
            </div>
          ))}
        </div>
      )}
      {warnings.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">
            Segment priorities are unique — matching order is deterministic
          </span>
        </div>
      )}

      {/* ── Precedence diagram ──────────────────────────────── */}
      <div className="glass-card p-5">
        <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Evaluation Order (highest priority first)</h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {activeSegments.map((seg, idx) => (
            <div key={seg.id} className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-dark-800/60 border border-dark-700/30">
                <span className="text-[10px] font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 px-1.5 py-0.5 rounded">P{seg.priority}</span>
                <span className="text-sm text-gray-200 font-medium">{seg.name}</span>
                <span className="text-[10px] text-dark-500">{seg.customer_count} accts</span>
              </div>
              {idx < activeSegments.length - 1 && (
                <ChevronRight className="w-4 h-4 text-dark-500 shrink-0" />
              )}
            </div>
          ))}
          <div className="flex items-center gap-2 shrink-0">
            <ChevronRight className="w-4 h-4 text-dark-500 shrink-0" />
            <div className="px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/20 border-dashed">
              <span className="text-sm text-dark-500">Base Model (fallback)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Segment list ────────────────────────────────────── */}
      <div className="glass-card p-0 overflow-hidden">
        {sorted.map((seg, idx) => {
          const isExpanded = expandedId === seg.id;
          const overrideCount = Object.keys(seg.weight_overrides).length;
          const diffLines = overrideDiffSummary(seg.weight_overrides, baseWeights);

          return (
            <div
              key={seg.id}
              className={`${idx < sorted.length - 1 ? "border-b border-dark-700/30" : ""} ${!seg.active ? "opacity-50" : ""}`}
            >
              {/* Main row */}
              <div
                className="p-4 hover:bg-dark-800/40 transition-colors cursor-pointer flex items-center justify-between gap-3"
                onClick={() => setExpandedId(isExpanded ? null : seg.id)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Priority badge */}
                  <div className="flex flex-col items-center gap-0.5 shrink-0">
                    <button onClick={(e) => movePriority(seg.id, "up", e)} className="text-dark-500 hover:text-gray-300 transition-colors p-0.5"><ArrowUp className="w-3 h-3" /></button>
                    <div className="flex items-center justify-center w-9 h-7 rounded bg-violet-500/10 border border-violet-500/20">
                      <span className="text-xs font-bold text-violet-400">P{seg.priority}</span>
                    </div>
                    <button onClick={(e) => movePriority(seg.id, "down", e)} className="text-dark-500 hover:text-gray-300 transition-colors p-0.5"><ArrowDown className="w-3 h-3" /></button>
                  </div>

                  {/* Active indicator */}
                  <div className={`w-1.5 h-10 rounded-full shrink-0 ${seg.active ? "bg-emerald-500" : "bg-dark-600"}`} />

                  {/* Content */}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-100">{seg.name}</div>
                    <div className="text-xs text-dark-400 mt-0.5 font-mono truncate">{conditionSummary(seg.conditions)}</div>
                    {seg.description && <p className="text-xs text-dark-500 mt-1 truncate">{seg.description}</p>}
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Stats */}
                  <div className="text-right hidden md:block">
                    <div className="flex items-center gap-1.5 text-xs text-dark-400"><Users className="w-3 h-3" /> {seg.customer_count} matched</div>
                    <div className="text-[10px] text-dark-500 mt-0.5">
                      {overrideCount > 0 ? `${overrideCount} weight override${overrideCount > 1 ? "s" : ""}` : "Base weights"}
                    </div>
                  </div>

                  {/* Toggle */}
                  <button onClick={(e) => toggleActive(seg.id, e)} className="text-dark-400 hover:text-gray-300 transition-colors" title={seg.active ? "Disable segment" : "Enable segment"}>
                    {seg.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                  </button>

                  {/* Edit */}
                  <button onClick={(e) => { e.stopPropagation(); openEditor(seg); }} className="text-dark-400 hover:text-accent-400 transition-colors" title="Edit segment">
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Expand */}
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 ml-[52px] animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Conditions */}
                    <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                      <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-2">Matching Conditions</h5>
                      {seg.conditions.length === 0 ? (
                        <p className="text-xs text-dark-400 italic">No conditions — matches all customers</p>
                      ) : (
                        <div className="space-y-1.5">
                          {seg.conditions.map((c, ci) => (
                            <div key={ci} className="text-xs">
                              {ci > 0 && <span className="text-dark-500 font-medium mr-2">AND</span>}
                              <span className="text-gray-300 font-mono">
                                {c.field} <span className="text-accent-400">{c.operator}</span> {Array.isArray(c.value) ? c.value.join(", ") : String(c.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Weight overrides */}
                    <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                      <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-2">Weight Differences vs Base</h5>
                      {diffLines.length === 0 ? (
                        <p className="text-xs text-dark-400 italic">Uses base weights — no overrides</p>
                      ) : (
                        <div className="space-y-1">
                          {diffLines.map((line, li) => (
                            <div key={li} className="text-xs text-accent-400 font-mono">{line}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-3">
                    <button onClick={() => openEditor(seg)} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
                      Edit segment configuration →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Fallback row */}
        <div className="p-4 bg-dark-850/50 border-t border-dark-700/50">
          <div className="flex items-center gap-3">
            <GitBranch className="w-4 h-4 text-dark-500" />
            <div>
              <p className="text-xs text-dark-400">Customers matching no segment use base weights</p>
              <p className="text-[10px] text-dark-500 mt-0.5">
                Customers not matching any segment will use base model weights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Inline help ─────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
        <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
        <p className="text-xs text-dark-400">
          Segments are evaluated in priority order (highest first). The first matching segment determines
          the customer&apos;s effective weight distribution. If no segment matches, base model weights apply.
          Each customer matches at most one segment.
        </p>
      </div>

      {/* ── Editor drawer ───────────────────────────────────── */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localSeg ? `Edit: ${localSeg.name}` : "Edit Segment"}
        subtitle={localSeg ? `${localSeg.id} · Priority ${localSeg.priority} · ${localSeg.customer_count} customers` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button onClick={saveSegment} className="btn-primary text-sm">Save to Draft</button>
          </div>
        }
      >
        {localSeg && (
          <div className="space-y-6">

            {/* Identity */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Identity</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Segment Name</label>
                <input className="input-dark" value={localSeg.name} onChange={(e) => setLocalSeg({ ...localSeg, name: e.target.value })} placeholder="e.g., Enterprise Accounts" />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description</label>
                <textarea className="input-dark resize-none" rows={2} value={localSeg.description} onChange={(e) => setLocalSeg({ ...localSeg, description: e.target.value })} placeholder="When this segment should match and why it needs different scoring..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Priority</label>
                  <input type="number" className="input-dark" min={1} max={100} value={localSeg.priority} onChange={(e) => setLocalSeg({ ...localSeg, priority: Number(e.target.value) })} />
                  <p className="text-[10px] text-dark-500 mt-1">Higher = matched first. Use increments of 5.</p>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Matched Accounts</label>
                  <div className="input-dark opacity-60 cursor-not-allowed flex items-center gap-2">
                    <Users className="w-4 h-4 text-dark-400" />
                    {localSeg.customer_count}
                  </div>
                  <p className="text-[10px] text-dark-500 mt-1">Computed from customer data.</p>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Matching Conditions</h4>
                <p className="text-[10px] text-dark-500 mt-1">All conditions must be true for a customer to match this segment.</p>
              </div>
              <RuleBuilder
                conditions={localSeg.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value }))}
                onChange={(conds) => setLocalSeg({ ...localSeg, conditions: conds.map((c) => ({ field: c.field, operator: c.operator, value: c.value })) })}
                fields={SEGMENT_FIELDS}
                operators={SEGMENT_OPERATORS}
              />
            </div>

            {/* Weight overrides */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Weight Overrides</h4>
                <p className="text-[10px] text-dark-500 mt-1">Override base weights for customers in this segment. Non-overridden components inherit base weights.</p>
              </div>
              <div className="space-y-1">
                {activeComps.map((comp) => {
                  const override = localSeg.weight_overrides[comp.id];
                  const isOverridden = override !== undefined;
                  const delta = isOverridden ? override - comp.sensitivity.weight : 0;
                  return (
                    <div key={comp.id} className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-dark-800/40 transition-colors">
                      <div className="min-w-0">
                        <span className="text-sm text-gray-300">{comp.name}</span>
                        <span className="text-xs text-dark-500 ml-2">Base: {comp.sensitivity.weight}%</span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {isOverridden ? (
                          <>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              className="w-16 px-2 py-1.5 bg-dark-800/80 border border-accent-500/30 rounded-lg text-accent-400 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                              value={override}
                              onChange={(e) => setLocalSeg({ ...localSeg, weight_overrides: { ...localSeg.weight_overrides, [comp.id]: Number(e.target.value) } })}
                            />
                            {delta !== 0 && (
                              <span className={`text-xs font-medium ${delta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                                {delta > 0 ? "+" : ""}{delta}
                              </span>
                            )}
                            <button
                              onClick={() => {
                                const next = { ...localSeg.weight_overrides };
                                delete next[comp.id];
                                setLocalSeg({ ...localSeg, weight_overrides: next });
                              }}
                              className="p-1 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                              title="Remove override"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => setLocalSeg({ ...localSeg, weight_overrides: { ...localSeg.weight_overrides, [comp.id]: comp.sensitivity.weight } })}
                            className="text-xs text-accent-400 hover:text-accent-300 px-2 py-1 rounded hover:bg-accent-500/10 transition-colors"
                          >
                            Override
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {Object.keys(localSeg.weight_overrides).length > 0 && (
                <div className="text-xs text-dark-500 px-3">
                  {Object.keys(localSeg.weight_overrides).length} override{Object.keys(localSeg.weight_overrides).length > 1 ? "s" : ""} ·
                  Override total: {Object.values(localSeg.weight_overrides).reduce((s, v) => s + v, 0)}% (will be normalized with non-overridden components)
                </div>
              )}
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
