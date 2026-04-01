import { useState, useMemo } from "react";
import {
  Shield,
  ShieldAlert,
  ChevronRight,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Info,
  ArrowRight,
  Trash2,
  Zap,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import type { ExceptionRule, ExceptionCondition } from "../../types";

// ─── Constants ─────────────────────────────────────────────────────

const SIGNALS = [
  { value: "open_p1_ticket_count", label: "Open P1 Ticket Count", hint: "Number of open priority-1 tickets" },
  { value: "p1_ticket_age_hours", label: "P1 Ticket Age (hours)", hint: "Hours since oldest P1 ticket was opened" },
  { value: "invoice_days_overdue", label: "Invoice Days Overdue", hint: "Days past due for the oldest unpaid invoice" },
  { value: "rocketlane_blocked_projects", label: "Blocked Projects", hint: "Number of Rocketlane projects in Blocked status" },
  { value: "implementation_days_behind", label: "Implementation Days Behind", hint: "Days behind schedule for the worst onboarding project" },
  { value: "avg_sentiment_score", label: "Avg Sentiment Score", hint: "Average Gong sentiment across recent calls (0.0 – 1.0)" },
  { value: "days_in_critical_band", label: "Days in Critical Band", hint: "Consecutive days the customer has been in Critical" },
  { value: "active_exec_escalation", label: "Active Exec Escalations", hint: "Number of active executive-level escalations" },
  { value: "open_ticket_count", label: "Open Ticket Count", hint: "Total open tickets across all priorities" },
  { value: "nps_score", label: "NPS Score", hint: "Latest Net Promoter Score (−100 to 100)" },
  { value: "churn_risk_score", label: "Churn Risk Score", hint: "ML-predicted churn risk (0 – 100)" },
];

const OPERATORS = [
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
  { value: "eq", label: "=" },
  { value: "neq", label: "≠" },
];

const ACTION_LABELS: Record<string, string> = {
  force_band: "Force Band",
  cap_score: "Cap Score At",
  floor_score: "Floor Score At",
  add_score: "Add Points",
  subtract_score: "Subtract Points",
};

const ACTION_DESCRIPTIONS: Record<string, string> = {
  force_band: "Override the calculated band entirely, ignoring the weighted score",
  cap_score: "Set a maximum score ceiling — score cannot exceed this value",
  floor_score: "Set a minimum score floor — score cannot drop below this value",
  add_score: "Add a fixed number of points to the calculated score",
  subtract_score: "Subtract a fixed number of points from the calculated score",
};

function conditionToString(cond: ExceptionCondition): string {
  const sig = SIGNALS.find((s) => s.value === cond.signal);
  const opLabel = OPERATORS.find((o) => o.value === cond.operator);
  return `${sig?.label ?? cond.signal} ${opLabel?.label ?? cond.operator} ${cond.value}`;
}

function actionToString(rule: ExceptionRule): string {
  switch (rule.action) {
    case "force_band": return `Force → ${rule.action_value}`;
    case "cap_score": return `Cap at ${rule.action_value}`;
    case "floor_score": return `Floor at ${rule.action_value}`;
    case "add_score": return `+${rule.action_value} pts`;
    case "subtract_score": return `−${rule.action_value} pts`;
    default: return `${rule.action}: ${rule.action_value}`;
  }
}

function ruleDescription(rule: ExceptionRule): string {
  const conds = rule.conditions.map(conditionToString).join(" AND ");
  return `IF ${conds} THEN ${actionToString(rule)}`;
}

// ─── Component ─────────────────────────────────────────────────────

export default function ExceptionsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localRule, setLocalRule] = useState<ExceptionRule | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!draft) return null;

  const sorted = useMemo(
    () => [...draft.exceptions].sort((a, b) => b.priority - a.priority),
    [draft.exceptions],
  );
  const activeRules = sorted.filter((r) => r.active);
  const hardOverrides = activeRules.filter((r) => r.is_hard_override);
  const softModifiers = activeRules.filter((r) => !r.is_hard_override);

  // ─── Warnings ───────────────────────────────────────────────

  const warnings: { severity: "warning" | "error" | "info"; message: string }[] = [];

  if (hardOverrides.length >= 4) {
    warnings.push({
      severity: "warning",
      message: `${hardOverrides.length} hard overrides active — aggressive overrides can mask underlying score signals and make the health score less meaningful.`,
    });
  }

  // Check for conflicting force_band rules at adjacent priorities
  const forceBandRules = activeRules.filter((r) => r.action === "force_band");
  if (forceBandRules.length >= 2) {
    const bands = forceBandRules.map((r) => String(r.action_value));
    if (new Set(bands).size > 1) {
      warnings.push({
        severity: "info",
        message: `Multiple force_band rules target different bands (${[...new Set(bands)].join(", ")}). The highest-priority match wins when both fire.`,
      });
    }
  }

  // Check for duplicate priorities
  const activePriorities = activeRules.map((r) => r.priority);
  if (new Set(activePriorities).size !== activePriorities.length) {
    warnings.push({
      severity: "warning",
      message: "Multiple rules share the same priority. Evaluation order is ambiguous for tied priorities.",
    });
  }

  // ─── Handlers ───────────────────────────────────────────────

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

  const toggleActive = (ruleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateDraft((d) => ({
      ...d,
      exceptions: d.exceptions.map((r) => r.id === ruleId ? { ...r, active: !r.active } : r),
    }));
  };

  const addCondition = () => {
    if (!localRule) return;
    setLocalRule({
      ...localRule,
      conditions: [...localRule.conditions, { signal: SIGNALS[0].value, operator: "gte", value: 1, conjunction: "and" }],
    });
  };

  const removeCondition = (idx: number) => {
    if (!localRule) return;
    setLocalRule({
      ...localRule,
      conditions: localRule.conditions.filter((_, i) => i !== idx),
    });
  };

  const updateCondition = (idx: number, updates: Partial<ExceptionCondition>) => {
    if (!localRule) return;
    setLocalRule({
      ...localRule,
      conditions: localRule.conditions.map((c, i) => i === idx ? { ...c, ...updates } : c),
    });
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Exception Rules</h3>
          <p className="text-xs text-dark-400 mt-0.5">
            {activeRules.length} active · {hardOverrides.length} hard overrides · {softModifiers.length} soft modifiers · Evaluated highest priority first
          </p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled title="Coming soon">
          <Plus className="w-4 h-4" /> Add Rule
        </button>
      </div>

      {/* ── Warnings ────────────────────────────────────────── */}
      {warnings.map((w, i) => (
        <div
          key={i}
          className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${
            w.severity === "error" ? "bg-red-500/10 border-red-500/20" :
            w.severity === "warning" ? "bg-amber-500/10 border-amber-500/20" :
            "bg-dark-800/40 border-dark-700/30"
          }`}
        >
          {w.severity === "error" ? <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" /> :
           w.severity === "warning" ? <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> :
           <Info className="w-4 h-4 text-dark-400 shrink-0 mt-0.5" />}
          <p className={`text-sm ${w.severity === "error" ? "text-red-400" : w.severity === "warning" ? "text-amber-400" : "text-dark-400"}`}>
            {w.message}
          </p>
        </div>
      ))}
      {warnings.length === 0 && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">Exception rules configured — priorities are unique</span>
        </div>
      )}

      {/* ── Summary cards ───────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Hard Overrides</span>
          </div>
          <div className="text-2xl font-bold text-gray-100">{hardOverrides.length}</div>
          <p className="text-[10px] text-dark-500 mt-1">Force band, cap score, floor score — cannot be outweighed</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Soft Modifiers</span>
          </div>
          <div className="text-2xl font-bold text-gray-100">{softModifiers.length}</div>
          <p className="text-[10px] text-dark-500 mt-1">Add/subtract points — adjusts but doesn&apos;t override</p>
        </div>
        <div className="glass-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-accent-400" />
            <span className="text-xs uppercase tracking-wider text-dark-400 font-medium">Priority Range</span>
          </div>
          <div className="text-2xl font-bold text-gray-100">
            {activeRules.length > 0 ? `${Math.min(...activeRules.map((r) => r.priority))}–${Math.max(...activeRules.map((r) => r.priority))}` : "—"}
          </div>
          <p className="text-[10px] text-dark-500 mt-1">Highest priority evaluated first</p>
        </div>
      </div>

      {/* ── Rule list ───────────────────────────────────────── */}
      <div className="glass-card p-0 overflow-hidden">
        {sorted.map((rule, idx) => {
          const isExpanded = expandedId === rule.id;

          return (
            <div
              key={rule.id}
              className={`${idx < sorted.length - 1 ? "border-b border-dark-700/30" : ""} ${!rule.active ? "opacity-50" : ""}`}
            >
              {/* Main row */}
              <div
                className="p-4 hover:bg-dark-800/40 transition-colors cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : rule.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Priority badge */}
                    <div className="flex items-center justify-center w-9 h-7 rounded bg-dark-700/60 shrink-0">
                      <span className="text-xs font-bold text-gray-300">{rule.priority}</span>
                    </div>

                    {/* Type badge */}
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${
                      rule.is_hard_override
                        ? "bg-red-500/10 text-red-400 border-red-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {rule.is_hard_override ? "HARD" : "SOFT"}
                    </span>

                    {/* Name + condition preview */}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-100 truncate">{rule.name}</div>
                      <div className="text-xs text-dark-400 font-mono mt-0.5 truncate">{ruleDescription(rule)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {/* Action badge */}
                    <span className="text-xs px-2 py-1 rounded bg-dark-800/60 border border-dark-700/30 text-gray-300 font-medium whitespace-nowrap">
                      {actionToString(rule)}
                    </span>

                    <button onClick={(e) => toggleActive(rule.id, e)} className="text-dark-400 hover:text-gray-300 transition-colors">
                      {rule.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>

                    <button onClick={(e) => { e.stopPropagation(); openEditor(rule); }} className="text-dark-400 hover:text-accent-400 transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {isExpanded ? <ChevronDown className="w-4 h-4 text-dark-400" /> : <ChevronRight className="w-4 h-4 text-dark-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="px-4 pb-4 animate-fade-in">
                  <div className="ml-12 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Conditions */}
                    <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                      <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-3">Conditions (IF)</h5>
                      <div className="space-y-2">
                        {rule.conditions.map((cond, ci) => {
                          const sig = SIGNALS.find((s) => s.value === cond.signal);
                          return (
                            <div key={ci}>
                              {ci > 0 && <div className="text-[10px] text-dark-500 font-medium my-1 uppercase">{cond.conjunction}</div>}
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-gray-300">{sig?.label ?? cond.signal}</span>
                                <span className="text-accent-400 font-mono font-medium">{cond.operator}</span>
                                <span className="text-gray-100 font-medium">{cond.value}</span>
                              </div>
                              {sig?.hint && <p className="text-[10px] text-dark-500 mt-0.5">{sig.hint}</p>}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action */}
                    <div className="p-4 rounded-lg bg-dark-800/40 border border-dark-700/30">
                      <h5 className="text-[10px] uppercase tracking-wider text-dark-500 font-medium mb-3">Action (THEN)</h5>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${
                          rule.is_hard_override
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                        }`}>
                          {rule.is_hard_override ? "Hard Override" : "Soft Modifier"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-200 font-medium mb-1">
                        {ACTION_LABELS[rule.action] ?? rule.action}: <span className="text-accent-400">{rule.action_value}</span>
                      </div>
                      <p className="text-[10px] text-dark-500">{ACTION_DESCRIPTIONS[rule.action]}</p>
                      {rule.description && <p className="text-xs text-dark-400 mt-2 italic">{rule.description}</p>}
                    </div>
                  </div>

                  <div className="ml-12 mt-3">
                    <button onClick={() => openEditor(rule)} className="text-xs text-accent-400 hover:text-accent-300 transition-colors">
                      Edit rule configuration →
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Help text ───────────────────────────────────────── */}
      <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
        <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
        <div className="text-xs text-dark-400 space-y-1">
          <p>
            <strong className="text-dark-300">Hard overrides</strong> forcefully set the band or cap/floor the score — the weighted calculation cannot outweigh them.
            Use sparingly for critical business conditions (e.g., P1 tickets, overdue invoices).
          </p>
          <p>
            <strong className="text-dark-300">Soft modifiers</strong> add or subtract points from the calculated score. They adjust but don&apos;t force a specific outcome.
            Better for nuance (e.g., sentiment penalty, engagement bonus).
          </p>
          <p>
            Rules are evaluated from highest priority to lowest. The first matching hard override wins.
            All matching soft modifiers are applied cumulatively before hard overrides.
          </p>
        </div>
      </div>

      {/* ── Editor drawer ───────────────────────────────────── */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localRule ? `Edit: ${localRule.name}` : "Edit Exception Rule"}
        subtitle={localRule ? `${localRule.id} · Priority ${localRule.priority}` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button onClick={saveRule} className="btn-primary text-sm">Save to Draft</button>
          </div>
        }
      >
        {localRule && (
          <div className="space-y-6">

            {/* Identity */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Rule Identity</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Name</label>
                <input className="input-dark" value={localRule.name} onChange={(e) => setLocalRule({ ...localRule, name: e.target.value })} placeholder="e.g., P1 Ticket Aging Override" />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description</label>
                <textarea className="input-dark resize-none" rows={2} value={localRule.description} onChange={(e) => setLocalRule({ ...localRule, description: e.target.value })} placeholder="Explain when this rule should fire and why..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Priority</label>
                  <input type="number" className="input-dark" min={1} max={200} value={localRule.priority} onChange={(e) => setLocalRule({ ...localRule, priority: Number(e.target.value) })} />
                  <p className="text-[10px] text-dark-500 mt-1">Higher = evaluated first. Range: 1–200.</p>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Override Type</label>
                  <div className="flex gap-2 mt-1.5">
                    <button
                      onClick={() => setLocalRule({ ...localRule, is_hard_override: true })}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        localRule.is_hard_override
                          ? "bg-red-500/10 text-red-400 border-red-500/30"
                          : "bg-dark-800/60 text-dark-400 border-dark-700/50 hover:border-dark-600"
                      }`}
                    >
                      Hard Override
                    </button>
                    <button
                      onClick={() => setLocalRule({ ...localRule, is_hard_override: false })}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium border transition-colors ${
                        !localRule.is_hard_override
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          : "bg-dark-800/60 text-dark-400 border-dark-700/50 hover:border-dark-600"
                      }`}
                    >
                      Soft Modifier
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Conditions */}
            <div className="space-y-3">
              <div>
                <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Conditions (IF)</h4>
                <p className="text-[10px] text-dark-500 mt-1">All conditions must be true for the rule to fire.</p>
              </div>
              <div className="space-y-2">
                {localRule.conditions.map((cond, idx) => (
                  <div key={idx} className="space-y-1">
                    {idx > 0 && (
                      <div className="flex items-center gap-2 px-2">
                        <div className="h-px flex-1 bg-dark-700/30" />
                        <span className="text-[10px] uppercase tracking-wider text-dark-500 font-medium">AND</span>
                        <div className="h-px flex-1 bg-dark-700/30" />
                      </div>
                    )}
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-dark-800/30 border border-dark-700/20">
                      <select
                        className="flex-1 py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 focus:ring-2 focus:ring-accent-500/40 outline-none"
                        value={cond.signal}
                        onChange={(e) => updateCondition(idx, { signal: e.target.value })}
                      >
                        {SIGNALS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <select
                        className="w-16 py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, { operator: e.target.value })}
                      >
                        {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        type="number"
                        step="any"
                        className="w-20 py-1.5 px-2 text-sm bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                        value={Number(cond.value)}
                        onChange={(e) => updateCondition(idx, { value: Number(e.target.value) })}
                      />
                      {localRule.conditions.length > 1 && (
                        <button onClick={() => removeCondition(idx)} className="p-1.5 text-dark-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <button
                onClick={addCondition}
                className="flex items-center gap-2 px-3 py-2 text-sm text-dark-400 hover:text-accent-400 hover:bg-accent-500/10 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Condition
              </button>
            </div>

            {/* Action */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Action (THEN)</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Action Type</label>
                <select
                  className="input-dark"
                  value={localRule.action}
                  onChange={(e) => {
                    const action = e.target.value;
                    const defaultValue = action === "force_band" ? "At Risk" : 40;
                    setLocalRule({ ...localRule, action, action_value: defaultValue });
                  }}
                >
                  {Object.entries(ACTION_LABELS).map(([v, l]) => (
                    <option key={v} value={v}>{l}</option>
                  ))}
                </select>
                <p className="text-[10px] text-dark-500 mt-1">{ACTION_DESCRIPTIONS[localRule.action]}</p>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  {localRule.action === "force_band" ? "Target Band" : "Point Value"}
                </label>
                {localRule.action === "force_band" ? (
                  <select className="input-dark" value={String(localRule.action_value)} onChange={(e) => setLocalRule({ ...localRule, action_value: e.target.value })}>
                    {draft.bands.map((b) => (
                      <option key={b.label} value={b.label}>{b.label} ({b.min_score}–{b.max_score})</option>
                    ))}
                  </select>
                ) : (
                  <input type="number" className="input-dark" min={0} max={100} value={Number(localRule.action_value)} onChange={(e) => setLocalRule({ ...localRule, action_value: Number(e.target.value) })} />
                )}
              </div>

              {/* Rule preview */}
              <div className="p-3 rounded-lg bg-dark-800/60 border border-dark-700/30">
                <span className="text-[10px] uppercase tracking-wider text-dark-500 font-medium">Rule Preview</span>
                <p className="text-sm text-gray-200 font-mono mt-1">{ruleDescription(localRule)}</p>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
