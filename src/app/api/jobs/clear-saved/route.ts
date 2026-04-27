import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { jsonError, jsonOk } from "@/lib/utils";

export async function DELETE() {
  let user;
  try {
    user = await requireUser();
  } catch {
    return jsonError("Unauthorized", 401);
  }

  const savedJobs = await prisma.job.findMany({
    where: { userId: user.id, status: "saved" },
    select: { id: true },
  });
  const ids = savedJobs.map((j) => j.id);

  if (ids.length === 0) {
    return jsonOk({ deleted: 0 });
  }

  await prisma.event.deleteMany({ where: { jobId: { in: ids } } });
  await prisma.reminder.deleteMany({ where: { jobId: { in: ids } } });
  const result = await prisma.job.deleteMany({
    where: { id: { in: ids }, userId: user.id, status: "saved" },
  });

  return jsonOk({ deleted: result.count });
}
