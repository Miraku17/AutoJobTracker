"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import WeeklyChart from "@/components/WeeklyChart";

const STATUS_COLORS: Record<string, string> = {
  saved: "#3b3a32",
  applied: "#1f3a66",
  interview: "#c4341a",
  offer: "#1f4d3a",
  rejected: "#7a3a2a",
  ghosted: "#8a6a3a",
};

const TOOLTIP = {
  background: "#fbf6e8",
  border: "1px solid #16140e",
  borderRadius: 2,
  fontSize: 11,
  fontFamily: "var(--font-mono)",
  color: "#16140e",
  boxShadow: "0 8px 24px -12px rgba(22,20,14,0.4)",
};

export default function AnalyticsClient({
  counts,
  weeks,
  funnel,
  responseRate,
  offerRate,
  tagBreakdown,
}: {
  counts: Record<string, number>;
  weeks: { weekStart: string; applied: number; created: number }[];
  funnel: { applied: number; interview: number; offer: number };
  responseRate: number;
  offerRate: number;
  tagBreakdown: { name: string; count: number }[];
}) {
  const pieData = ["saved", "applied", "interview", "offer", "rejected", "ghosted"]
    .map((k) => ({ name: k, value: counts[k] ?? 0 }))
    .filter((d) => d.value > 0);

  const funnelData = [
    { stage: "Applied", count: funnel.applied, fill: "#1f3a66" },
    { stage: "Interview", count: funnel.interview, fill: "#c4341a" },
    { stage: "Offer", count: funnel.offer, fill: "#1f4d3a" },
  ];

  return (
    <div className="space-y-10">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 border border-ink/15 rounded-sm overflow-hidden bg-paper-card animate-rise">
        <KPI label="Total jobs" value={counts.total} />
        <KPI label="Applied" value={funnel.applied} hint={`${counts.applied ?? 0} active`} />
        <KPI label="Response rate" value={`${responseRate}%`} hint="interview / applied" accent />
        <KPI label="Offer rate" value={`${offerRate}%`} hint="offer / applied" />
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
            {pieData.length === 0 ? (
              <Empty />
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={64}
                      outerRadius={96}
                      paddingAngle={2}
                      stroke="#fbf6e8"
                      strokeWidth={2}
                    >
                      {pieData.map((entry) => (
                        <Cell
                          key={entry.name}
                          fill={STATUS_COLORS[entry.name] || "#3b3a32"}
                        />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={TOOLTIP} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
            <div className="mt-4 hairline pt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px] uppercase tracking-eyebrow">
              {Object.entries(STATUS_COLORS).map(([k, c]) => (
                <div key={k} className="flex items-center gap-2 text-ink-muted">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ background: c }}
                  />
                  {k}
                  <span className="ml-auto num text-ink">
                    {String(counts[k] ?? 0).padStart(2, "0")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <SectionHead marker="03" title="Conversion funnel" />
          <div className="sheet p-5">
            {funnel.applied === 0 ? (
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
                      stroke="#5b554a"
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
                      stroke="#8a8270"
                      fontSize={10}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                      width={28}
                      style={{ fontFamily: "var(--font-mono)" }}
                    />
                    <Tooltip cursor={{ fill: "rgba(22,20,14,0.06)" }} contentStyle={TOOLTIP} />
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

      <section className="animate-rise delay-3">
        <SectionHead marker="04" title="Top tags" />
        <div className="sheet p-5">
          {tagBreakdown.length === 0 ? (
            <Empty />
          ) : (
            <ul className="space-y-3">
              {tagBreakdown.map((t, i) => {
                const max = tagBreakdown[0]?.count || 1;
                const pct = Math.round((t.count / max) * 100);
                return (
                  <li key={t.name}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
                        <span className="text-accent num">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        #{t.name}
                      </span>
                      <span className="num font-mono text-[10px] uppercase tracking-eyebrow text-ink">
                        {String(t.count).padStart(2, "0")}
                      </span>
                    </div>
                    <div className="h-1.5 bg-paper-deep border border-ink/10 overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
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
        style={accent ? { color: "#c4341a" } : undefined}
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
