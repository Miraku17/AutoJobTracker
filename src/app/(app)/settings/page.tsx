import PageHeader from "@/components/PageHeader";
import SettingsClient from "./SettingsClient";
import { requireUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const user = await requireUser();
  return (
    <div>
      <PageHeader
        marker="05"
        title="House rules."
        description="Account, integrations, and the small details that make the ledger your own."
      />
      <SettingsClient
        user={{ email: user.email, name: user.name, createdAt: user.createdAt.toISOString() }}
      />
    </div>
  );
}
