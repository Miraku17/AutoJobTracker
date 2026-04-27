"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Plus,
  Search,
  LayoutGrid,
  List,
  Bookmark,
  Trash2,
  Filter,
  X,
  MoreHorizontal,
} from "lucide-react";
import StatusPill from "@/components/StatusPill";
import Modal from "@/components/Modal";
import JobForm, { type JobInput } from "@/components/JobForm";
import ImportJob, { type ScrapedResult } from "@/components/ImportJob";
import { STATUSES, formatDate, statusColor, statusDot, cn } from "@/lib/utils";

type Job = {
  id: string;
  title: string;
  company: string;
  url: string | null;
  status: string;
  tags: string[];
  notes: string | null;
  description: string | null;
  salary: string | null;
  location: string | null;
  appliedAt: string | Date | null;
  followUpAt: string | Date | null;
  updatedAt: string | Date;
  createdAt: string | Date;
};

type SavedFilter = {
  id: string;
  name: string;
  query: { q?: string; status?: string; tag?: string };
};

export default function JobsClient({
  initialJobs,
  savedFilters,
  templates,
}: {
  initialJobs: Job[];
  savedFilters: SavedFilter[];
  templates: { id: string; name: string; isDefault: boolean }[];
}) {
  const router = useRouter();
  const sp = useSearchParams();

  const [jobs, setJobs] = useState<Job[]>(initialJobs);
  const [filters, setFilters] = useState<SavedFilter[]>(savedFilters);
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [tag, setTag] = useState(sp.get("tag") || "");
  const [newOpen, setNewOpen] = useState(sp.get("new") === "1");
  const [prefill, setPrefill] = useState<Partial<JobInput>>({});
  const [coverOpen, setCoverOpen] = useState<Job | null>(null);

  useEffect(() => {
    if (sp.get("new") === "1") setNewOpen(true);
  }, [sp]);

  const allTags = useMemo(() => {
    const s = new Set<string>();
    for (const j of jobs) for (const t of j.tags) s.add(t);
    return Array.from(s).sort();
  }, [jobs]);

  const filtered = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return jobs.filter((j) => {
      if (status && j.status !== status) return false;
      if (tag && !j.tags.includes(tag)) return false;
      if (
        ql &&
        !`${j.title} ${j.company} ${j.notes ?? ""}`.toLowerCase().includes(ql)
      )
        return false;
      return true;
    });
  }, [jobs, q, status, tag]);

  const grouped = useMemo(() => {
    const g: Record<string, Job[]> = {};
    for (const s of STATUSES) g[s.id] = [];
    for (const j of filtered) {
      if (!g[j.status]) g[j.status] = [];
      g[j.status].push(j);
    }
    return g;
  }, [filtered]);

  async function createJob(input: JobInput) {
    const res = await fetch("/api/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...input,
        url: input.url || undefined,
        appliedAt: input.appliedAt || null,
        followUpAt: input.followUpAt || null,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to save");
    }
    setJobs((js) => [data.job, ...js]);
    setNewOpen(false);
    setPrefill({});
  }

  function onScraped(s: ScrapedResult) {
    setPrefill({
      title: s.title ?? "",
      company: s.company ?? "",
      description: s.description ?? "",
      location: s.location ?? "",
      url: s.url,
      tags: s.suggestedTags ?? [],
    });
    setNewOpen(true);
  }

  async function moveStatus(jobId: string, newStatus: string) {
    const previous = jobs;
    setJobs((js) =>
      js.map((j) => (j.id === jobId ? { ...j, status: newStatus } : j))
    );
    try {
      const res = await fetch(`/api/jobs/${jobId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setJobs((js) => js.map((j) => (j.id === jobId ? data.job : j)));
    } catch {
      setJobs(previous);
    }
  }

  async function deleteJob(id: string) {
    if (!confirm("Delete this job?")) return;
    const previous = jobs;
    setJobs((js) => js.filter((j) => j.id !== id));
    const res = await fetch(`/api/jobs/${id}`, { method: "DELETE" });
    if (!res.ok) setJobs(previous);
  }

  async function saveFilter() {
    const name = prompt("Name this filter");
    if (!name?.trim()) return;
    const res = await fetch("/api/filters", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: name.trim(), query: { q, status, tag } }),
    });
    const data = await res.json();
    if (res.ok) setFilters((fs) => [data.filter, ...fs]);
  }

  async function deleteFilter(id: string) {
    setFilters((fs) => fs.filter((f) => f.id !== id));
    await fetch(`/api/filters/${id}`, { method: "DELETE" });
  }

  function applyFilter(f: SavedFilter) {
    setQ(f.query.q || "");
    setStatus(f.query.status || "");
    setTag(f.query.tag || "");
  }

  function clearAll() {
    setQ("");
    setStatus("");
    setTag("");
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="sheet p-4 animate-rise">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          <div className="relative flex-1 min-w-0">
            <Search className="size-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              className="input !pl-9"
              placeholder="Search title, company, notes…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <select
            className="input md:w-40"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
          <select
            className="input md:w-40"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
          >
            <option value="">All tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>

          <div className="hidden md:flex items-center gap-0 rounded-sm border border-rule bg-paper-deep p-0.5">
            <button
              className={cn(
                "btn-ghost !p-2 rounded-sm",
                view === "kanban" && "bg-ink text-paper hover:bg-ink hover:text-paper"
              )}
              onClick={() => setView("kanban")}
              title="Columns"
            >
              <LayoutGrid className="size-4" />
            </button>
            <button
              className={cn(
                "btn-ghost !p-2 rounded-sm",
                view === "list" && "bg-ink text-paper hover:bg-ink hover:text-paper"
              )}
              onClick={() => setView("list")}
              title="Index"
            >
              <List className="size-4" />
            </button>
          </div>

          <button
            className="btn-secondary"
            onClick={saveFilter}
            disabled={!q && !status && !tag}
            title="Save filter"
          >
            <Bookmark className="size-4" />
            Save
          </button>
          <button className="btn-primary" onClick={() => setNewOpen(true)}>
            <Plus className="size-4" />
            New job
          </button>
        </div>

        {(q || status || tag) && (
          <div className="flex items-center gap-2 mt-3 pt-3 hairline font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
            <Filter className="size-3" />
            <span>Active:</span>
            {q && <FilterChip onClear={() => setQ("")}>q · {q}</FilterChip>}
            {status && (
              <FilterChip onClear={() => setStatus("")}>
                status · {status}
              </FilterChip>
            )}
            {tag && (
              <FilterChip onClear={() => setTag("")}>tag · #{tag}</FilterChip>
            )}
            <button
              className="ink-link text-ink-muted hover:text-ink ml-1"
              onClick={clearAll}
            >
              Clear all
            </button>
          </div>
        )}

        {filters.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 hairline overflow-x-auto no-scrollbar">
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted whitespace-nowrap">
              Saved:
            </span>
            {filters.map((f) => (
              <div
                key={f.id}
                className="group flex items-center gap-1 pill bg-paper-deep border-rule text-ink-muted hover:text-ink"
              >
                <button onClick={() => applyFilter(f)}>{f.name}</button>
                <button
                  onClick={() => deleteFilter(f.id)}
                  className="opacity-0 group-hover:opacity-100"
                  title="Delete"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="animate-rise delay-1">
        <ImportJob onScraped={onScraped} />
      </div>

      <div className="animate-rise delay-2">
        {view === "kanban" ? (
          <Kanban
            grouped={grouped}
            onMove={moveStatus}
            onCover={(j) => setCoverOpen(j)}
            onDelete={deleteJob}
          />
        ) : (
          <ListView
            jobs={filtered}
            onDelete={deleteJob}
            onCover={(j) => setCoverOpen(j)}
          />
        )}
      </div>

      <Modal
        open={newOpen}
        onClose={() => {
          setNewOpen(false);
          setPrefill({});
          if (sp.get("new")) router.replace("/jobs");
        }}
        title="Add a job"
        size="lg"
      >
        <JobForm
          initial={prefill}
          submitLabel="Save job"
          onCancel={() => {
            setNewOpen(false);
            setPrefill({});
          }}
          onSubmit={createJob}
        />
      </Modal>

      {coverOpen && (
        <CoverLetterModal
          open={!!coverOpen}
          job={coverOpen}
          templates={templates}
          onClose={() => setCoverOpen(null)}
        />
      )}
    </div>
  );
}

function FilterChip({
  children,
  onClear,
}: {
  children: React.ReactNode;
  onClear: () => void;
}) {
  return (
    <span className="pill bg-paper-deep border-rule text-ink-muted">
      {children}
      <button onClick={onClear} className="ml-1 hover:text-ink">
        <X className="size-3" />
      </button>
    </span>
  );
}

function Kanban({
  grouped,
  onMove,
  onCover,
  onDelete,
}: {
  grouped: Record<string, Job[]>;
  onMove: (id: string, status: string) => void;
  onCover: (j: Job) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-3">
      {STATUSES.map((s, i) => {
        const list = grouped[s.id] ?? [];
        return (
          <div
            key={s.id}
            className="bg-paper-deep/60 border border-ink/10 rounded-sm p-3 min-h-[180px]"
          >
            <div className="flex items-center justify-between mb-3 hairline pb-2 border-t-0">
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: statusDot(s.id) }}
                />
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink truncate">
                  {String.fromCharCode(65 + i)} · {s.label}
                </span>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle num">
                {String(list.length).padStart(2, "0")}
              </span>
            </div>
            <div className="space-y-2">
              {list.map((j) => (
                <KanbanCard
                  key={j.id}
                  job={j}
                  onMove={onMove}
                  onCover={onCover}
                  onDelete={onDelete}
                />
              ))}
              {list.length === 0 && (
                <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle text-center py-8 border border-dashed border-ink/15 rounded-sm">
                  Empty
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function KanbanCard({
  job,
  onMove,
  onCover,
  onDelete,
}: {
  job: Job;
  onMove: (id: string, status: string) => void;
  onCover: (j: Job) => void;
  onDelete: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative bg-paper-card border border-ink/15 rounded-sm p-3 hover:border-ink hover:-translate-y-px transition-all duration-150 shadow-soft">
      <Link href={`/jobs/${job.id}`} className="block">
        <div className="text-[13px] font-medium leading-snug tracking-tightish text-ink line-clamp-2">
          {job.title}
        </div>
        <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted truncate">
          {job.company}
        </div>
        {job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.tags.slice(0, 3).map((t) => (
              <span
                key={t}
                className="pill bg-accent/10 text-accent border-accent/30"
              >
                {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-3 hairline pt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
          <span>{formatDate(job.appliedAt ?? job.updatedAt)}</span>
          {job.followUpAt && (
            <span className="text-accent">↻ {formatDate(job.followUpAt)}</span>
          )}
        </div>
      </Link>
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          className="btn-ghost !p-1"
          onClick={() => setOpen((o) => !o)}
          title="Move"
        >
          <MoreHorizontal className="size-3.5" />
        </button>
      </div>
      {open && (
        <div className="absolute top-9 right-2 z-10 sheet p-1 min-w-[160px]">
          <button
            onClick={() => {
              setOpen(false);
              onCover(job);
            }}
            className="w-full text-left px-2 py-1.5 text-xs hover:bg-paper-deep rounded-sm"
          >
            Generate cover letter
          </button>
          <div className="hairline my-1" />
          {STATUSES.filter((s) => s.id !== job.status).map((s) => (
            <button
              key={s.id}
              className="w-full text-left px-2 py-1.5 text-xs hover:bg-paper-deep rounded-sm flex items-center gap-2"
              onClick={() => {
                setOpen(false);
                onMove(job.id, s.id);
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: statusDot(s.id) }}
              />
              Move to {s.label}
            </button>
          ))}
          <div className="hairline my-1" />
          <button
            className="w-full text-left px-2 py-1.5 text-xs text-status-rejected hover:bg-status-rejected/10 rounded-sm"
            onClick={() => {
              setOpen(false);
              onDelete(job.id);
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

function ListView({
  jobs,
  onDelete,
  onCover,
}: {
  jobs: Job[];
  onDelete: (id: string) => void;
  onCover: (j: Job) => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="sheet p-12 text-center">
        <div className="display-italic text-3xl text-ink-muted">No matches.</div>
        <div className="mt-2 eyebrow">Try clearing your filters</div>
      </div>
    );
  }
  return (
    <div className="sheet overflow-hidden">
      <ul className="divide-y divide-ink/10">
        {jobs.map((j, i) => (
          <li
            key={j.id}
            className="grid grid-cols-12 gap-3 items-center px-5 py-4 hover:bg-paper-deep/50 transition-colors group"
          >
            <div className="hidden md:block col-span-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle num">
              {String(i + 1).padStart(2, "0")}
            </div>
            <Link
              href={`/jobs/${j.id}`}
              className="col-span-12 md:col-span-5 min-w-0 block"
            >
              <div className="text-[15px] font-medium tracking-tightish truncate group-hover:text-accent transition-colors">
                {j.title}
              </div>
              <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted truncate mt-0.5">
                {j.company}
                {j.tags.length > 0 && (
                  <span className="ml-3 text-ink-subtle">
                    {j.tags.slice(0, 4).map((t) => `· ${t}`).join(" ")}
                  </span>
                )}
              </div>
            </Link>
            <div className="col-span-6 md:col-span-2">
              <StatusPill status={j.status} />
            </div>
            <div className="col-span-6 md:col-span-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
              {formatDate(j.appliedAt ?? j.updatedAt)}
            </div>
            <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                className="btn-ghost !p-1.5"
                onClick={() => onCover(j)}
                title="Cover letter"
              >
                ✉
              </button>
              <button
                className="btn-ghost !p-1.5 text-status-rejected"
                onClick={() => onDelete(j.id)}
                title="Delete"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function CoverLetterModal({
  open,
  job,
  templates,
  onClose,
}: {
  open: boolean;
  job: Job;
  templates: { id: string; name: string; isDefault: boolean }[];
  onClose: () => void;
}) {
  const [templateId, setTemplateId] = useState(
    templates.find((t) => t.isDefault)?.id ?? templates[0]?.id ?? ""
  );
  const [skills, setSkills] = useState("");
  const [name, setName] = useState("");
  const [useAI, setUseAI] = useState(false);
  const [output, setOutput] = useState<{ subject: string | null; body: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/cover-letter", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          templateId: templateId || undefined,
          jobId: job.id,
          variables: { skills, name },
          useAI,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setOutput({ subject: data.subject, body: data.body });
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  function copy() {
    if (!output) return;
    navigator.clipboard.writeText(
      (output.subject ? `Subject: ${output.subject}\n\n` : "") + output.body
    );
  }

  return (
    <Modal open={open} onClose={onClose} title="Cover letter generator" size="xl">
      <div className="grid md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
            For:{" "}
            <span className="text-ink">{job.title}</span> · {job.company}
          </div>
          <div>
            <label className="label">Template</label>
            <select
              className="input"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              {templates.length === 0 && <option value="">— none —</option>}
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.isDefault ? " (default)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Your name (replaces {`{{name}}`})</label>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Jane Doe"
            />
          </div>
          <div>
            <label className="label">Skills (replaces {`{{skills}}`})</label>
            <textarea
              className="input min-h-[100px]"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="React, Node.js, async communication, customer support…"
            />
          </div>
          <label className="inline-flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={useAI}
              onChange={(e) => setUseAI(e.target.checked)}
            />
            Use AI to refine (placeholder)
          </label>
          {error && (
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
              {error}
            </div>
          )}
          <button
            className="btn-primary w-full"
            onClick={generate}
            disabled={loading || !templateId}
          >
            {loading ? "Generating…" : "Generate"}
          </button>
        </div>
        <div className="border border-ink/15 bg-paper p-5 min-h-[280px] rounded-sm relative">
          <div className="absolute top-3 right-3">
            <span className="stamp">Draft</span>
          </div>
          {output ? (
            <>
              {output.subject && (
                <div className="mb-3">
                  <div className="eyebrow mb-0.5">Subject</div>
                  <div className="display text-lg">{output.subject}</div>
                </div>
              )}
              <pre className="whitespace-pre-wrap text-[14px] leading-relaxed font-sans text-ink">
                {output.body}
              </pre>
              <div className="mt-4 hairline pt-3 flex justify-end">
                <button className="btn-secondary" onClick={copy}>
                  Copy
                </button>
              </div>
            </>
          ) : (
            <div className="h-full grid place-items-center text-center px-6">
              <div>
                <div className="display-italic text-2xl text-ink-muted">
                  Awaiting copy.
                </div>
                <div className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
                  Use {"{{job_title}}"} {"{{company}}"} {"{{skills}}"} {"{{name}}"} in your template
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
