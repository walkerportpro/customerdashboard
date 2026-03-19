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
      <span className="text-green-600 font-semibold text-sm">
        &#9650; +{pct}%
      </span>
    );
  if (trend === "down")
    return (
      <span className="text-red-600 font-semibold text-sm">
        &#9660; {pct}%
      </span>
    );
  return <span className="text-gray-500 font-semibold text-sm">&#8594; {pct}%</span>;
}

export default function VolumeChart({ data, color }: Props) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-3">
        <TrendArrow trend={data.trend} pct={data.change_pct} />
        <span className="text-xs text-gray-400">vs prior period</span>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data.data}>
          <defs>
            <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={50}
          />
          <Tooltip />
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
