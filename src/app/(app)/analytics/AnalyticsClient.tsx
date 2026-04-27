"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import WeeklyChart from "@/components/WeeklyChart";

const STATUS_COLORS: Record<string, string> = {
  saved: "#9aa8c2",
  applied: "#5b9dff",
};

const TOOLTIP = {
  background: "#0f1f3a",
  border: "1px solid rgba(245,247,250,0.35)",
  borderRadius: 2,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "#f5f7fa",
  boxShadow: "0 8px 24px -12px rgba(0,0,0,0.6)",
};

export default function AnalyticsClient({
  counts,
  weeks,
  funnel,
  applyRate,
}: {
  counts: Record<string, number>;
  weeks: { weekStart: string; applied: number; created: number }[];
  funnel: { saved: number; applied: number };
  applyRate: number;
}) {
  const breakdown = [
    { name: "saved", value: counts.saved ?? 0 },
    { name: "applied", value: counts.applied ?? 0 },
  ];
  const breakdownTotal = breakdown.reduce((s, b) => s + b.value, 0);

  const funnelData = [
    { stage: "Saved", count: funnel.saved, fill: "#9aa8c2" },
    { stage: "Applied", count: funnel.applied, fill: "#5b9dff" },
  ];

  return (
    <div className="space-y-10">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-ink/15 rounded-sm overflow-hidden bg-paper-card animate-rise">
        <KPI label="Total jobs" value={counts.total} />
        <KPI label="Saved" value={counts.saved ?? 0} />
        <KPI label="Applied" value={counts.applied ?? 0} />
        <KPI
          label="Apply rate"
          value={`${applyRate}%`}
          hint="applied / total"
          accent
        />
      </div>

      <section className="animate-rise delay-1">
        <SectionHead marker="01" title="Activity" hint="Last 12 weeks" />
        <div className="sheet p-5">
          <WeeklyChart data={weeks} />
        </div>
      </section>

      <div className="grid lg:grid-cols-2 gap-8 animate-rise delay-2">
        <section>
          <SectionHead marker="02" title="Status breakdown" />
          <div className="sheet p-5">
            {breakdownTotal === 0 ? (
              <Empty />
            ) : (
              <ul className="space-y-4 py-2">
                {breakdown.map((b) => {
                  const pct =
                    breakdownTotal > 0
                      ? Math.round((b.value / breakdownTotal) * 100)
                      : 0;
                  return (
                    <li key={b.name}>
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
                          <span
                            className="size-2.5 rounded-full"
                            style={{ background: STATUS_COLORS[b.name] }}
                          />
                          {b.name}
                        </span>
                        <span className="num font-mono text-[10px] uppercase tracking-eyebrow text-ink">
                          {String(b.value).padStart(2, "0")} · {pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-paper-deep border border-ink/10 overflow-hidden">
                        <div
                          className="h-full"
                          style={{
                            width: `${pct}%`,
                            background: STATUS_COLORS[b.name],
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section>
          <SectionHead marker="03" title="Saved → Applied" />
          <div className="sheet p-5">
            {funnel.saved === 0 && funnel.applied === 0 ? (
              <Empty />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={funnelData}
                    margin={{ top: 12, right: 8, left: -12, bottom: 0 }}
                  >
                    <CartesianGrid stroke="rgba(22,20,14,0.10)" vertical={false} />
                    <XAxis
                      dataKey="stage"
                      stroke="#9aa8c2"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      style={{
                        fontFamily: "var(--font-mono)",
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                      }}
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
                    <Tooltip cursor={{ fill: "rgba(245,247,250,0.06)" }} contentStyle={TOOLTIP} />
                    <Bar dataKey="count" radius={[2, 2, 0, 0]}>
                      {funnelData.map((d) => (
                        <Cell key={d.stage} fill={d.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>
      </div>

    </div>
  );
}

function KPI({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div className="px-5 py-5 border-r border-ink/10 last:border-r-0">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        {label}
      </div>
      <div
        className="display num text-5xl mt-3"
        style={accent ? { color: "#5b9dff" } : undefined}
      >
        {value}
      </div>
      {hint && (
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle mt-2">
          {hint}
        </div>
      )}
    </div>
  );
}

function SectionHead({
  marker,
  title,
  hint,
}: {
  marker: string;
  title: string;
  hint?: React.ReactNode;
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <div className="section-marker">§ {marker}</div>
        <h2 className="display text-2xl mt-1">{title}</h2>
      </div>
      {hint && (
        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
          {hint}
        </div>
      )}
    </div>
  );
}

function Empty() {
  return (
    <div className="h-40 grid place-items-center text-center">
      <div>
        <div className="display-italic text-2xl text-ink-muted">No data yet.</div>
        <div className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
          Add a few jobs to see this come alive
        </div>
      </div>
    </div>
  );
}
