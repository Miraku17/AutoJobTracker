"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Week = { weekStart: string; applied: number; created: number };

export default function WeeklyChart({ data }: { data: Week[] }) {
  const fmt = data.map((w) => ({
    ...w,
    label: new Date(w.weekStart).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={fmt} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="g-applied" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c4341a" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#c4341a" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1f3a66" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#1f3a66" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(22,20,14,0.10)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#8a8270"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          />
          <YAxis
            stroke="#8a8270"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(22,20,14,0.4)", strokeDasharray: "2 4" }}
            contentStyle={{
              background: "#fbf6e8",
              border: "1px solid #16140e",
              borderRadius: 2,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "#16140e",
              boxShadow: "0 8px 24px -12px rgba(22,20,14,0.4)",
            }}
            labelStyle={{
              color: "#16140e",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Saved"
            stroke="#1f3a66"
            strokeWidth={1.5}
            fill="url(#g-created)"
          />
          <Area
            type="monotone"
            dataKey="applied"
            name="Applied"
            stroke="#c4341a"
            strokeWidth={2}
            fill="url(#g-applied)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
