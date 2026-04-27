import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk, hashUrl, isStatus, safeJsonArray } from "@/lib/utils";
import { autoTags } from "@/lib/scraper";

const createSchema = z.object({
  title: z.string().min(1).max(300),
  company: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("")),
  description: z.string().max(20000).optional(),
  notes: z.string().max(20000).optional(),
  salary: z.string().max(100).optional(),
  location: z.string().max(200).optional(),
  source: z.string().max(100).optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  appliedAt: z.string().datetime().optional().nullable(),
  followUpAt: z.string().datetime().optional().nullable(),
});

export async function GET(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }

  const { searchParams } = req.nextUrl;
  const q = searchParams.get("q")?.trim() || "";
  const status = searchParams.get("status")?.trim() || "";
  const tag = searchParams.get("tag")?.trim() || "";

  const where: Record<string, unknown> = { userId: user.id };
  if (status && isStatus(status)) where.status = status;
  if (q) {
    where.OR = [
      { title: { contains: q } },
      { company: { contains: q } },
      { notes: { contains: q } },
    ];
  }

  let jobs = await prisma.job.findMany({
    where,
    orderBy: [{ updatedAt: "desc" }],
    take: 500,
  });

  if (tag) {
    jobs = jobs.filter((j) => safeJsonArray(j.tags).includes(tag));
  }

  return jsonOk({
    jobs: jobs.map((j) => ({ ...j, tags: safeJsonArray(j.tags) })),
  });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }

  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, { issues: parsed.error.flatten() });

  const data = parsed.data;
  const url = data.url || null;

  // Duplicate detection by URL hash within the user's jobs
  if (url) {
    const h = hashUrl(url);
    const dupe = await prisma.job.findFirst({
      where: { userId: user.id, urlHash: h },
    });
    if (dupe) return jsonError("Duplicate job (already saved)", 409, { existingId: dupe.id });
  }

  // Merge user-supplied tags + auto-tags
  const userTags = data.tags ?? [];
  const auto = autoTags(`${data.title} ${data.description ?? ""}`);
  const tagSet = Array.from(new Set([...userTags, ...auto]));

  const status = isStatus(data.status ?? "") ? (data.status as string) : "saved";
  let appliedAt: Date | null = data.appliedAt ? new Date(data.appliedAt) : null;
  if (status === "applied" && !appliedAt) appliedAt = new Date();
  let followUpAt: Date | null = data.followUpAt ? new Date(data.followUpAt) : null;
  if (status === "applied" && !followUpAt) {
    const d = new Date();
    d.setDate(d.getDate() + 4);
    followUpAt = d;
  }

  const job = await prisma.job.create({
    data: {
      userId: user.id,
      title: data.title,
      company: data.company,
      url,
      description: data.description ?? null,
      notes: data.notes ?? null,
      salary: data.salary ?? null,
      location: data.location ?? null,
      source: data.source ?? null,
      status,
      tags: JSON.stringify(tagSet),
      appliedAt,
      followUpAt,
      urlHash: url ? hashUrl(url) : null,
    },
  });

  await prisma.event.create({
    data: { userId: user.id, jobId: job.id, type: "job_created" },
  });
  if (status === "applied") {
    await prisma.event.create({
      data: { userId: user.id, jobId: job.id, type: "applied" },
    });
  }

  return jsonOk({ job: { ...job, tags: tagSet } });
}
