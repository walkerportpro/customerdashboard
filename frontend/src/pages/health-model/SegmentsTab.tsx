import { useState } from "react";
import { Plus, GitBranch, Users, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import RuleBuilder from "../../components/health-model/RuleBuilder";
import type { SegmentDefinition, SegmentCondition } from "../../types";

const SEGMENT_FIELDS = [
  { value: "industry", label: "Industry" },
  { value: "has_active_onboarding", label: "Has Active Onboarding" },
  { value: "arr", label: "ARR" },
  { value: "employee_count", label: "Employee Count" },
  { value: "account_age_days", label: "Account Age (days)" },
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
  return conditions.map((c) => {
    const val = Array.isArray(c.value) ? c.value.join(", ") : String(c.value);
    return `${c.field} ${c.operator} ${val}`;
  }).join(" AND ");
}

export default function SegmentsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localSeg, setLocalSeg] = useState<SegmentDefinition | null>(null);

  if (!draft) return null;

  const sorted = [...draft.segments].sort((a, b) => b.priority - a.priority);
  const activeComps = draft.components.filter((c) => c.active);

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

  const toggleActive = (segId: string) => {
    updateDraft((d) => ({
      ...d,
      segments: d.segments.map((s) =>
        s.id === segId ? { ...s, active: !s.active } : s
      ),
    }));
  };

  const overrideSummary = (seg: SegmentDefinition) => {
    const entries = Object.entries(seg.weight_overrides);
    if (entries.length === 0) return "No weight overrides";
    return entries.map(([compId, w]) => {
      const comp = draft.components.find((c) => c.id === compId);
      return `${comp?.name ?? compId} → ${w}%`;
    }).join(", ");
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Customer Segments</h3>
          <p className="text-xs text-dark-400 mt-1">Highest priority segment is evaluated first</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled>
          <Plus className="w-4 h-4" /> Add Segment
        </button>
      </div>

      <div className="glass-card p-0 overflow-hidden">
        {sorted.map((seg, idx) => (
          <div
            key={seg.id}
            className={`p-4 hover:bg-dark-800/40 transition-colors cursor-pointer ${idx < sorted.length - 1 ? "border-b border-dark-700/30" : ""} ${!seg.active ? "opacity-50" : ""}`}
            onClick={() => openEditor(seg)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 border border-violet-500/20 shrink-0">
                  <span className="text-xs font-bold text-violet-400">P{seg.priority}</span>
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-100">{seg.name}</div>
                  <div className="text-xs text-dark-400 mt-0.5">{conditionSummary(seg.conditions)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 shrink-0">
                <div className="text-right">
                  <div className="text-xs text-dark-400 flex items-center gap-1"><Users className="w-3 h-3" /> {seg.customer_count}</div>
                  <div className="text-[10px] text-dark-500 mt-0.5">{Object.keys(seg.weight_overrides).length} overrides</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); toggleActive(seg.id); }}
                  className="text-dark-400 hover:text-gray-300 transition-colors"
                >
                  {seg.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                </button>
                <ChevronRight className="w-4 h-4 text-dark-500" />
              </div>
            </div>
          </div>
        ))}

        {/* Fallback row */}
        <div className="p-3 bg-dark-850/50 border-t border-dark-700/50">
          <p className="text-xs text-dark-500 flex items-center gap-2">
            <GitBranch className="w-3 h-3" />
            Customers matching no segment use base weights
          </p>
        </div>
      </div>

      {/* Editor drawer */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localSeg ? `Edit: ${localSeg.name}` : "Edit Segment"}
        subtitle={localSeg ? `Priority ${localSeg.priority} · ${localSeg.customer_count} customers matched` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button onClick={saveSegment} className="btn-primary text-sm">Save to Draft</button>
          </div>
        }
      >
        {localSeg && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Identity</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Name</label>
                <input className="input-dark" value={localSeg.name} onChange={(e) => setLocalSeg({ ...localSeg, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description</label>
                <textarea className="input-dark resize-none" rows={2} value={localSeg.description} onChange={(e) => setLocalSeg({ ...localSeg, description: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Priority (higher = matched first)</label>
                <input type="number" className="input-dark w-24" value={localSeg.priority} onChange={(e) => setLocalSeg({ ...localSeg, priority: Number(e.target.value) })} />
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Conditions</h4>
              <RuleBuilder
                conditions={localSeg.conditions.map((c) => ({ field: c.field, operator: c.operator, value: c.value }))}
                onChange={(conds) => setLocalSeg({ ...localSeg, conditions: conds.map((c) => ({ field: c.field, operator: c.operator, value: c.value })) })}
                fields={SEGMENT_FIELDS}
                operators={SEGMENT_OPERATORS}
              />
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Weight Overrides</h4>
              <p className="text-xs text-dark-400">Override base weights for customers in this segment</p>
              <div className="space-y-2">
                {activeComps.map((comp) => {
                  const override = localSeg.weight_overrides[comp.id];
                  const isOverridden = override !== undefined;
                  return (
                    <div key={comp.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-dark-800/40 transition-colors">
                      <span className="text-sm text-gray-300">{comp.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-dark-500">Base: {comp.sensitivity.weight}%</span>
                        {isOverridden ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              className="w-16 px-2 py-1 bg-dark-800/80 border border-accent-500/30 rounded-lg text-accent-400 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                              value={override}
                              onChange={(e) => setLocalSeg({ ...localSeg, weight_overrides: { ...localSeg.weight_overrides, [comp.id]: Number(e.target.value) } })}
                            />
                            <button
                              onClick={() => {
                                const { [comp.id]: _, ...rest } = localSeg.weight_overrides;
                                setLocalSeg({ ...localSeg, weight_overrides: rest });
                              }}
                              className="text-xs text-dark-400 hover:text-red-400 transition-colors"
                            >
                              Clear
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setLocalSeg({ ...localSeg, weight_overrides: { ...localSeg.weight_overrides, [comp.id]: comp.sensitivity.weight } })}
                            className="text-xs text-accent-400 hover:text-accent-300 transition-colors"
                          >
                            Override
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
