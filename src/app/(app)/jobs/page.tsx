import PageHeader from "@/components/PageHeader";
import JobsClient from "./JobsClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { safeJsonArray } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireUser();
  const [jobs, filters, templates] = await Promise.all([
    prisma.job.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.searchFilter.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    }),
    prisma.template.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
    }),
  ]);

  return (
    <div>
      <PageHeader
        marker="02"
        title="The job desk."
        description="Every application from saved to offer — held on one continuous page. Filter, file, and follow up."
      />
      <JobsClient
        initialJobs={jobs.map((j) => ({ ...j, tags: safeJsonArray(j.tags) }))}
        savedFilters={filters.map((f) => ({ ...f, query: JSON.parse(f.query) }))}
        templates={templates.map((t) => ({ id: t.id, name: t.name, isDefault: t.isDefault }))}
      />
    </div>
  );
}
