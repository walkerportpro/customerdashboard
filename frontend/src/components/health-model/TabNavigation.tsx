import React from "react";

interface Tab {
  id: string;
  label: string;
}

interface TabNavigationProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
}

export default function TabNavigation({ tabs, activeTab, onChange }: TabNavigationProps) {
  return (
    <div className="flex gap-1 border-b border-dark-700/50 mb-6 overflow-x-auto">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative ${
              isActive
                ? "border-b-2 border-accent-500 text-accent-400"
                : "text-dark-400 hover:text-gray-300"
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
