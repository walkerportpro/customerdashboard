import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  HeartPulse,
  AlertTriangle,
  TrendingUp,
  ArrowRight,
  Activity,
  Smartphone,
  Zap,
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
import { useMockData } from "../context/MockDataContext";
import Card from "../components/Card";
import VolumeChart from "../components/VolumeChart";
import GongSentimentCard from "../components/GongSentiment";
import TicketSummaryCard from "../components/TicketSummary";
import type { Customer } from "../types";

/* ─── Stat Card ──────────────────────────────────────────── */
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

/* ─── Progress Ring ──────────────────────────────────────── */
function ProgressRing({
  value,
  label,
  icon: Icon,
  color,
  trackColor,
}: {
  value: number;
  label: string;
  icon: React.ElementType;
  color: string;
  trackColor: string;
}) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={trackColor}
            strokeWidth="6"
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold text-gray-100">{value}%</span>
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5 text-dark-400" />
        <span className="text-xs text-dark-300 font-medium">{label}</span>
      </div>
    </div>
  );
}

const HEALTH_COLORS = ["#10b981", "#f59e0b", "#ef4444"];

/* ─── Main Dashboard ─────────────────────────────────────── */
export default function DashboardPage() {
  const [apiCustomers, setApiCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const {
    customers: mockCustomers,
    isLoaded: mockLoaded,
    loadVolumes,
    invoiceVolumes,
    gainsightAggregate,
    gongAggregate,
    ticketAggregate,
  } = useMockData();

  useEffect(() => {
    apiFetch<Customer[]>("/customers")
      .then(setApiCustomers)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const customers = mockLoaded ? mockCustomers : apiCustomers;
  const showEmpty = !loading && customers.length === 0 && !mockLoaded;

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

  const barData = [...customers]
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

  const atRiskCustomers = [...customers]
    .filter((c) => c.health_score < 60)
    .sort((a, b) => a.health_score - b.health_score);

  // Sentiment distribution for Gong
  const sentimentCounts = mockLoaded
    ? {
        positive: customers.filter((c) => c.health_score >= 80).length,
        neutral: customers.filter((c) => c.health_score >= 60 && c.health_score < 80).length,
        negative: customers.filter((c) => c.health_score < 60).length,
      }
    : { positive: 0, neutral: 0, negative: 0 };

  if (loading && !mockLoaded) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-dark-400">
          <Activity className="w-5 h-5 animate-spin" />
          <span>Loading dashboard...</span>
        </div>
      </div>
    );
  }

  if (showEmpty) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-gray-100">Dashboard</h1>
          <p className="text-sm text-dark-400 mt-1">
            Overview of your customer health and key metrics
          </p>
        </div>
        <div className="glass-card p-12 text-center">
          <Users className="w-12 h-12 mx-auto mb-4 text-dark-500" />
          <h2 className="text-lg font-semibold text-gray-200 mb-2">No data yet</h2>
          <p className="text-sm text-dark-400 max-w-md mx-auto">
            Click the <span className="text-amber-400 font-medium">Load Mock Data</span> button
            in the sidebar to populate the dashboard with sample customer data.
          </p>
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
          Portfolio overview across {customers.length} customer accounts
        </p>
      </div>

      {/* ─── Stat Cards ─────────────────────────────────── */}
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

      {/* ─── Volume Trends ──────────────────────────────── */}
      {loadVolumes && invoiceVolumes && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Load Volumes" source="Salesforce">
            <VolumeChart data={loadVolumes} color="#3b82f6" />
          </Card>
          <Card title="Invoicing Volumes" source="Salesforce">
            <VolumeChart data={invoiceVolumes} color="#8b5cf6" />
          </Card>
        </div>
      )}

      {/* ─── Gainsight Product Adoption ─────────────────── */}
      {gainsightAggregate && (
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider">
              Product Adoption
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full border bg-orange-500/10 text-orange-400 border-orange-500/20">
              Gainsight
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <ProgressRing
              value={gainsightAggregate.health_score}
              label="Avg Health Score"
              icon={HeartPulse}
              color="#10b981"
              trackColor="rgba(16, 185, 129, 0.15)"
            />
            <ProgressRing
              value={Math.round(gainsightAggregate.mobile_app_usage_pct)}
              label="Mobile App Usage"
              icon={Smartphone}
              color="#3b82f6"
              trackColor="rgba(59, 130, 246, 0.15)"
            />
            <ProgressRing
              value={Math.round(gainsightAggregate.tariffs_automation_pct)}
              label="Tariffs Automation"
              icon={Zap}
              color="#8b5cf6"
              trackColor="rgba(139, 92, 246, 0.15)"
            />
          </div>
        </div>
      )}

      {/* ─── Health Distribution + Lowest Scores ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

        <div className="glass-card p-6 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-200 uppercase tracking-wider mb-4">
            Lowest Health Scores
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData} layout="vertical">
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748b" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                width={120}
              />
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

      {/* ─── Gong Sentiment + Tickets ───────────────────── */}
      {(gongAggregate || ticketAggregate) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gongAggregate && (
            <Card title="Customer Sentiment" source="Gong">
              <GongSentimentCard data={gongAggregate} />
            </Card>
          )}
          {ticketAggregate && (
            <Card title="Support Tickets" source="Freshdesk">
              <TicketSummaryCard data={ticketAggregate} />
            </Card>
          )}
        </div>
      )}

      {/* ─── At Risk Customers Table ────────────────────── */}
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
