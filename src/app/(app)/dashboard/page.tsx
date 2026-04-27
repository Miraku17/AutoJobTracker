import Link from "next/link";
import { Plus, ArrowUpRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate, relativeTime, safeJsonArray } from "@/lib/utils";
import StatusPill from "@/components/StatusPill";
import WeeklyChart from "@/components/WeeklyChart";

export const dynamic = "force-dynamic";

async function loadData() {
  const user = await requireUser();
  const [jobs, events, reminders] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
    prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.reminder.findMany({
      where: { userId: user.id, done: false },
      orderBy: { remindAt: "asc" },
      take: 5,
      include: { job: { select: { id: true, title: true, company: true } } },
    }),
  ]);

  const allJobs = await prisma.job.findMany({
    where: { userId: user.id },
    select: { id: true, status: true },
  });

  const counts = {
    total: allJobs.length,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0,
  } as Record<string, number>;
  for (const j of allJobs) counts[j.status] = (counts[j.status] ?? 0) + 1;

  const now = new Date();
  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((day + 6) % 7));
    return x;
  };
  const weeks: { weekStart: string; applied: number; created: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(new Date(now.getTime() - i * 7 * 86400000));
    weeks.push({ weekStart: ws.toISOString(), applied: 0, created: 0 });
  }
  for (const e of events) {
    const ws = startOfWeek(e.createdAt).getTime();
    const i = weeks.findIndex((w) => new Date(w.weekStart).getTime() === ws);
    if (i < 0) continue;
    if (e.type === "applied") weeks[i].applied += 1;
    if (e.type === "job_created") weeks[i].created += 1;
  }

  return { user, jobs, counts, weeks, reminders };
}

export default async function DashboardPage() {
  const { user, jobs, counts, weeks, reminders } = await loadData();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div>
      {/* Editorial masthead */}
      <div className="mb-10 animate-rise">
        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mb-3">
          <span>The Daily Standup · {today}</span>
          <span className="text-accent">№ {String(counts.total).padStart(3, "0")}</span>
        </div>
        <div className="hairline-strong border-t-0" />
        <div className="hairline mt-1" />
        <div className="hairline mt-1" />
        <div className="flex items-end justify-between mt-6 gap-6 flex-wrap">
          <h1 className="display text-[64px] md:text-[80px] leading-[0.9] text-balance max-w-3xl">
            Good to see you,
            <br />
            <span className="display-italic text-accent">
              {user.name?.split(" ")[0] || user.email.split("@")[0]}.
            </span>
          </h1>
          <Link href="/jobs?new=1" className="btn-primary">
            <Plus className="size-4" />
            Log new entry
          </Link>
        </div>
        <p className="mt-5 text-[15px] text-ink-muted max-w-xl text-pretty">
          A snapshot of the field today — applications in motion, follow-ups due, and the
          line your week is drawing.
        </p>
        <div className="hairline mt-8" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-0 border border-ink/15 rounded-sm overflow-hidden bg-paper-card animate-rise delay-1">
        <Stat label="Total" value={counts.total} />
        <Stat label="Applied" value={counts.applied} accent="applied" />
        <Stat label="Interview" value={counts.interview} accent="interview" />
        <Stat label="Offer" value={counts.offer} accent="offer" />
        <Stat label="Rejected" value={counts.rejected} accent="rejected" />
      </div>

      {/* Activity + reminders */}
      <div className="mt-10 grid lg:grid-cols-3 gap-8 animate-rise delay-2">
        <section className="lg:col-span-2">
          <SectionHead marker="01" title="Weekly cadence" hint="Last 8 weeks" />
          <div className="sheet p-5">
            <WeeklyChart data={weeks} />
            <div className="mt-3 hairline pt-3 flex items-center gap-5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
              <span className="flex items-center gap-2">
                <span className="w-3 h-px bg-status-applied" /> Saved
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-px bg-accent" /> Applied
              </span>
            </div>
          </div>
        </section>

        <aside>
          <SectionHead marker="02" title="Follow-ups" hint={`${reminders.length} due`} />
          <div className="sheet p-5 min-h-[280px]">
            {reminders.length === 0 ? (
              <div className="h-full grid place-items-center py-10">
                <div className="text-center">
                  <div className="display-italic text-2xl text-ink-muted">All clear.</div>
                  <div className="mt-2 eyebrow">No follow-ups today</div>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-ink/10">
                {reminders.map((r, i) => (
                  <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-baseline gap-3">
                      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-accent num">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium tracking-tightish truncate">
                          {r.title}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle mt-0.5 flex items-center gap-2">
                          <span>{relativeTime(r.remindAt)}</span>
                          {r.job && (
                            <>
                              <span>·</span>
                              <Link
                                href={`/jobs/${r.job.id}`}
                                className="ink-link"
                              >
                                {r.job.company}
                              </Link>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>

      {/* Recent jobs */}
      <section className="mt-12 animate-rise delay-3">
        <SectionHead
          marker="03"
          title="Recent dispatches"
          hint={
            <Link href="/jobs" className="ink-link inline-flex items-center gap-1">
              All entries <ArrowUpRight className="size-3" />
            </Link>
          }
        />
        <div className="sheet overflow-hidden">
          {jobs.length === 0 ? (
            <div className="py-16 text-center">
              <div className="display-italic text-3xl text-ink-muted">
                The page is blank.
              </div>
              <div className="mt-2 eyebrow">No entries yet</div>
              <Link href="/jobs?new=1" className="btn-primary mt-5">
                <Plus className="size-4" />
                Add your first job
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-ink/10">
              {jobs.map((j, i) => (
                <li key={j.id} className="group hover:bg-paper-deep/50 transition-colors">
                  <Link
                    href={`/jobs/${j.id}`}
                    className="grid grid-cols-12 gap-4 items-center px-5 py-4"
                  >
                    <div className="col-span-1 hidden md:block font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle num">
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div className="col-span-12 md:col-span-7 min-w-0">
                      <div className="text-[15px] font-medium tracking-tightish truncate group-hover:text-accent transition-colors">
                        {j.title}
                      </div>
                      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mt-0.5 truncate">
                        <span>{j.company}</span>
                        {safeJsonArray(j.tags).length > 0 && (
                          <span className="ml-3 text-ink-subtle">
                            {safeJsonArray(j.tags)
                              .slice(0, 3)
                              .map((t) => `· ${t}`)
                              .join(" ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="col-span-6 md:col-span-2">
                      <StatusPill status={j.status} />
                    </div>
                    <div className="col-span-6 md:col-span-2 text-right font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle num">
                      {formatDate(j.appliedAt ?? j.updatedAt)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "applied" | "interview" | "offer" | "rejected";
}) {
  const accentColor =
    accent === "applied"
      ? "#1f3a66"
      : accent === "interview"
      ? "#c4341a"
      : accent === "offer"
      ? "#1f4d3a"
      : accent === "rejected"
      ? "#7a3a2a"
      : undefined;
  return (
    <div className="px-5 py-5 border-r border-ink/10 last:border-r-0 relative overflow-hidden group">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        {label}
      </div>
      <div
        className="display num text-5xl mt-3 transition-colors"
        style={accentColor ? { color: accentColor } : undefined}
      >
        {String(value).padStart(2, "0")}
      </div>
      {accent && (
        <div
          className="absolute bottom-0 left-0 h-0.5 w-full origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"
          style={{ background: accentColor }}
        />
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
