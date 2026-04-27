import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk, safeJsonArray } from "@/lib/utils";

export async function GET() {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }

  const jobs = await prisma.job.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      status: true,
      tags: true,
      createdAt: true,
      appliedAt: true,
      updatedAt: true,
      followUpAt: true,
    },
  });

  const events = await prisma.event.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 1000,
  });

  const counts = {
    total: jobs.length,
    saved: 0,
    applied: 0,
  } as Record<string, number>;
  for (const j of jobs) {
    counts[j.status] = (counts[j.status] ?? 0) + 1;
  }

  // Weekly activity for last 8 weeks (applied count by week, using applied event)
  const now = new Date();
  const startOfWeek = (d: Date) => {
    const x = new Date(d);
    const day = x.getDay();
    const diff = (day + 6) % 7; // Monday-start
    x.setHours(0, 0, 0, 0);
    x.setDate(x.getDate() - diff);
    return x;
  };

  const weeks: { weekStart: string; applied: number; created: number }[] = [];
  for (let i = 7; i >= 0; i--) {
    const ws = startOfWeek(new Date(now.getTime() - i * 7 * 86400000));
    weeks.push({ weekStart: ws.toISOString(), applied: 0, created: 0 });
  }
  const weekIndex = (date: Date) => {
    const ws = startOfWeek(date).getTime();
    return weeks.findIndex((w) => new Date(w.weekStart).getTime() === ws);
  };
  for (const e of events) {
    const i = weekIndex(e.createdAt);
    if (i < 0) continue;
    if (e.type === "applied") weeks[i].applied += 1;
    if (e.type === "job_created") weeks[i].created += 1;
  }

  const appliedTotal = jobs.filter((j) => j.status === "applied").length;
  const savedTotal = jobs.filter((j) => j.status === "saved").length;
  const applyRate =
    jobs.length > 0 ? Math.round((appliedTotal / jobs.length) * 100) : 0;

  // Tag breakdown
  const tagCounts: Record<string, number> = {};
  for (const j of jobs) {
    for (const t of safeJsonArray(j.tags)) {
      tagCounts[t] = (tagCounts[t] ?? 0) + 1;
    }
  }
  const tagBreakdown = Object.entries(tagCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return jsonOk({
    counts,
    weekly: weeks,
    funnel: { saved: savedTotal, applied: appliedTotal },
    applyRate,
    tagBreakdown,
  });
}
