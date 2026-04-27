import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  title: z.string().min(1).max(300),
  remindAt: z.string().datetime(),
  jobId: z.string().optional().nullable(),
  notify: z.boolean().optional(),
});

export async function GET() {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const reminders = await prisma.reminder.findMany({
    where: { userId: user.id },
    orderBy: [{ done: "asc" }, { remindAt: "asc" }],
    include: { job: { select: { id: true, title: true, company: true, status: true } } },
  });
  return jsonOk({ reminders });
}

export async function POST(req: NextRequest) {
  let user;
  try { user = await requireUser(); } catch { return jsonError("Unauthorized", 401); }
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  if (parsed.data.jobId) {
    const job = await prisma.job.findFirst({
      where: { id: parsed.data.jobId, userId: user.id },
    });
    if (!job) return jsonError("Job not found", 404);
  }

  const r = await prisma.reminder.create({
    data: {
      userId: user.id,
      jobId: parsed.data.jobId ?? null,
      title: parsed.data.title,
      remindAt: new Date(parsed.data.remindAt),
      notify: parsed.data.notify ?? true,
    },
  });
  return jsonOk({ reminder: r });
}
