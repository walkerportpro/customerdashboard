import { useState } from "react";
import { Plus, ChevronRight, ToggleLeft, ToggleRight } from "lucide-react";
import { useHealthModel } from "../../context/HealthModelContext";
import Drawer from "../../components/health-model/Drawer";
import ThresholdEditor from "../../components/health-model/ThresholdEditor";
import type { ScoreComponent, ComponentThreshold } from "../../types";

const categoryColors: Record<string, string> = {
  engagement: "bg-accent-500/10 text-accent-400 border-accent-500/20",
  support: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  financial: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  relationship: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  onboarding: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  commercial: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const sourceIcons: Record<string, string> = {
  gainsight: "Gainsight",
  freshdesk: "Freshdesk",
  stripe: "Stripe",
  gong: "Gong",
  rocketlane: "RocketLane",
  salesforce: "Salesforce",
};

export default function ComponentsTab() {
  const { draft, updateDraft } = useHealthModel();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localComp, setLocalComp] = useState<ScoreComponent | null>(null);

  if (!draft) return null;

  const activeComps = draft.components.filter((c) => c.active);
  const inactiveComps = draft.components.filter((c) => !c.active);

  const openEditor = (comp: ScoreComponent) => {
    setLocalComp({ ...comp, thresholds: comp.thresholds.map((t) => ({ ...t })) });
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
      components: d.components.map((c) => (c.id === localComp.id ? localComp : c)),
    }));
    closeEditor();
  };

  const toggleActive = (compId: string) => {
    updateDraft((d) => ({
      ...d,
      components: d.components.map((c) =>
        c.id === compId ? { ...c, active: !c.active } : c
      ),
    }));
  };

  const renderCard = (comp: ScoreComponent) => {
    const catClass = categoryColors[comp.category] ?? "bg-dark-700/50 text-dark-400 border-dark-600/50";
    return (
      <div
        key={comp.id}
        className={`glass-card-hover p-4 cursor-pointer transition-all ${!comp.active ? "opacity-50" : ""}`}
        onClick={() => openEditor(comp)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`shrink-0 w-2 h-10 rounded-full ${comp.active ? "bg-emerald-500" : "bg-dark-600"}`} />
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-100 truncate">{comp.name}</div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${catClass}`}>{comp.category}</span>
                <span className="text-[10px] text-dark-400">{sourceIcons[comp.source_system] ?? comp.source_system}</span>
                <span className="text-[10px] text-dark-500">{comp.thresholds.length} thresholds</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="text-sm font-semibold text-gray-200">{comp.sensitivity.weight}%</span>
            <button
              onClick={(e) => { e.stopPropagation(); toggleActive(comp.id); }}
              className="text-dark-400 hover:text-gray-300 transition-colors"
              title={comp.active ? "Disable" : "Enable"}
            >
              {comp.active ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5" />}
            </button>
            <ChevronRight className="w-4 h-4 text-dark-500" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">Active Components ({activeComps.length})</h3>
          <p className="text-xs text-dark-400 mt-1">Click a component to edit its configuration</p>
        </div>
        <button className="btn-secondary flex items-center gap-2 text-sm opacity-50 cursor-not-allowed" disabled>
          <Plus className="w-4 h-4" /> Add Component
        </button>
      </div>

      <div className="space-y-2">
        {activeComps.map(renderCard)}
      </div>

      {inactiveComps.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-dark-400 uppercase tracking-wide mt-8">Disabled ({inactiveComps.length})</h3>
          <div className="space-y-2">
            {inactiveComps.map(renderCard)}
          </div>
        </>
      )}

      {/* Editor Drawer */}
      <Drawer
        open={editingId !== null}
        onClose={closeEditor}
        title={localComp ? `Edit: ${localComp.name}` : "Edit Component"}
        subtitle={localComp ? `${localComp.id} · ${sourceIcons[localComp.source_system] ?? localComp.source_system}` : undefined}
        footer={
          <div className="flex justify-end gap-3">
            <button onClick={closeEditor} className="btn-secondary text-sm">Cancel</button>
            <button onClick={saveComponent} className="btn-primary text-sm">Save to Draft</button>
          </div>
        }
      >
        {localComp && (
          <div className="space-y-6">
            {/* Identity */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Identity</h4>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Name</label>
                <input className="input-dark" value={localComp.name} onChange={(e) => setLocalComp({ ...localComp, name: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">Description</label>
                <textarea className="input-dark resize-none" rows={2} value={localComp.description} onChange={(e) => setLocalComp({ ...localComp, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Category</label>
                  <input className="input-dark" value={localComp.category} onChange={(e) => setLocalComp({ ...localComp, category: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Source System</label>
                  <input className="input-dark opacity-60 cursor-not-allowed" value={localComp.source_system} readOnly />
                </div>
              </div>
            </div>

            {/* Scoring */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Scoring Method</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Method</label>
                  <select className="input-dark" value={localComp.scoring_method} onChange={(e) => setLocalComp({ ...localComp, scoring_method: e.target.value })}>
                    <option value="threshold">Threshold</option>
                    <option value="range">Range</option>
                    <option value="boolean">Boolean</option>
                    <option value="trend">Trend</option>
                    <option value="recency_decay">Recency Decay</option>
                    <option value="manual_pulse">Manual Pulse</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Directionality</label>
                  <select className="input-dark" value={localComp.sensitivity.directionality} onChange={(e) => setLocalComp({ ...localComp, sensitivity: { ...localComp.sensitivity, directionality: e.target.value as "higher_better" | "lower_better" | "deviation_bad" } })}>
                    <option value="higher_better">Higher is better</option>
                    <option value="lower_better">Lower is better</option>
                    <option value="deviation_bad">Deviation is bad</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Thresholds */}
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Thresholds</h4>
              <ThresholdEditor
                thresholds={localComp.thresholds}
                onChange={(thresholds: ComponentThreshold[]) => setLocalComp({ ...localComp, thresholds })}
              />
            </div>

            {/* Advanced */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Sensitivity</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Weight (%)</label>
                  <input type="number" className="input-dark" min={0} max={100} value={localComp.sensitivity.weight} onChange={(e) => setLocalComp({ ...localComp, sensitivity: { ...localComp.sensitivity, weight: Number(e.target.value) } })} />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Lookback (days)</label>
                  <input type="number" className="input-dark" value={localComp.sensitivity.lookback_days} onChange={(e) => setLocalComp({ ...localComp, sensitivity: { ...localComp.sensitivity, lookback_days: Number(e.target.value) } })} />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Smoothing</label>
                  <select className="input-dark" value={localComp.sensitivity.smoothing} onChange={(e) => setLocalComp({ ...localComp, sensitivity: { ...localComp.sensitivity, smoothing: e.target.value as "none" | "light" | "moderate" | "heavy" } })}>
                    <option value="none">None</option>
                    <option value="light">Light</option>
                    <option value="moderate">Moderate</option>
                    <option value="heavy">Heavy</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Volatility Cap</label>
                  <input type="number" className="input-dark" value={localComp.sensitivity.volatility_cap} onChange={(e) => setLocalComp({ ...localComp, sensitivity: { ...localComp.sensitivity, volatility_cap: Number(e.target.value) } })} />
                </div>
              </div>
            </div>

            {/* Missing data */}
            <div className="space-y-4">
              <h4 className="text-xs uppercase tracking-wider text-dark-400 font-medium">Missing Data</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Strategy</label>
                  <select className="input-dark" value={localComp.null_handling.strategy} onChange={(e) => setLocalComp({ ...localComp, null_handling: { ...localComp.null_handling, strategy: e.target.value as "assign_neutral" | "assign_penalty" | "ignore_redistribute" | "mark_low_confidence" } })}>
                    <option value="assign_neutral">Assign Neutral (50)</option>
                    <option value="assign_penalty">Assign Penalty</option>
                    <option value="ignore_redistribute">Ignore &amp; Redistribute</option>
                    <option value="mark_low_confidence">Mark Low Confidence</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">Confidence Impact</label>
                  <select className="input-dark" value={localComp.null_handling.confidence_impact} onChange={(e) => setLocalComp({ ...localComp, null_handling: { ...localComp.null_handling, confidence_impact: e.target.value as "none" | "minor" | "major" | "critical" } })}>
                    <option value="none">None</option>
                    <option value="minor">Minor (-5%)</option>
                    <option value="major">Major (-15%)</option>
                    <option value="critical">Critical (-30%)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
