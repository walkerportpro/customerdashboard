import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { VolumeTrend } from "../types";

interface Props {
  data: VolumeTrend;
  color: string;
}

function TrendArrow({ trend, pct }: { trend: string; pct: number }) {
  if (trend === "up")
    return (
      <span className="text-emerald-400 font-semibold text-sm">
        &#9650; +{pct}%
      </span>
    );
  if (trend === "down")
    return (
      <span className="text-red-400 font-semibold text-sm">
        &#9660; {pct}%
      </span>
    );
  return <span className="text-dark-400 font-semibold text-sm">&#8594; {pct}%</span>;
}

export default function VolumeChart({ data, color }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <TrendArrow trend={data.trend} pct={data.change_pct} />
        <span className="text-xs text-dark-500">vs prior period</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data.data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            tickLine={false}
            axisLine={false}
            width={50}
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
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            fill={`url(#grad-${color})`}
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
