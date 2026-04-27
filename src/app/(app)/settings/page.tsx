import PageHeader from "@/components/PageHeader";
import SettingsClient from "./SettingsClient";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      resume: true,
      resumeFilename: true,
      resumeUpdatedAt: true,
      freelanceProjects: true,
    },
  });
  return (
    <div>
      <PageHeader
        marker="05"
        title="House rules."
        description="Account, integrations, and the small details that make the ledger your own."
      />
      <SettingsClient
        user={{
          email: user.email,
          name: user.name,
          createdAt: user.createdAt.toISOString(),
        }}
        initialResume={{
          filename: fullUser?.resumeFilename ?? null,
          updatedAt: fullUser?.resumeUpdatedAt
            ? fullUser.resumeUpdatedAt.toISOString()
            : null,
          length: fullUser?.resume?.length ?? 0,
          preview: fullUser?.resume?.slice(0, 500) ?? null,
        }}
        initialFreelanceProjects={fullUser?.freelanceProjects ?? ""}
      />
    </div>
  );
}
