import type { GainsightMetrics as GainsightData } from "../types";

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1">
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-semibold text-gray-900">{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className={`h-2.5 rounded-full ${color}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function healthLabel(score: number) {
  if (score >= 80) return { text: "Healthy", cls: "text-green-600 bg-green-50" };
  if (score >= 60) return { text: "Needs Attention", cls: "text-yellow-600 bg-yellow-50" };
  return { text: "At Risk", cls: "text-red-600 bg-red-50" };
}

export default function GainsightMetricsCard({ data }: { data: GainsightData }) {
  const hl = healthLabel(data.health_score);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-gray-900">{data.health_score}</div>
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${hl.cls}`}>
          {hl.text}
        </span>
      </div>
      <ProgressBar
        label="Mobile App Usage"
        value={data.mobile_app_usage_pct}
        color="bg-blue-500"
      />
      <ProgressBar
        label="Tariffs Automation"
        value={data.tariffs_automation_pct}
        color="bg-purple-500"
      />
    </div>
  );
}
