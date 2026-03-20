import type { GainsightMetrics as GainsightData } from "../types";

function ProgressBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between mb-1.5">
        <span className="text-sm text-dark-300">{label}</span>
        <span className="text-sm font-semibold text-gray-200">{value}%</span>
      </div>
      <div className="w-full bg-dark-700/50 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-2.5 rounded-full ${color} transition-all duration-700 ease-out`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
    </div>
  );
}

function healthLabel(score: number) {
  if (score >= 80) return { text: "Healthy", cls: "badge-green" };
  if (score >= 60) return { text: "Needs Attention", cls: "badge-yellow" };
  return { text: "At Risk", cls: "badge-red" };
}

export default function GainsightMetricsCard({ data }: { data: GainsightData }) {
  const hl = healthLabel(data.health_score);
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="text-3xl font-bold text-gray-100">{data.health_score}</div>
        <span className={hl.cls}>
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
