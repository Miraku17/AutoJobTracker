import PageHeader from "@/components/PageHeader";
import AnalyticsClient from "./AnalyticsClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalyticsPage() {
  const user = await requireUser();
  const [jobs, events] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      select: { id: true, status: true, tags: true, createdAt: true, appliedAt: true },
    }),
    prisma.event.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 1000,
    }),
  ]);

  const counts = {
    total: jobs.length,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    ghosted: 0,
  } as Record<string, number>;
  for (const j of jobs) counts[j.status] = (counts[j.status] ?? 0) + 1;

  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - ((day + 6) % 7));
    return x;
  };
  const now = new Date();
  const weeks: { weekStart: string; applied: number; created: number }[] = [];
  for (let i = 11; i >= 0; i--) {
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

  const appliedTotal = jobs.filter((j) =>
    ["applied", "interview", "offer", "rejected", "ghosted"].includes(j.status)
  ).length;
  const interviewTotal = jobs.filter((j) =>
    ["interview", "offer"].includes(j.status)
  ).length;
  const offerTotal = jobs.filter((j) => j.status === "offer").length;
  const responseRate =
    appliedTotal > 0 ? Math.round((interviewTotal / appliedTotal) * 100) : 0;
  const offerRate =
    appliedTotal > 0 ? Math.round((offerTotal / appliedTotal) * 100) : 0;

  const tagCounts: Record<string, number> = {};
  for (const j of jobs)
    for (const t of safeJsonArray(j.tags))
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
  const tagBreakdown = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return (
    <div>
      <PageHeader
        marker="03"
        title="The numbers, in ink."
        description="Read your hunt as a series — what's moving, what's stalling, where the line bends."
      />
      <AnalyticsClient
        counts={counts}
        weeks={weeks}
        funnel={{ applied: appliedTotal, interview: interviewTotal, offer: offerTotal }}
        responseRate={responseRate}
        offerRate={offerRate}
        tagBreakdown={tagBreakdown}
      />
    </div>
  );
}
