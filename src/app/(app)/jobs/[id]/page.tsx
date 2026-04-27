import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonArray } from "@/lib/utils";
import JobDetailClient from "./JobDetailClient";

export const dynamic = "force-dynamic";

export default async function JobDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const user = await requireUser();
  const [job, templates, reminders] = await Promise.all([
    prisma.job.findFirst({ where: { id, userId: user.id } }),
    prisma.template.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
    prisma.reminder.findMany({
      where: { userId: user.id, jobId: id },
      orderBy: { remindAt: "asc" },
    }),
  ]);
  if (!job) notFound();

  return (
    <JobDetailClient
      initialJob={{ ...job, tags: safeJsonArray(job.tags) }}
      templates={templates.map((t) => ({
        id: t.id,
        name: t.name,
        isDefault: t.isDefault,
      }))}
      initialReminders={reminders}
    />
  );
}
