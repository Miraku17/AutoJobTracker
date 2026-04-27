import { NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { jsonError, jsonOk, isStatus, safeJsonArray, hashUrl } from "@/lib/utils";

const updateSchema = z.object({
  title: z.string().min(1).max(300).optional(),
  company: z.string().min(1).max(200).optional(),
  url: z.string().url().nullable().optional(),
  description: z.string().max(20000).nullable().optional(),
  notes: z.string().max(20000).nullable().optional(),
  salary: z.string().max(100).nullable().optional(),
  location: z.string().max(200).nullable().optional(),
  status: z.string().optional(),
  tags: z.array(z.string()).optional(),
  appliedAt: z.string().datetime().nullable().optional(),
  followUpAt: z.string().datetime().nullable().optional(),
});

async function loadJob(id: string, userId: string) {
  return prisma.job.findFirst({ where: { id, userId } });
}

export async function GET(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const job = await loadJob(id, user.id);
  if (!job) return jsonError("Not found", 404);
  return jsonOk({ job: { ...job, tags: safeJsonArray(job.tags) } });
}

export async function PATCH(req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const existing = await loadJob(id, user.id);
  if (!existing) return jsonError("Not found", 404);

  const body = await req.json().catch(() => null);
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400, { issues: parsed.error.flatten() });
  const d = parsed.data;

  const data: Record<string, unknown> = {};
  if (d.title !== undefined) data.title = d.title;
  if (d.company !== undefined) data.company = d.company;
  if (d.url !== undefined) {
    data.url = d.url;
    data.urlHash = d.url ? hashUrl(d.url) : null;
  }
  if (d.description !== undefined) data.description = d.description;
  if (d.notes !== undefined) data.notes = d.notes;
  if (d.salary !== undefined) data.salary = d.salary;
  if (d.location !== undefined) data.location = d.location;
  if (d.tags !== undefined) data.tags = JSON.stringify(d.tags);
  if (d.appliedAt !== undefined) data.appliedAt = d.appliedAt ? new Date(d.appliedAt) : null;
  if (d.followUpAt !== undefined) data.followUpAt = d.followUpAt ? new Date(d.followUpAt) : null;

  let statusChanged: string | null = null;
  if (d.status !== undefined && isStatus(d.status) && d.status !== existing.status) {
    data.status = d.status;
    statusChanged = d.status;
    // Auto-set appliedAt when moving to applied
    if (d.status === "applied" && !existing.appliedAt && d.appliedAt === undefined) {
      data.appliedAt = new Date();
    }
    // Suggest follow-up 4 days out if not set
    if (d.status === "applied" && !existing.followUpAt && d.followUpAt === undefined) {
      const f = new Date();
      f.setDate(f.getDate() + 4);
      data.followUpAt = f;
    }
  }

  const job = await prisma.job.update({ where: { id }, data });

  if (statusChanged) {
    await prisma.event.create({
      data: { userId: user.id, jobId: job.id, type: "status_changed", payload: JSON.stringify({ from: existing.status, to: statusChanged }) },
    });
    if (["applied", "interview", "offer", "rejected"].includes(statusChanged)) {
      await prisma.event.create({
        data: { userId: user.id, jobId: job.id, type: statusChanged },
      });
    }
  }

  return jsonOk({ job: { ...job, tags: safeJsonArray(job.tags) } });
}

export async function DELETE(_req: NextRequest, ctx: { params: { id: string } }) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const { id } = ctx.params;
  const existing = await loadJob(id, user.id);
  if (!existing) return jsonError("Not found", 404);
  await prisma.job.delete({ where: { id } });
  return jsonOk({ ok: true });
}
