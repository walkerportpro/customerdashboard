import { useState } from "react";
import { Activity } from "lucide-react";
import { useHealthModel } from "../context/HealthModelContext";
import TabNavigation from "../components/health-model/TabNavigation";
import StickyActionBar from "../components/health-model/StickyActionBar";
import PublishModal from "../components/health-model/PublishModal";
import OverviewTab from "./health-model/OverviewTab";
import ComponentsTab from "./health-model/ComponentsTab";
import WeightsTab from "./health-model/WeightsTab";
import ThresholdsTab from "./health-model/ThresholdsTab";
import SegmentsTab from "./health-model/SegmentsTab";
import ExceptionsTab from "./health-model/ExceptionsTab";
import MissingDataTab from "./health-model/MissingDataTab";
import PreviewTab from "./health-model/PreviewTab";
import VersionHistoryTab from "./health-model/VersionHistoryTab";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "components", label: "Components" },
  { id: "weights", label: "Weights" },
  { id: "thresholds", label: "Thresholds" },
  { id: "segments", label: "Segments" },
  { id: "exceptions", label: "Exceptions" },
  { id: "missing-data", label: "Missing Data" },
  { id: "preview", label: "Preview" },
  { id: "history", label: "Version History" },
];

export default function HealthModelPage() {
  const {
    draft,
    published,
    loading,
    saving,
    hasChanges,
    changeSummary,
    validationErrors,
    validationWarnings,
    lastSimulation,
    saveDraft,
    discardDraft,
    publishDraft,
  } = useHealthModel();

  const [activeTab, setActiveTab] = useState("overview");
  const [showPublish, setShowPublish] = useState(false);

  const model = draft ?? published;

  if (loading && !model) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center gap-3">
          <Activity className="w-6 h-6 text-accent-400 animate-pulse" />
          <h1 className="text-2xl font-bold text-gray-100">Health Model</h1>
        </div>
        <div className="glass-card p-12 text-center">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-dark-700/50 rounded w-48 mx-auto" />
            <div className="h-4 bg-dark-700/50 rounded w-64 mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  if (!model) return null;

  const handlePublish = async (note: string) => {
    await publishDraft(note);
    setShowPublish(false);
  };

  const renderTab = () => {
    switch (activeTab) {
      case "overview": return <OverviewTab onTabChange={setActiveTab} />;
      case "components": return <ComponentsTab />;
      case "weights": return <WeightsTab />;
      case "thresholds": return <ThresholdsTab />;
      case "segments": return <SegmentsTab />;
      case "exceptions": return <ExceptionsTab />;
      case "missing-data": return <MissingDataTab />;
      case "preview": return <PreviewTab />;
      case "history": return <VersionHistoryTab />;
      default: return <OverviewTab onTabChange={setActiveTab} />;
    }
  };

  return (
    <div className="space-y-0 animate-fade-in pb-20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-6 h-6 text-accent-400" />
            <div>
              <h1 className="text-2xl font-bold text-gray-100">Health Model</h1>
              <p className="text-sm text-dark-400 mt-0.5">
                v{model.version} &middot; {model.published_at ? `Published ${new Date(model.published_at).toLocaleDateString()}` : "Not published"} &middot; {model.published_by || "No author"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {hasChanges ? (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                Draft
              </span>
            ) : (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Published
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <TabNavigation tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />

      {/* Tab content */}
      {renderTab()}

      {/* Sticky action bar */}
      <StickyActionBar
        hasChanges={hasChanges}
        changeCount={changeSummary.length}
        onSave={saveDraft}
        onDiscard={discardDraft}
        onPreview={() => setActiveTab("preview")}
        onPublish={() => setShowPublish(true)}
        saving={saving}
        publishDisabled={validationErrors.length > 0}
      />

      {/* Publish modal */}
      <PublishModal
        open={showPublish}
        onClose={() => setShowPublish(false)}
        onPublish={handlePublish}
        changeSummary={changeSummary}
        validationErrors={validationErrors}
        validationWarnings={validationWarnings}
        simulationSummary={lastSimulation}
        currentVersion={model.version}
      />
    </div>
  );
}
