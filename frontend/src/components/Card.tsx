import { ReactNode } from "react";

interface CardProps {
  title: string;
  source: string;
  children: ReactNode;
  loading?: boolean;
  error?: string | null;
}

export default function Card({ title, source, children, loading, error }: CardProps) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
          {title}
        </h3>
        <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">
          {source}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-sm py-4">{error}</div>
      ) : (
        children
      )}
    </div>
  );
}
