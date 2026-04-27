"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  LogOut,
  Sparkles,
  Bell,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Check,
  Briefcase,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

type ResumeInfo = {
  filename: string | null;
  updatedAt: string | null;
  length?: number;
  preview?: string | null;
};

export default function SettingsClient({
  user,
  initialResume,
  initialFreelanceProjects,
}: {
  user: { email: string; name: string | null; createdAt: string };
  initialResume: ResumeInfo;
  initialFreelanceProjects: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [resume, setResume] = useState<ResumeInfo>(initialResume);
  const [uploading, setUploading] = useState(false);
  const [resumeError, setResumeError] = useState<string | null>(null);
  const [resumeJustSaved, setResumeJustSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [freelanceProjects, setFreelanceProjects] = useState(
    initialFreelanceProjects
  );
  const [savingProjects, setSavingProjects] = useState(false);
  const [projectsSaved, setProjectsSaved] = useState(false);

  async function saveFreelanceProjects() {
    setSavingProjects(true);
    setProjectsSaved(false);
    const res = await fetch("/api/auth/me", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ freelanceProjects }),
    });
    setSavingProjects(false);
    if (res.ok) {
      setProjectsSaved(true);
      setTimeout(() => setProjectsSaved(false), 2000);
      router.refresh();
    }
  }

  useEffect(() => {
    if (!resumeJustSaved) return;
    const t = setTimeout(() => setResumeJustSaved(false), 2000);
    return () => clearTimeout(t);
  }, [resumeJustSaved]);

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

  async function uploadResume(file: File) {
    setUploading(true);
    setResumeError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/resume", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setResumeError(data.error || "Upload failed");
        return;
      }
      setResume({
        filename: data.filename,
        updatedAt: new Date().toISOString(),
        length: data.length,
        preview: data.preview,
      });
      setResumeJustSaved(true);
    } catch {
      setResumeError("Network error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function deleteResume() {
    if (!confirm("Delete saved resume?")) return;
    const res = await fetch("/api/resume", { method: "DELETE" });
    if (res.ok) {
      setResume({ filename: null, updatedAt: null, length: 0, preview: null });
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

      <Section marker="02" title="Resume" icon={<FileText className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty mb-4">
          Upload your resume so the AI cover-letter generator can ground its
          drafts in your real experience. PDF, TXT, or MD — up to 5 MB.
          Stored locally, not shared.
        </p>

        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) uploadResume(f);
          }}
        />

        {resume.filename ? (
          <div className="border border-ink/15 rounded-sm p-4 bg-paper">
            <div className="flex items-center gap-3">
              <div className="grid place-items-center w-10 h-10 rounded-sm border border-ink/20 bg-paper-deep text-accent shrink-0">
                <FileText className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium tracking-tightish truncate">
                  {resume.filename}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle mt-0.5">
                  {resume.updatedAt && (
                    <>Saved {formatDate(resume.updatedAt)}</>
                  )}
                  {resume.length ? <> · {resume.length.toLocaleString()} chars</> : null}
                </div>
              </div>
              {resumeJustSaved && (
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-status-offer flex items-center gap-1">
                  <Check className="size-3" /> Saved
                </span>
              )}
            </div>
            {resume.preview && (
              <details className="mt-3 hairline pt-3">
                <summary className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted cursor-pointer hover:text-ink">
                  Preview extracted text
                </summary>
                <pre className="mt-2 text-[12px] leading-relaxed text-ink-muted whitespace-pre-wrap font-sans line-clamp-12">
                  {resume.preview}…
                </pre>
              </details>
            )}
            <div className="mt-4 flex items-center gap-2">
              <button
                className="btn-secondary"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload className="size-3.5" />
                    Replace
                  </>
                )}
              </button>
              <button
                className="btn-ghost text-status-rejected"
                onClick={deleteResume}
                disabled={uploading}
              >
                <Trash2 className="size-3.5" />
                Remove
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full border border-dashed border-ink/30 rounded-sm p-6 text-center hover:border-accent hover:bg-accent/5 transition-colors group"
          >
            <div className="grid place-items-center w-12 h-12 mx-auto rounded-sm border border-ink/20 bg-paper-card text-ink-muted group-hover:text-accent group-hover:border-accent transition-colors">
              {uploading ? (
                <Loader2 className="size-5 animate-spin" />
              ) : (
                <Upload className="size-5" />
              )}
            </div>
            <div className="display text-lg mt-3">
              {uploading ? "Uploading…" : "Upload your resume"}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle mt-1">
              PDF · TXT · MD · 5 MB max
            </div>
          </button>
        )}

        {resumeError && (
          <div className="mt-3 font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
            {resumeError}
          </div>
        )}
      </Section>

      <Section
        marker="03"
        title="Freelance projects"
        icon={<Briefcase className="size-4" />}
      >
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty mb-4">
          Featured freelance projects the AI is required to mention in
          paragraph 2 of every cover letter. Include URLs and tech stacks —
          the AI will quote them verbatim.
        </p>
        <textarea
          className="input min-h-[180px] font-mono text-[12px] leading-relaxed"
          value={freelanceProjects}
          onChange={(e) => setFreelanceProjects(e.target.value)}
          placeholder={`Velocity Pickleball Cebu — https://velocitypickleballcebu.com/\nA pickleball court booking platform. Tech: Next.js, TypeScript, ...\n\nCerventech ERP — https://erp.cerventech.com/\nERP dashboard for a small PH company. Tech: Next.js, NestJS, Prisma, ...`}
        />
        <div className="mt-4 flex items-center gap-3">
          <button
            className="btn-primary"
            onClick={saveFreelanceProjects}
            disabled={savingProjects}
          >
            {savingProjects ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Saving…
              </>
            ) : (
              "Save projects"
            )}
          </button>
          {projectsSaved && (
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-status-offer flex items-center gap-1">
              <Check className="size-3" /> Saved
            </span>
          )}
        </div>
      </Section>

      <Section marker="04" title="AI cover letters" icon={<Sparkles className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty">
          Set the <code className="kbd">GROQ_API_KEY</code> environment
          variable to enable AI drafting via Groq (Llama 3.3 70B, free tier).
          Get a key at console.groq.com/keys. Without a key, the generator
          falls back to a built-in template formatter.
        </p>
      </Section>

      <Section marker="05" title="Email notifications" icon={<Bell className="size-4" />}>
        <p className="text-[14px] text-ink-muted leading-relaxed text-pretty">
          Reminders are shown in-app on the dashboard. Email delivery is a
          placeholder — wire up your SMTP / Resend provider in{" "}
          <code className="kbd">/api/reminders</code>.
        </p>
      </Section>

      <Section marker="06" title="Sign out" icon={<LogOut className="size-4" />}>
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
