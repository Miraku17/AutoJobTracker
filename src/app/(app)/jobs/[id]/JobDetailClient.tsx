"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Trash2,
  Pencil,
  ArrowLeft,
  ExternalLink,
  MapPin,
  Banknote,
  Briefcase,
  Calendar,
  Sparkles,
  Loader2,
  Copy,
  Check,
  RefreshCw,
} from "lucide-react";
import StatusPill from "@/components/StatusPill";
import JobForm, { type JobInput } from "@/components/JobForm";
import { STATUSES, formatDate, relativeTime, statusDot } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  description: string | null;
  notes: string | null;
  salary: string | null;
  location: string | null;
  employmentType: string | null;
  status: string;
  tags: string[];
  appliedAt: string | Date | null;
  followUpAt: string | Date | null;
  updatedAt: string | Date;
  createdAt: string | Date;
};

type Reminder = {
  id: string;
  title: string;
  remindAt: string | Date;
  done: boolean;
};

export default function JobDetailClient({
  initialJob,
  templates,
  initialReminders,
}: {
  initialJob: Job;
  templates: { id: string; name: string; isDefault: boolean }[];
  initialReminders: Reminder[];
}) {
  const router = useRouter();
  const [job, setJob] = useState<Job>(initialJob);
  const [editing, setEditing] = useState(false);
  const [reminders, setReminders] = useState<Reminder[]>(initialReminders);
  const [newReminderTitle, setNewReminderTitle] = useState("Follow up");
  const [newReminderAt, setNewReminderAt] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [draft, setDraft] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function generateDraft() {
    setDrafting(true);
    setDraftError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId: job.id, useAI: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDraftError(data.error || "Failed to generate");
        return;
      }
      setDraft(data.body || "");
    } catch {
      setDraftError("Network error");
    } finally {
      setDrafting(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    await navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  async function save(input: JobInput) {
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...input,
        url: input.url || null,
        appliedAt: input.appliedAt || null,
        followUpAt: input.followUpAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed");
    setJob(data.job);
    setEditing(false);
  }

  async function setStatus(newStatus: string) {
    const previous = job;
    setJob({ ...job, status: newStatus });
    const res = await fetch(`/api/jobs/${job.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (!res.ok) {
      setJob(previous);
      return;
    }
    const data = await res.json();
    setJob(data.job);
  }

  async function deleteJob() {
    if (!confirm("Delete this job?")) return;
    const res = await fetch(`/api/jobs/${job.id}`, { method: "DELETE" });
    if (res.ok) router.replace("/jobs");
  }

  async function addReminder() {
    if (!newReminderAt) return;
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        title: newReminderTitle || "Follow up",
        remindAt: new Date(newReminderAt).toISOString(),
        jobId: job.id,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setReminders((rs) => [...rs, data.reminder]);
      setNewReminderAt("");
    }
  }

  async function toggleReminder(r: Reminder) {
    setReminders((rs) =>
      rs.map((x) => (x.id === r.id ? { ...x, done: !x.done } : x))
    );
    await fetch(`/api/reminders/${r.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ done: !r.done }),
    });
  }

  async function deleteReminder(id: string) {
    setReminders((rs) => rs.filter((x) => x.id !== id));
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
  }

  if (editing) {
    return (
      <div className="sheet p-6 animate-rise">
        <div className="mb-4">
          <div className="eyebrow-accent">Editing entry</div>
          <h2 className="display text-3xl mt-1">{job.title}</h2>
        </div>
        <div className="hairline pt-4">
          <JobForm
            initial={{
              title: job.title,
              company: job.company,
              url: job.url ?? "",
              description: job.description ?? "",
              notes: job.notes ?? "",
              salary: job.salary ?? "",
              location: job.location ?? "",
              status: job.status,
              tags: job.tags,
              appliedAt: job.appliedAt
                ? new Date(job.appliedAt).toISOString()
                : "",
              followUpAt: job.followUpAt
                ? new Date(job.followUpAt).toISOString()
                : "",
            }}
            onSubmit={save}
            onCancel={() => setEditing(false)}
            submitLabel="Save changes"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-rise">
      {/* Back link + actions */}
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/jobs"
          className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" />
          All jobs
        </Link>
        <div className="flex items-center gap-2">
          <button className="btn-secondary" onClick={() => setEditing(true)}>
            <Pencil className="size-3.5" />
            Edit
          </button>
          <button
            className="btn-ghost text-status-rejected !p-2"
            onClick={deleteJob}
            title="Delete"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Dossier header */}
      <header className="mb-8">
        {job.company && job.company !== "—" && (
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mb-3">
            {job.company}
          </div>
        )}
        <h1 className="display text-5xl md:text-6xl text-balance leading-[0.95]">
          {job.title}
        </h1>
        <div className="mt-4 flex items-center gap-3 flex-wrap">
          <StatusPill status={job.status} />
          <select
            className="input !w-auto !py-1.5 !text-xs"
            value={job.status}
            onChange={(e) => setStatus(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                Move → {s.label}
              </option>
            ))}
          </select>
          {job.url && (
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="ink-link inline-flex items-center gap-1 text-xs text-ink-muted hover:text-accent"
            >
              Open posting <ExternalLink className="size-3" />
            </a>
          )}
        </div>
        <div className="hairline-strong border-t-0 mt-6" />
        <div className="hairline mt-1" />
      </header>

      {/* AI draft section */}
      <section className="mb-8">
        {!draft && !drafting ? (
          <div className="sheet p-5 flex items-center gap-4 relative overflow-hidden">
            <div
              aria-hidden
              className="absolute -right-8 -top-8 size-32 rounded-full bg-accent/15 blur-2xl"
            />
            <div className="grid place-items-center w-12 h-12 rounded-sm border border-accent bg-accent text-paper-deep shrink-0 shadow-ink">
              <Sparkles className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="eyebrow-accent">AI assist</div>
              <div className="display text-xl mt-0.5">
                Draft an application message
              </div>
              <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mt-1">
                Claude reads the role + description and writes a tailored
                opener
              </p>
            </div>
            <button
              className="btn-primary shrink-0"
              onClick={generateDraft}
              disabled={drafting}
            >
              <Sparkles className="size-4" />
              Draft with AI
            </button>
          </div>
        ) : (
          <div className="sheet p-6 relative">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="eyebrow-accent">AI draft</div>
                <h3 className="display text-2xl mt-0.5">
                  Application message
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="btn-secondary"
                  onClick={generateDraft}
                  disabled={drafting}
                  title="Regenerate"
                >
                  {drafting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="size-3.5" />
                  )}
                  Regenerate
                </button>
                <button
                  className="btn-primary"
                  onClick={copyDraft}
                  disabled={!draft || drafting}
                >
                  {copied ? (
                    <>
                      <Check className="size-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="size-4" />
                      Copy
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="hairline pt-4">
              {drafting && !draft ? (
                <div className="flex items-center gap-3 text-ink-muted py-8">
                  <Loader2 className="size-4 animate-spin text-accent" />
                  <span className="font-mono text-[10px] uppercase tracking-eyebrow">
                    AI is drafting…
                  </span>
                </div>
              ) : draftError ? (
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected py-2">
                  {draftError}
                </div>
              ) : (
                <pre className="whitespace-pre-wrap text-[15px] leading-relaxed text-ink font-sans text-pretty">
                  {draft}
                </pre>
              )}
            </div>
          </div>
        )}
      </section>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Field index */}
          <section>
            <SectionHead marker="01" title="Particulars" />
            <div className="grid grid-cols-2 md:grid-cols-4 border border-ink/15 rounded-sm overflow-hidden bg-paper-card">
              <Field
                icon={<Calendar className="size-3.5" />}
                label="Applied"
                value={formatDate(job.appliedAt)}
              />
              <Field
                icon={<Bell className="size-3.5" />}
                label="Follow up"
                value={formatDate(job.followUpAt)}
              />
              <Field
                icon={<Banknote className="size-3.5" />}
                label="Salary"
                value={job.salary || "—"}
              />
              <Field
                icon={<MapPin className="size-3.5" />}
                label="Location"
                value={job.location || "—"}
              />
              <Field
                icon={<Briefcase className="size-3.5" />}
                label="Type"
                value={job.employmentType || "—"}
              />
            </div>
            {job.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {job.tags.map((t) => (
                  <span
                    key={t}
                    className="pill bg-accent/10 text-accent border-accent/30"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}
          </section>

          {job.description && (
            <section>
              <SectionHead marker="02" title="Description" />
              <div className="sheet p-6 space-y-4">
                {formatDescription(job.description).map((para, i) =>
                  isHeading(para) ? (
                    <h3
                      key={i}
                      className="font-mono text-[11px] uppercase tracking-eyebrow text-accent pt-2"
                    >
                      {para}
                    </h3>
                  ) : (
                    <p
                      key={i}
                      className="text-[15px] text-ink leading-relaxed text-pretty whitespace-pre-wrap"
                    >
                      {para}
                    </p>
                  )
                )}
              </div>
            </section>
          )}
          {job.notes && (
            <section>
              <SectionHead marker="03" title="Marginalia" />
              <div
                className="border-l-2 border-accent pl-5 py-2"
                style={{ borderLeftStyle: "solid" }}
              >
                <p className="display-italic text-xl text-ink leading-relaxed text-pretty">
                  {job.notes}
                </p>
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {/* Reminders */}
          <section>
            <SectionHead marker="R" title="Reminders" small />
            <div className="sheet p-5">
              <div className="space-y-2 mb-3">
                <div>
                  <label className="label">Title</label>
                  <input
                    className="input"
                    placeholder="Follow up"
                    value={newReminderTitle}
                    onChange={(e) => setNewReminderTitle(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="label">Date</label>
                    <input
                      className="input"
                      type="datetime-local"
                      value={newReminderAt}
                      onChange={(e) => setNewReminderAt(e.target.value)}
                    />
                  </div>
                  <button className="btn-primary" onClick={addReminder}>
                    Add
                  </button>
                </div>
              </div>
              {reminders.length === 0 ? (
                <div className="hairline pt-3 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle text-center py-4">
                  No reminders
                </div>
              ) : (
                <ul className="hairline pt-3 space-y-3">
                  {reminders.map((r) => (
                    <li
                      key={r.id}
                      className="flex items-start gap-3 text-sm group"
                    >
                      <input
                        type="checkbox"
                        checked={r.done}
                        onChange={() => toggleReminder(r)}
                        className="mt-0.5 accent-accent"
                      />
                      <div className="min-w-0 flex-1">
                        <div
                          className={
                            r.done
                              ? "line-through text-ink-subtle tracking-tightish"
                              : "text-ink tracking-tightish"
                          }
                        >
                          {r.title}
                        </div>
                        <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle mt-0.5">
                          {relativeTime(r.remindAt)} · {formatDate(r.remindAt)}
                        </div>
                      </div>
                      <button
                        className="btn-ghost !p-1.5 opacity-0 group-hover:opacity-100 text-status-rejected"
                        onClick={() => deleteReminder(r.id)}
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>

          {/* Provenance */}
          <section className="border border-ink/15 rounded-sm p-5 bg-paper-deep/40">
            <div className="eyebrow mb-3">Provenance</div>
            <dl className="space-y-2 text-xs">
              <div className="flex justify-between">
                <dt className="text-ink-muted">Created</dt>
                <dd className="font-mono num text-ink">{formatDate(job.createdAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Updated</dt>
                <dd className="font-mono num text-ink">{formatDate(job.updatedAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-muted">Templates</dt>
                <dd className="font-mono num text-ink">
                  {String(templates.length).padStart(2, "0")} on file
                </dd>
              </div>
            </dl>
            <div className="mt-3 hairline pt-3 text-[11px] text-ink-muted text-pretty">
              Use the <span className="text-ink font-medium">Cover letter</span> action on
              the Jobs page to draft a tailored letter for this role.
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionHead({
  marker,
  title,
  small,
}: {
  marker: string;
  title: string;
  small?: boolean;
}) {
  return (
    <div className="mb-3">
      <div className="section-marker">§ {marker}</div>
      <h2 className={small ? "display text-xl mt-0.5" : "display text-2xl mt-1"}>
        {title}
      </h2>
    </div>
  );
}

function Field({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="px-4 py-4 border-r border-b border-ink/10 last:border-r-0 even:border-r-0 md:even:border-r md:last:border-r-0">
      <div className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        {icon}
        {label}
      </div>
      <div className="mt-1.5 text-sm font-medium tracking-tightish text-ink num">
        {value}
      </div>
    </div>
  );
}

const SECTION_HEADERS = [
  "Key Responsibilities",
  "Responsibilities",
  "Requirements",
  "Qualifications",
  "Required Skills",
  "Preferred Skills",
  "Nice to Have",
  "Nice-to-Have",
  "What We Offer",
  "What You'll Do",
  "What You Will Do",
  "Ideal Candidate",
  "About Us",
  "About the Role",
  "About the Company",
  "About You",
  "Benefits",
  "Compensation",
  "Schedule",
  "Job Type",
  "Job Title",
  "Location",
  "Salary",
  "How to Apply",
  "Apply Here",
  "PLEASE READ ON HOW TO APPLY",
];

function isHeading(s: string) {
  const t = s.trim();
  return SECTION_HEADERS.some(
    (h) => t === h || t.toLowerCase() === h.toLowerCase()
  );
}

function formatDescription(text: string): string[] {
  if (!text) return [];

  // Insert a break before each known section header
  let s = text;
  for (const h of SECTION_HEADERS) {
    s = s.replace(
      new RegExp(`(^|[^\\n])\\s+(${escapeRegex(h)})\\b`, "gi"),
      "$1\n\n$2\n"
    );
  }

  // Bullet-ish runs: split where a line starts with • or -
  s = s.replace(/\s+([•·\-])\s+/g, "\n$1 ");

  // Collapse 3+ newlines, then split on blank lines
  return s
    .replace(/\n{3,}/g, "\n\n")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
