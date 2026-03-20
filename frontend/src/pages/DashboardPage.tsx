import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  HeartPulse,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Activity,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { apiFetch } from "../api/client";
import type { Customer } from "../types";

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext: string;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    accent: "from-accent-500/20 to-accent-500/5 border-accent-500/20 text-accent-400",
    emerald: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20 text-emerald-400",
    amber: "from-amber-500/20 to-amber-500/5 border-amber-500/20 text-amber-400",
    rose: "from-rose-500/20 to-rose-500/5 border-rose-500/20 text-rose-400",
  };
  const classes = colorMap[color] || colorMap.accent;

  return (
    <div className={`stat-card bg-gradient-to-br ${classes}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-dark-300 uppercase tracking-wider">
          {label}
        </span>
        <Icon className="w-4 h-4 opacity-60" />
      </div>
      <div className="text-3xl font-bold text-gray-100">{value}</div>
      <p className="text-xs text-dark-400 mt-1">{subtext}</p>
    </div>
  );
}

const HEALTH_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<Customer[]>("/customers")
      .then(setCustomers)
      .finally(() => setLoading(false));
  }, []);

  const healthy = customers.filter((c) => c.health_score >= 80).length;
  const attention = customers.filter(
    (c) => c.health_score >= 60 && c.health_score < 80
  ).length;
  const atRisk = customers.filter((c) => c.health_score < 60).length;
  const avgHealth =
    customers.length > 0
      ? Math.round(
          customers.reduce((s, c) => s + c.health_score, 0) / customers.length
        )
      : 0;

  const healthDistribution = [
    { name: "Healthy", value: healthy, color: "#10b981" },
    { name: "Attention", value: attention, color: "#f59e0b" },
    { name: "At Risk", value: atRisk, color: "#ef4444" },
  ];

  const barData = customers
    .sort((a, b) => a.health_score - b.health_score)
    .slice(0, 10)
    .map((c) => ({
      name: c.name.length > 15 ? c.name.slice(0, 15) + "..." : c.name,
      score: c.health_score,
      fill:
        c.health_score >= 80
          ? "#10b981"
          : c.health_score >= 60
          ? "#f59e0b"
          : "#ef4444",
    }));

  const atRiskCustomers = customers
    .filter((c) => c.health_score < 60)
    .sort((a, b) => a.health_score - b.health_score);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-dark-400">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
        <p className="text-sm text-dark-400 mt-1">
          Overview of your customer health and key metrics
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          icon={Users}
          label="Total Customers"
          value={customers.length}
          subtext="Active accounts"
          color="accent"
        />
        <StatCard
          icon={HeartPulse}
          label="Avg Health Score"
          value={avgHealth}
          subtext={`${healthy} healthy accounts`}
          color="emerald"
        />
        <StatCard
          icon={AlertTriangle}
          label="At Risk"
          value={atRisk}
          subtext="Needs immediate attention"
          color="rose"
        />
        <StatCard
          icon={TrendingUp}
          label="Needs Attention"
          value={attention}
          subtext="Monitoring closely"
          color="amber"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Distribution Pie */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
            Health Distribution
          </h3>
          <div className="flex items-center gap-6">
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={healthDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={65}
                  paddingAngle={3}
                  dataKey="value"
                  stroke="none"
                >
                  {healthDistribution.map((entry, i) => (
                    <Cell key={i} fill={HEALTH_COLORS[i]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-3">
              {healthDistribution.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-dark-300">{item.name}</span>
                  <span className="text-sm font-semibold text-gray-200 ml-auto">
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom 10 Health Scores Bar Chart */}
        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
            Lowest Health Scores
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11, fill: "#64748b" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} axisLine={false} tickLine={false} width={120} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                  color: "#f1f5f9",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={14}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* At Risk Customers Table */}
      {atRiskCustomers.length > 0 && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              At Risk Customers
            </h3>
            <Link
              to="/customers"
              className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 transition-colors"
            >
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-dark-700/50">
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider pb-3 pr-4">
                    Customer
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider pb-3 pr-4">
                    Industry
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider pb-3 pr-4">
                    Health
                  </th>
                  <th className="text-left text-xs font-medium text-dark-400 uppercase tracking-wider pb-3">
                    Manager
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/30">
                {atRiskCustomers.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-dark-800/40 transition-colors"
                  >
                    <td className="py-3 pr-4">
                      <Link
                        to={`/customers/${c.id}`}
                        className="text-sm font-medium text-accent-400 hover:text-accent-300 transition-colors"
                      >
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-sm text-dark-300">
                      {c.industry}
                    </td>
                    <td className="py-3 pr-4">
                      <span className="badge-red">{c.health_score}</span>
                    </td>
                    <td className="py-3 text-sm text-dark-300">
                      {c.account_manager}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
