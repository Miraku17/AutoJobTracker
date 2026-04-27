import { NextRequest } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(500),
});

export async function POST(req: NextRequest) {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid input", 400);

  const owned = await prisma.job.findMany({
    where: { id: { in: parsed.data.ids }, userId: user.id },
    select: { id: true },
  });
  const ids = owned.map((j) => j.id);
  if (ids.length === 0) return jsonOk({ deleted: 0 });

  await prisma.event.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.reminder.deleteMany({ where: { jobId: { in: ids } } });
  const result = await prisma.job.deleteMany({
    where: { id: { in: ids }, userId: user.id },
  });

  return jsonOk({ deleted: result.count });
}
