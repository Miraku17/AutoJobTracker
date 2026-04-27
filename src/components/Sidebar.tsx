"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  BarChart3,
  FileText,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  marker: string;
};
const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, marker: "A" },
  { href: "/jobs", label: "Jobs", icon: Briefcase, marker: "B" },
  { href: "/analytics", label: "Analytics", icon: BarChart3, marker: "C" },
  { href: "/templates", label: "Templates", icon: FileText, marker: "D" },
  { href: "/settings", label: "Settings", icon: Settings, marker: "E" },
];

export default function Sidebar({
  user,
}: {
  user: { email: string; name?: string | null };
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
      <button
        className="md:hidden fixed top-4 left-4 z-40 btn-secondary !p-2"
        onClick={() => setOpen((v) => !v)}
        aria-label="Toggle navigation"
      >
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </button>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-30 w-72 bg-paper-deep/60 backdrop-blur-sm border-r border-ink/15 transform transition-transform md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* vertical hairline rule on right edge for masthead feel */}
        <div className="absolute top-6 bottom-6 right-[-1px] w-px bg-ink/40" aria-hidden />

        <div className="h-full flex flex-col px-6 py-7">
          {/* Masthead */}
          <Link href="/dashboard" className="block group">
            <div className="eyebrow-accent">№ 01 · The</div>
            <div className="display text-[44px] leading-[0.92] mt-1">
              Career
              <span className="display-italic text-accent"> Ledger</span>
            </div>
            <div className="hairline mt-3 pt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
              <span>OLJ · Automate</span>
              <span>Est. {new Date().getFullYear()}</span>
            </div>
          </Link>

          {/* Folio nav */}
          <div className="mt-7">
            <div className="eyebrow mb-3">Folio</div>
            <nav className="space-y-px">
              {NAV.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "group flex items-center gap-3 px-2 py-2 rounded-sm text-sm transition-colors relative",
                      active
                        ? "text-ink bg-paper-card border border-ink/15"
                        : "text-ink-muted hover:text-ink hover:bg-paper-card/60"
                    )}
                  >
                    <span
                      className={cn(
                        "font-mono text-[10px] uppercase tracking-eyebrow w-4 text-center",
                        active ? "text-accent" : "text-ink-subtle group-hover:text-ink-muted"
                      )}
                    >
                      {item.marker}
                    </span>
                    <Icon className="size-3.5 opacity-70" />
                    <span className="font-medium tracking-tightish">{item.label}</span>
                    {active && (
                      <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent" aria-hidden />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* User colophon */}
          <div className="mt-6 hairline pt-4">
            <div className="eyebrow mb-2">Colophon</div>
            <div className="flex items-center gap-3 px-2 py-2 rounded-sm bg-paper-card border border-ink/15">
              <div className="grid place-items-center w-9 h-9 rounded-sm bg-ink text-paper font-display text-base">
                {(user.name || user.email)[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium truncate tracking-tightish">
                  {user.name || user.email.split("@")[0]}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle truncate">
                  {user.email}
                </div>
              </div>
              <button
                className="btn-ghost !p-1.5"
                onClick={logout}
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-ink/40"
          onClick={() => setOpen(false)}
        />
      )}
    </>
  );
}
