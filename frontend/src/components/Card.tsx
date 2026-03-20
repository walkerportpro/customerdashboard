import { ReactNode } from "react";

interface CardProps {
  title: string;
  source: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
}

const sourceColors: Record<string, string> = {
  Gainsight: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Salesforce: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  Gong: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  RocketLane: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  Freshdesk: "bg-green-500/10 text-green-400 border-green-500/20",
};

export default function Card({ title, source, children, loading, error }: CardProps) {
  return (
    <div className="glass-card-hover p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wide">
          {title}
        </h3>
        <span
          className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
            sourceColors[source] || "bg-dark-700/50 text-dark-400 border-dark-600/50"
          }`}
        >
          {source}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 bg-accent-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      ) : error ? (
        <div className="text-red-400 text-sm py-4 bg-red-500/10 rounded-lg px-3 border border-red-500/20">{error}</div>
      ) : (
        children
      )}
    </div>
  );
}
