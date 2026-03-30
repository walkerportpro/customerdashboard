import { Activity } from "lucide-react";

export default function HealthModelPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Health Model</h1>
        <p className="text-sm text-dark-400 mt-1">
          Configure scoring components, weights, thresholds, segments, and exception rules
        </p>
      </div>
      <div className="glass-card p-12 text-center">
        <Activity className="w-12 h-12 mx-auto mb-4 text-dark-500" />
        <h2 className="text-lg font-semibold text-gray-200 mb-2">Coming Soon</h2>
        <p className="text-sm text-dark-400 max-w-md mx-auto">
          The Health Model configuration UI is being built. The backend scoring engine,
          API endpoints, and data model are ready.
        </p>
      </div>
    </div>
  );
}
