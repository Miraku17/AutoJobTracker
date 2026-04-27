import { redirect } from "next/navigation";
import { getSessionFromCookies } from "@/lib/auth";
import Sidebar from "@/components/Sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSessionFromCookies();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-paper">
      <Sidebar user={{ email: session.email, name: session.name }} />
      <main className="md:pl-72">
        <div className="mx-auto max-w-[1180px] px-5 md:px-10 lg:px-14 py-8 md:py-12">
          {children}
        </div>
        <footer className="mx-auto max-w-[1180px] px-5 md:px-10 lg:px-14 pb-12">
          <div className="hairline pt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
            <span>Olj Automate · Career Ledger</span>
            <span>Vol. I — Edition {new Date().getFullYear()}</span>
            <span>Set in Fraunces &amp; Manrope</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
