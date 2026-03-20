import type { OnboardingProject } from "../types";

function statusColor(status: string) {
  if (status === "On Track") return "text-emerald-400";
  if (status === "Completed") return "text-blue-400";
  if (status === "At Risk") return "text-amber-400";
  return "text-red-400";
}

export default function OnboardingStatusCard({ data }: { data: OnboardingProject[] }) {
  return (
    <div className="space-y-4">
      {data.map((project) => (
        <div key={project.project_name} className="border border-dark-700/50 rounded-lg p-3 bg-dark-800/30">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm text-gray-200">
              {project.project_name}
            </span>
            <span className={`text-xs font-semibold ${statusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-dark-700/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-2 rounded-full bg-accent-500 transition-all duration-700"
                style={{ width: `${project.percent_complete}%` }}
              />
            </div>
            <span className="text-xs text-dark-400">{project.percent_complete}%</span>
          </div>
          <div className="text-xs text-dark-500">
            Phase: {project.phase} &middot; Due: {project.due_date}
          </div>
        </div>
      ))}
    </div>
  );
}
