import React, { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actions?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 animate-fade-in">
      <div className="p-4 rounded-2xl bg-dark-800/60 border border-dark-700/50 mb-5">
        <Icon className="w-8 h-8 text-dark-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-100 mb-2">{title}</h3>
      <p className="text-sm text-dark-400 text-center max-w-md mb-6">{description}</p>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
