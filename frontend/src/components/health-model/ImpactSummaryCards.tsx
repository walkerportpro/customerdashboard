import React from "react";
import { Users, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ImpactSummaryCardsProps {
  totalCustomers: number;
  avgDelta: number;
  regressions: number;
  improvements: number;
  warnings: number;
}

export default function ImpactSummaryCards({
  totalCustomers,
  avgDelta,
  regressions,
  improvements,
  warnings,
}: ImpactSummaryCardsProps) {
  const cards = [
    {
      label: "Total Customers",
      value: totalCustomers.toLocaleString(),
      icon: Users,
      color: "text-gray-100",
      iconColor: "text-accent-400",
      bgColor: "bg-accent-500/10",
    },
    {
      label: "Avg Score Delta",
      value: `${avgDelta >= 0 ? "+" : ""}${avgDelta.toFixed(1)}`,
      icon: avgDelta >= 0 ? TrendingUp : TrendingDown,
      color: avgDelta >= 0 ? "text-emerald-400" : "text-red-400",
      iconColor: avgDelta >= 0 ? "text-emerald-400" : "text-red-400",
      bgColor: avgDelta >= 0 ? "bg-emerald-500/10" : "bg-red-500/10",
    },
    {
      label: "Regressions",
      value: regressions.toLocaleString(),
      icon: TrendingDown,
      color: regressions > 0 ? "text-red-400" : "text-gray-100",
      iconColor: "text-red-400",
      bgColor: "bg-red-500/10",
    },
    {
      label: "Improvements",
      value: improvements.toLocaleString(),
      icon: TrendingUp,
      color: improvements > 0 ? "text-emerald-400" : "text-gray-100",
      iconColor: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-dark-800/60 border border-dark-700/50 rounded-xl p-5 animate-fade-in"
        >
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg ${card.bgColor}`}>
              <card.icon className={`w-4 h-4 ${card.iconColor}`} />
            </div>
            {card.label === "Regressions" && warnings > 0 && (
              <div className="flex items-center gap-1 text-amber-400">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span className="text-xs font-medium">{warnings}</span>
              </div>
            )}
          </div>
          <div className={`text-2xl font-bold ${card.color}`}>{card.value}</div>
          <div className="text-xs text-dark-400 mt-1">{card.label}</div>
        </div>
      ))}
    </div>
  );
}
