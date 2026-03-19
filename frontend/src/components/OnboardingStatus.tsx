import type { OnboardingProject } from "../types";

function statusColor(status: string) {
  if (status === "On Track") return "text-green-600";
  if (status === "Completed") return "text-blue-600";
  if (status === "At Risk") return "text-yellow-600";
  return "text-red-600";
}

export default function OnboardingStatusCard({ data }: { data: OnboardingProject[] }) {
  return (
    <div className="space-y-4">
      {data.map((project) => (
        <div key={project.project_name} className="border rounded-lg p-3">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium text-sm text-gray-900">
              {project.project_name}
            </span>
            <span className={`text-xs font-semibold ${statusColor(project.status)}`}>
              {project.status}
            </span>
          </div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full bg-blue-500"
                style={{ width: `${project.percent_complete}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{project.percent_complete}%</span>
          </div>
          <div className="text-xs text-gray-400">
            Phase: {project.phase} &middot; Due: {project.due_date}
          </div>
        </div>
      ))}
    </div>
  );
}
