import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink } from "lucide-react";
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
    <div>
      <Link
        href="/jobs"
        className="inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg mb-3"
      >
        <ArrowLeft className="size-4" />
        Back to jobs
      </Link>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-semibold tracking-tight truncate">
            {job.title}
          </h1>
          <div className="text-sm text-fg-muted">{job.company}</div>
        </div>
        <div className="flex items-center gap-2">
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="btn-secondary"
            >
              Open <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      </div>

      <JobDetailClient
        initialJob={{ ...job, tags: safeJsonArray(job.tags) }}
        templates={templates.map((t) => ({
          id: t.id,
          name: t.name,
          isDefault: t.isDefault,
        }))}
        initialReminders={reminders}
      />
    </div>
  );
}
