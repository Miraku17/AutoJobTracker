import PageHeader from "@/components/PageHeader";
import TemplatesClient from "./TemplatesClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function TemplatesPage() {
  const user = await requireUser();
  const templates = await prisma.template.findMany({
    where: { userId: user.id },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
  return (
    <div>
      <PageHeader
        marker="04"
        title="The drawer of letters."
        description="Reusable cover letters with variables. Use {{job_title}}, {{company}}, {{skills}}, {{name}} — drafts in seconds."
      />
      <TemplatesClient initial={templates} />
    </div>
  );
}
