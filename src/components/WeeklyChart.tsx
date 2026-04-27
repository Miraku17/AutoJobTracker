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
              <stop offset="0%" stopColor="#5b9dff" stopOpacity={0.45} />
              <stop offset="100%" stopColor="#5b9dff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="g-created" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9aa8c2" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#9aa8c2" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(245,247,250,0.10)" vertical={false} />
          <XAxis
            dataKey="label"
            stroke="#6b7a96"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}
          />
          <YAxis
            stroke="#6b7a96"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={28}
            style={{ fontFamily: "var(--font-mono)" }}
          />
          <Tooltip
            cursor={{ stroke: "rgba(245,247,250,0.35)", strokeDasharray: "2 4" }}
            contentStyle={{
              background: "#0f1f3a",
              border: "1px solid rgba(245,247,250,0.35)",
              borderRadius: 2,
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "#f5f7fa",
              boxShadow: "0 8px 24px -12px rgba(0,0,0,0.6)",
            }}
            labelStyle={{
              color: "#f5f7fa",
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontSize: 10,
            }}
          />
          <Area
            type="monotone"
            dataKey="created"
            name="Saved"
            stroke="#9aa8c2"
            strokeWidth={1.5}
            fill="url(#g-created)"
          />
          <Area
            type="monotone"
            dataKey="applied"
            name="Applied"
            stroke="#5b9dff"
            strokeWidth={2}
            fill="url(#g-applied)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
