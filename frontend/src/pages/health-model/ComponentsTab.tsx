import { useState, useMemo } from "react";
import {
  Search,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Pencil,
  AlertTriangle,
  CheckCircle2,
  Info,
  TrendingUp,
  Headphones,
  CreditCard,
  Target,
  Rocket,
  Database,
  Shield,
  Users,
} from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import ThresholdEditor from "../../components/health-model/ThresholdEditor";
import type { ScoreComponent, ComponentThreshold } from "../../types";

// ─── Source system display config ──────────────────────────────────

const SOURCE_CONFIG: Record<string, { label: string; icon: typeof Database; color: string }> = {
  gainsight: { label: "Gainsight", icon: TrendingUp, color: "text-orange-400 bg-orange-500/10 border-orange-500/20" },
  freshdesk: { label: "Freshdesk", icon: Headphones, color: "text-green-400 bg-green-500/10 border-green-500/20" },
  stripe: { label: "Stripe", icon: CreditCard, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  gong: { label: "Gong", icon: Target, color: "text-violet-400 bg-violet-500/10 border-violet-500/20" },
  rocketlane: { label: "RocketLane", icon: Rocket, color: "text-cyan-400 bg-cyan-500/10 border-cyan-500/20" },
  salesforce: { label: "Salesforce", icon: Database, color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

const CATEGORY_BADGE: Record<string, string> = {
  engagement: "bg-accent-500/10 text-accent-400 border-accent-500/20",
  support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  financial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  relationship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  onboarding: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  commercial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const SCORING_METHOD_LABELS: Record<string, string> = {
  threshold: "Threshold",
  range: "Range",
  boolean: "Boolean",
  trend: "Trend",
  point_accumulation: "Point Accumulation",
  recency_decay: "Recency Decay",
  manual_pulse: "Manual Pulse",
  external: "External",
};

const NULL_STRATEGY_LABELS: Record<string, string> = {
  assign_neutral: "Neutral (50)",
  assign_penalty: "Penalty",
  ignore_redistribute: "Redistribute",
  mark_low_confidence: "Low confidence",
};

const DIRECTIONALITY_LABELS: Record<string, string> = {
  higher_better: "Higher is better",
  lower_better: "Lower is better",
  deviation_bad: "Deviation is bad",
};

const METRIC_MAP: Record<string, string> = {
  "comp-usg": "mobile_app_usage_pct, tariffs_automation_pct",
  "comp-sup": "total_open_tickets",
  "comp-bil": "invoice_days_overdue",
  "comp-rel": "sentiment_score",
  "comp-imp": "percent_complete",
  "comp-esc": "escalated_ticket_count",
  "comp-eng": "recent_executive_calls",
  "comp-rnw": "volume_change_pct",
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

// ─── Component ─────────────────────────────────────────────────────

export default function ComponentsTab() {
  const { draft, published, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localComp, setLocalComp] = useState<ScoreComponent | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");

  if (!draft) return null;

  // ─── Derived data ────────────────────────────────────────────

  const allComponents = draft.components;
  const activeComponents = allComponents.filter((c) => c.active);
  const totalWeight = activeComponents.reduce((s, c) => s + c.sensitivity.weight, 0);

  const publishedWeightMap = useMemo(
    () => new Map((published?.components ?? []).map((c) => [c.id, c.sensitivity.weight])),
    [published],
  );

  const filtered = useMemo(() => {
    let list = allComponents;
    if (filterStatus === "active") list = list.filter((c) => c.active);
    if (filterStatus === "inactive") list = list.filter((c) => !c.active);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.source_system.toLowerCase().includes(q) ||
          c.category.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q),
      );
    }
    return list;
  }, [allComponents, filterStatus, search]);

  // ─── Drawer handlers ─────────────────────────────────────────

  const openEditor = (comp: ScoreComponent) => {
    setLocalComp(JSON.parse(JSON.stringify(comp)));
    setEditingId(comp.id);
  };

  const closeEditor = () => {
    setEditingId(null);
    setLocalComp(null);
  };

  const saveComponent = () => {
    if (!localComp) return;
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) => (c.id === localComp.id ? { ...localComp, updated_at: new Date().toISOString() } : c)),
    }));
    closeEditor();
  };

  const toggleActive = (compId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, active: !c.active, updated_at: new Date().toISOString() } : c,
      ),
    }));
  };

  // ─── Weight validation ───────────────────────────────────────

  // Compute what weight total would be if we save the local component
  const projectedWeight = useMemo(() => {
    if (!localComp) return totalWeight;
    const otherActive = draft.components.filter((c) => c.active && c.id !== localComp.id);
    const localActive = localComp.active;
    return otherActive.reduce((s, c) => s + c.sensitivity.weight, 0) + (localActive ? localComp.sensitivity.weight : 0);
  }, [localComp, draft.components, totalWeight]);

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Header bar ──────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
            Score Components
          </h3>
          <p className="text-xs text-dark-400 mt-0.5">
            {activeComponents.length} active of {allComponents.length} · Weights total {totalWeight}%
          </p>
        </div>

        {/* Weight validation badge */}
        {totalWeight !== 100 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-xs text-amber-400 font-medium">
              Weights sum to {totalWeight}% — will normalize to 100%
            </span>
          </div>
        )}
        {totalWeight === 100 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Weights balanced at 100%</span>
          </div>
        )}
      </div>

      {/* ── Search & filter bar ─────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
          <input
            className="input-dark pl-9"
            placeholder="Search by name, source, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex rounded-lg border border-dark-700/50 overflow-hidden">
          {(["all", "active", "inactive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors capitalize ${
                filterStatus === f
                  ? "bg-accent-500/15 text-accent-400"
                  : "text-dark-400 hover:text-gray-300 hover:bg-dark-800/40"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* ── Component table ─────────────────────────────────── */}
      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-dark-700/50">
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Component</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Source</th>
              <th className="text-center text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">Status</th>
              <th className="text-right text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-3">Weight</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Method</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Null Handling</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Freshness</th>
              <th className="text-left text-xs uppercase tracking-wider text-dark-400 font-medium py-3 px-4">Modified</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((comp) => {
              const src = SOURCE_CONFIG[comp.source_system];
              const SrcIcon = src?.icon ?? Database;
              const catBadge = CATEGORY_BADGE[comp.category] ?? "bg-dark-700/50 text-dark-400 border-dark-600/50";
              const pubWeight = publishedWeightMap.get(comp.id);
              const weightDelta = pubWeight !== undefined ? comp.sensitivity.weight - pubWeight : null;

              return (
                <tr
                  key={comp.id}
                  className={`border-b border-dark-700/30 hover:bg-dark-800/40 transition-colors cursor-pointer ${!comp.active ? "opacity-50" : ""}`}
                  onClick={() => openEditor(comp)}
                >
                  {/* Component name + category */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-8 rounded-full shrink-0 ${comp.active ? "bg-emerald-500" : "bg-dark-600"}`} />
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-gray-100 truncate">{comp.name}</div>
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${catBadge}`}>
                          {comp.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Source system */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-6 h-6 rounded flex items-center justify-center border ${src?.color ?? "text-dark-400 bg-dark-700/50 border-dark-600/50"}`}>
                        <SrcIcon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs text-dark-300">{src?.label ?? comp.source_system}</span>
                    </div>
                  </td>

                  {/* Status toggle */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => toggleActive(comp.id, e)}
                      className="transition-colors inline-flex"
                      title={comp.active ? "Disable component" : "Enable component"}
                    >
                      {comp.active
                        ? <ToggleRight className="w-6 h-6 text-emerald-400" />
                        : <ToggleLeft className="w-6 h-6 text-dark-500" />
                      }
                    </button>
                  </td>

                  {/* Weight */}
                  <td className="py-3 px-3 text-right">
                    <div>
                      <span className="text-sm font-semibold text-gray-100">{comp.sensitivity.weight}%</span>
                      {weightDelta !== null && weightDelta !== 0 && (
                        <div className={`text-[10px] font-medium mt-0.5 ${weightDelta > 0 ? "text-emerald-400" : "text-red-400"}`}>
                          {weightDelta > 0 ? "+" : ""}{weightDelta}%
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Scoring method */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-dark-300">{SCORING_METHOD_LABELS[comp.scoring_method] ?? comp.scoring_method}</span>
                    <div className="text-[10px] text-dark-500 mt-0.5">{comp.thresholds.length} rules</div>
                  </td>

                  {/* Null handling */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-dark-300">{NULL_STRATEGY_LABELS[comp.null_handling.strategy] ?? comp.null_handling.strategy}</span>
                    <div className={`text-[10px] mt-0.5 ${
                      comp.null_handling.confidence_impact === "critical" ? "text-red-400"
                      : comp.null_handling.confidence_impact === "major" ? "text-amber-400"
                      : "text-dark-500"
                    }`}>
                      {comp.null_handling.confidence_impact} impact
                    </div>
                  </td>

                  {/* Freshness / time window */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-dark-300">{comp.time_window} window</span>
                    <div className="text-[10px] text-dark-500 mt-0.5">{comp.sensitivity.lookback_days}d lookback</div>
                  </td>

                  {/* Last modified */}
                  <td className="py-3 px-4">
                    <span className="text-xs text-dark-400">{formatDate(comp.updated_at)}</span>
                  </td>

                  {/* Edit arrow */}
                  <td className="py-3 px-2">
                    <ChevronRight className="w-4 h-4 text-dark-500" />
                  </td>
                </tr>
              );
            })}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="py-12 text-center text-sm text-dark-400">
                  {search ? `No components matching "${search}"` : "No components found"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Summary footer ──────────────────────────────────── */}
      <div className="flex items-center justify-between text-xs text-dark-500 px-1">
        <span>{filtered.length} of {allComponents.length} components shown</span>
        <span>
          Active weight: {totalWeight}%
          {totalWeight !== 100 && " (auto-normalized at calculation time)"}
        </span>
      </div>

      {/* ── Editor Drawer ───────────────────────────────────── */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localComp ? localComp.name : "Edit Component"}
        subtitle={localComp ? `${localComp.id} · ${SOURCE_CONFIG[localComp.source_system]?.label ?? localComp.source_system}` : undefined}
        footer={
          <div className="flex items-center justify-between">
            <div>
              {localComp && projectedWeight !== 100 && (
                <span className="text-xs text-amber-400 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Weight total will be {projectedWeight}%
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
              <button onClick={saveComponent} className="btn-primary text-sm">Save to Draft</button>
            </div>
          </div>
        }
      >
        {localComp && (
          <div className="space-y-6">

            {/* ─── Section: Identity ──────────────────────── */}
            <section>
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Identity</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Display Name</label>
                  <input
                    className="input-dark"
                    value={localComp.name}
                    onChange={(e) => setLocalComp({ ...localComp, name: e.target.value })}
                  />
                  <p className="text-[10px] text-dark-500 mt-1">Shown in dashboards, reports, and score breakdowns</p>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Description</label>
                  <textarea
                    className="input-dark resize-none"
                    rows={3}
                    value={localComp.description}
                    onChange={(e) => setLocalComp({ ...localComp, description: e.target.value })}
                  />
                  <p className="text-[10px] text-dark-500 mt-1">Internal documentation. Visible to admins configuring the health model.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Category</label>
                    <select
                      className="input-dark"
                      value={localComp.category}
                      onChange={(e) => setLocalComp({ ...localComp, category: e.target.value })}
                    >
                      <option value="engagement">Engagement</option>
                      <option value="support">Support</option>
                      <option value="financial">Financial</option>
                      <option value="relationship">Relationship</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="commercial">Commercial</option>
                    </select>
                    <p className="text-[10px] text-dark-500 mt-1">Groups related components in the UI</p>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Source System</label>
                    <div className="input-dark opacity-60 cursor-not-allowed flex items-center gap-2">
                      {(() => { const s = SOURCE_CONFIG[localComp.source_system]; const I = s?.icon ?? Database; return <I className="w-3.5 h-3.5" />; })()}
                      {SOURCE_CONFIG[localComp.source_system]?.label ?? localComp.source_system}
                    </div>
                    <p className="text-[10px] text-dark-500 mt-1">Integration source (read-only)</p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Mapped Metric</label>
                  <div className="input-dark opacity-60 cursor-not-allowed font-mono text-xs">
                    {METRIC_MAP[localComp.id] ?? `${localComp.source_system}.${localComp.category}_score`}
                  </div>
                  <p className="text-[10px] text-dark-500 mt-1">Raw field(s) extracted from the source integration</p>
                </div>
              </div>
            </section>

            {/* ─── Section: Scoring Method ────────────────── */}
            <section>
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Scoring Configuration</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Scoring Method</label>
                    <select
                      className="input-dark"
                      value={localComp.scoring_method}
                      onChange={(e) => setLocalComp({ ...localComp, scoring_method: e.target.value })}
                    >
                      <option value="threshold">Threshold — First matching rule wins</option>
                      <option value="range">Range — Linear interpolation</option>
                      <option value="boolean">Boolean — Binary on/off</option>
                      <option value="trend">Trend — Direction of change</option>
                      <option value="recency_decay">Recency Decay — Time since event</option>
                      <option value="point_accumulation">Point Accumulation — Event count</option>
                      <option value="manual_pulse">Manual Pulse — CSM input</option>
                      <option value="external">External — Third-party model</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Directionality</label>
                    <select
                      className="input-dark"
                      value={localComp.sensitivity.directionality}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, directionality: e.target.value as "higher_better" | "lower_better" | "deviation_bad" },
                      })}
                    >
                      <option value="higher_better">Higher is better — e.g., usage %, NPS</option>
                      <option value="lower_better">Lower is better — e.g., ticket count, churn risk</option>
                      <option value="deviation_bad">Deviation is bad — e.g., billing variance</option>
                    </select>
                  </div>
                </div>

                {/* Scoring method help text */}
                <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-dark-800/40 border border-dark-700/30">
                  <Info className="w-3.5 h-3.5 text-dark-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-dark-400">
                    {localComp.scoring_method === "threshold" && "Thresholds are evaluated top-to-bottom. The first matching condition determines the component score (0–100)."}
                    {localComp.scoring_method === "range" && "Raw value is linearly interpolated between defined boundaries to produce a score between min_impact and max_impact."}
                    {localComp.scoring_method === "boolean" && "A binary check — true maps to the first threshold score, false maps to the second."}
                    {localComp.scoring_method === "trend" && "Evaluates the direction and magnitude of change over the lookback window."}
                    {localComp.scoring_method === "recency_decay" && "Score decays exponentially based on days since the last qualifying event."}
                    {localComp.scoring_method === "point_accumulation" && "Each qualifying event adds or subtracts points from a base score of 100."}
                    {localComp.scoring_method === "manual_pulse" && "A CSM manually enters a score via the API. No automatic extraction."}
                    {localComp.scoring_method === "external" && "Score is provided by a third-party ML model or scoring service."}
                  </p>
                </div>
              </div>
            </section>

            {/* ─── Section: Thresholds ────────────────────── */}
            <section>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">
                  Thresholds ({localComp.thresholds.length} rules)
                </h4>
              </div>
              <ThresholdEditor
                thresholds={localComp.thresholds}
                onChange={(thresholds: ComponentThreshold[]) => setLocalComp({ ...localComp, thresholds })}
              />
              {localComp.thresholds.length === 0 && (
                <div className="flex items-center gap-2 mt-2 text-xs text-amber-400">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  No thresholds defined. This component cannot produce a score.
                </div>
              )}
            </section>

            {/* ─── Section: Weight ────────────────────────── */}
            <section>
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Weight & Sensitivity</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Weight (%)</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={localComp.sensitivity.weight}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, weight: Number(e.target.value) },
                      })}
                      className="flex-1 h-1.5 bg-dark-700/50 rounded-full appearance-none cursor-pointer accent-accent-500
                        [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent-500 [&::-webkit-slider-thumb]:shadow-lg
                        [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent-500 [&::-moz-range-thumb]:border-0"
                    />
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="w-16 px-2 py-1.5 bg-dark-800/80 border border-dark-700/50 rounded-lg text-gray-100 text-sm text-center focus:ring-2 focus:ring-accent-500/40 outline-none"
                      value={localComp.sensitivity.weight}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, weight: Math.min(100, Math.max(0, Number(e.target.value))) },
                      })}
                    />
                  </div>
                  <p className="text-[10px] text-dark-500 mt-1">How much this component contributes to the overall health score</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Time Window</label>
                    <select
                      className="input-dark"
                      value={localComp.time_window}
                      onChange={(e) => setLocalComp({ ...localComp, time_window: e.target.value })}
                    >
                      <option value="7d">7 days</option>
                      <option value="14d">14 days</option>
                      <option value="30d">30 days</option>
                      <option value="60d">60 days</option>
                      <option value="90d">90 days</option>
                      <option value="rolling_avg">Rolling average</option>
                      <option value="latest">Latest value only</option>
                    </select>
                    <p className="text-[10px] text-dark-500 mt-1">Period of source data considered for scoring</p>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Lookback (days)</label>
                    <input
                      type="number"
                      className="input-dark"
                      value={localComp.sensitivity.lookback_days}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, lookback_days: Number(e.target.value) },
                      })}
                    />
                    <p className="text-[10px] text-dark-500 mt-1">Data older than this is considered stale</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Smoothing</label>
                    <select
                      className="input-dark"
                      value={localComp.sensitivity.smoothing}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, smoothing: e.target.value as "none" | "light" | "moderate" | "heavy" },
                      })}
                    >
                      <option value="none">None — raw score used directly</option>
                      <option value="light">Light — α=0.7 EMA</option>
                      <option value="moderate">Moderate — α=0.5 EMA</option>
                      <option value="heavy">Heavy — α=0.3 EMA</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Volatility Cap</label>
                    <input
                      type="number"
                      className="input-dark"
                      value={localComp.sensitivity.volatility_cap}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        sensitivity: { ...localComp.sensitivity, volatility_cap: Number(e.target.value) },
                      })}
                    />
                    <p className="text-[10px] text-dark-500 mt-1">Max score change per recalculation cycle (pts)</p>
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Section: Missing Data ──────────────────── */}
            <section>
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium mb-4">Missing Data & Confidence</h4>
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Null Handling Strategy</label>
                  <select
                    className="input-dark"
                    value={localComp.null_handling.strategy}
                    onChange={(e) => setLocalComp({
                      ...localComp,
                      null_handling: { ...localComp.null_handling, strategy: e.target.value as "assign_neutral" | "assign_penalty" | "ignore_redistribute" | "mark_low_confidence" },
                    })}
                  >
                    <option value="assign_neutral">Assign Neutral (50) — safe default, no opinion</option>
                    <option value="assign_penalty">Assign Penalty — treat missing data as negative signal</option>
                    <option value="ignore_redistribute">Ignore &amp; Redistribute — exclude and rebalance weights</option>
                    <option value="mark_low_confidence">Mark Low Confidence — neutral score, reduce confidence</option>
                  </select>
                </div>

                {localComp.null_handling.strategy === "assign_penalty" && (
                  <div>
                    <label className="text-xs text-dark-400 mb-1 block">Penalty Score</label>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      className="input-dark w-24"
                      value={localComp.null_handling.penalty_score}
                      onChange={(e) => setLocalComp({
                        ...localComp,
                        null_handling: { ...localComp.null_handling, penalty_score: Number(e.target.value) },
                      })}
                    />
                    <p className="text-[10px] text-dark-500 mt-1">Score assigned when source data is unavailable (0–100)</p>
                  </div>
                )}

                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Confidence Impact</label>
                  <select
                    className="input-dark"
                    value={localComp.null_handling.confidence_impact}
                    onChange={(e) => setLocalComp({
                      ...localComp,
                      null_handling: { ...localComp.null_handling, confidence_impact: e.target.value as "none" | "minor" | "major" | "critical" },
                    })}
                  >
                    <option value="none">None — no effect on confidence score</option>
                    <option value="minor">Minor — reduces confidence by 5%</option>
                    <option value="major">Major — reduces confidence by 15%</option>
                    <option value="critical">Critical — reduces confidence by 30%</option>
                  </select>
                  <p className="text-[10px] text-dark-500 mt-1">How much missing data for this component reduces the overall confidence score</p>
                </div>
              </div>
            </section>

          </div>
        )}
      </Drawer>
    </div>
  );
}
