"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, Sparkles, Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function SettingsClient({
  user,
}: {
  user: { email: string; name: string | null; createdAt: string };
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    setSaved(false);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-8 max-w-2xl animate-rise">
      <Section marker="01" title="Profile">
        <div className="space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" value={user.email} disabled />
            <div className="mt-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
              Member since {formatDate(user.createdAt)}
            </div>
          </div>
          <div>
            <label className="label">Display name</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="btn-primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </button>
            {saved && (
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-status-offer">
                ✓ Saved
              </span>
            )}
          </div>
        </div>
      </Section>

      <Section marker="02" title="AI cover letters" icon={<Sparkles className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty">
          Set the <code className="kbd">OPENAI_API_KEY</code> environment
          variable to enable AI-assisted refinement. Without a key, the generator
          falls back to template variable substitution and a built-in formatter.
        </p>
      </Section>

      <Section marker="03" title="Email notifications" icon={<Bell className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty">
          Reminders are shown in-app on the dashboard. Email delivery is a
          placeholder — wire up your SMTP / Resend provider in{" "}
          <code className="kbd">/api/reminders</code>.
        </p>
      </Section>

      <Section marker="04" title="Sign out" icon={<LogOut className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed mb-4">
          End your session on this device.
        </p>
        <button className="btn-secondary" onClick={logout}>
          <LogOut className="size-3.5" />
          Sign out
        </button>
      </Section>
    </div>
  );
}

function Section({
  marker,
  title,
  icon,
  children,
}: {
  marker: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <div>
          <div className="section-marker">§ {marker}</div>
          <h2 className="display text-2xl mt-1 flex items-center gap-2">
            {icon && <span className="text-accent">{icon}</span>}
            {title}
          </h2>
        </div>
      </div>
      <div className="sheet p-6">{children}</div>
    </section>
  );
}
