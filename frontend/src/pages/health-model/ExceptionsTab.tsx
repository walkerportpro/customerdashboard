import { useState } from "react";
import { Shield, ChevronRight, ToggleLeft, ToggleRight, Plus } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import type { ExceptionRule, ExceptionCondition } from "../../types";

const SIGNALS = [
  { value: "p1_ticket_age_hours", label: "P1 Ticket Age (hours)" },
  { value: "invoice_days_overdue", label: "Invoice Days Overdue" },
  { value: "implementation_days_behind", label: "Implementation Days Behind" },
  { value: "avg_sentiment_score", label: "Avg Sentiment Score" },
  { value: "days_in_critical_band", label: "Days in Critical Band" },
  { value: "open_ticket_count", label: "Open Ticket Count" },
  { value: "nps_score", label: "NPS Score" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
];

function conditionSummary(conds: ExceptionCondition[]): string {
  return conds.map((c) => `${c.signal} ${c.operator} ${c.value}`).join(" AND ");
}

export default function ExceptionsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localRule, setLocalRule] = useState<ExceptionRule | null>(null);

  if (!draft) return null;

  const sorted = [...draft.exceptions].sort((a, b) => b.priority - a.priority);

  const openEditor = (rule: ExceptionRule) => {
    setLocalRule(JSON.parse(JSON.stringify(rule)));
    setEditingId(rule.id);
  };

  const closeEditor = () => { setEditingId(null); setLocalRule(null); };

  const saveRule = () => {
    if (!localRule) return;
    updateDraft((d) => ({
      ...d,
      exceptions: d.exceptions.map((e) => (e.id === localRule.id ? localRule : e)),
    }));
    closeEditor();
  };

  const toggleActive = (ruleId: string) => {
    updateDraft((d) => ({
      ...d,
      exceptions: d.exceptions.map((e) => e.id === ruleId ? { ...e, active: !e.active } : e),
    }));
  };

  const actionLabel = (rule: ExceptionRule) => {
    switch (rule.action) {
      case "force_band": return `Force ${rule.action_value}`;
      case "cap_score": return `Cap at ${rule.action_value}`;
      case "floor_score": return `Floor at ${rule.action_value}`;
      case "add_score": return `+${rule.action_value} pts`;
      case "subtract_score": return `−${rule.action_value} pts`;
      default: return `${rule.action}: ${rule.action_value}`;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Exception Rules</h3>
          <p className="text-xs text-dark-400 mt-1">Higher priority rules are evaluated first</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled>
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Priority</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Rule</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Type</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Action</th>
              <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Status</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((rule) => (
              <tr
                key={rule.id}
                className={`border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors cursor-pointer ${!rule.active ? "opacity-50" : ""}`}
                onClick={() => openEditor(rule)}
              >
                <td className="py-3 px-4">
                  <span className="inline-flex items-center justify-center w-8 h-6 rounded bg-dark-700/50 text-xs font-bold text-gray-300">{rule.priority}</span>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-100 font-medium">{rule.name}</div>
                  <div className="text-xs text-dark-400 mt-0.5">{conditionSummary(rule.conditions)}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${rule.is_hard_override ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                    {rule.is_hard_override ? "Hard" : "Soft"}
                  </span>
                </td>
                <td className="py-3 px-4 text-gray-300">{actionLabel(rule)}</td>
                <td className="py-3 px-4 text-center">
                  <button onClick={(e) => { e.stopPropagation(); toggleActive(rule.id); }}>
                    {rule.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-dark-400" />}
                  </button>
                </td>
                <td className="py-3 px-2">
                  <ChevronRight className="w-4 h-4 text-dark-500" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Editor drawer */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localRule ? `Edit: ${localRule.name}` : "Edit Exception Rule"}
        subtitle={localRule ? `Priority ${localRule.priority} · ${localRule.is_hard_override ? "Hard override" : "Soft modifier"}` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button onClick={saveRule} className="btn-primary text-sm">Save to Draft</button>
          </div>
        }
      >
        {localRule && (
          <div className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Identity</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Name</label>
                <input className="input-dark" value={localRule.name} onChange={(e) => setLocalRule({ ...localRule, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Priority</label>
                <input type="number" className="input-dark w-24" value={localRule.priority} onChange={(e) => setLocalRule({ ...localRule, priority: Number(e.target.value) })} />
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="override" checked={localRule.is_hard_override} onChange={() => setLocalRule({ ...localRule, is_hard_override: true })} className="accent-accent-500" />
                  <span className="text-sm text-gray-300">Hard Override</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="override" checked={!localRule.is_hard_override} onChange={() => setLocalRule({ ...localRule, is_hard_override: false })} className="accent-accent-500" />
                  <span className="text-sm text-gray-300">Soft Modifier</span>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Conditions</h4>
              {localRule.conditions.map((cond, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  {idx > 0 && <span className="text-xs text-dark-400 font-medium w-8 text-center shrink-0">AND</span>}
                  {idx === 0 && <span className="w-8 shrink-0" />}
                  <select
                    className="input-dark text-sm flex-1"
                    value={cond.signal}
                    onChange={(e) => {
                      const updated = [...localRule.conditions];
                      updated[idx] = { ...cond, signal: e.target.value };
                      setLocalRule({ ...localRule, conditions: updated });
                    }}
                  >
                    {SIGNALS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                  <select
                    className="input-dark text-sm w-20"
                    value={cond.operator}
                    onChange={(e) => {
                      const updated = [...localRule.conditions];
                      updated[idx] = { ...cond, operator: e.target.value };
                      setLocalRule({ ...localRule, conditions: updated });
                    }}
                  >
                    {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <input
                    type="number"
                    className="input-dark text-sm w-24"
                    value={Number(cond.value)}
                    onChange={(e) => {
                      const updated = [...localRule.conditions];
                      updated[idx] = { ...cond, value: Number(e.target.value) };
                      setLocalRule({ ...localRule, conditions: updated });
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Action</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Action Type</label>
                  <select className="input-dark" value={localRule.action} onChange={(e) => setLocalRule({ ...localRule, action: e.target.value })}>
                    <option value="force_band">Force Band</option>
                    <option value="cap_score">Cap Score</option>
                    <option value="floor_score">Floor Score</option>
                    <option value="add_score">Add Points</option>
                    <option value="subtract_score">Subtract Points</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">
                    {localRule.action === "force_band" ? "Target Band" : "Value"}
                  </label>
                  {localRule.action === "force_band" ? (
                    <select className="input-dark" value={String(localRule.action_value)} onChange={(e) => setLocalRule({ ...localRule, action_value: e.target.value })}>
                      {draft.bands.map((b) => <option key={b.label} value={b.label}>{b.label}</option>)}
                    </select>
                  ) : (
                    <input type="number" className="input-dark" value={Number(localRule.action_value)} onChange={(e) => setLocalRule({ ...localRule, action_value: Number(e.target.value) })} />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
