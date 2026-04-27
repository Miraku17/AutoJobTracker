"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Bookmark,
  Trash2,
  Filter,
  X,
  CheckSquare,
  Square,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Modal from "@/components/Modal";
import JobForm, { type JobInput } from "@/components/JobForm";
import ScrapeSearch from "@/components/ScrapeSearch";
import {
  STATUSES,
  cn,
  safeJsonArray,
  employmentTypeColor,
} from "@/lib/utils";

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
  employmentType: string | null;
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
  const [q, setQ] = useState(sp.get("q") || "");
  const [status, setStatus] = useState(sp.get("status") || "");
  const [tag, setTag] = useState(sp.get("tag") || "");
  const [newOpen, setNewOpen] = useState(sp.get("new") === "1");
  const [prefill, setPrefill] = useState<Partial<JobInput>>({});
  const [coverOpen, setCoverOpen] = useState<Job | null>(null);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkConfirm, setBulkConfirm] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  function toggleSelect(id: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }
  function clearSelection() {
    setSelected(new Set());
    setBulkConfirm(false);
  }
  function selectAllVisible(visible: Job[]) {
    setSelected((s) => {
      const next = new Set(s);
      const allSelected = visible.every((j) => next.has(j.id));
      if (allSelected) {
        for (const j of visible) next.delete(j.id);
      } else {
        for (const j of visible) next.add(j.id);
      }
      return next;
    });
  }
  async function bulkDelete() {
    if (selected.size === 0) return;
    setBulkLoading(true);
    const ids = Array.from(selected);
    const previous = jobs;
    setJobs((js) => js.filter((j) => !selected.has(j.id)));
    try {
      const res = await fetch("/api/jobs/delete-many", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Failed");
      clearSelection();
    } catch {
      setJobs(previous);
      alert("Could not delete the selected jobs.");
    } finally {
      setBulkLoading(false);
    }
  }

  useEffect(() => {
    if (sp.get("new") === "1") setNewOpen(true);
  }, [sp]);

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

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageJobs = useMemo(
    () => filtered.slice((safePage - 1) * pageSize, safePage * pageSize),
    [filtered, safePage, pageSize]
  );

  // Reset to page 1 when filters / search / page-size change
  useEffect(() => {
    setPage(1);
  }, [q, status, tag, pageSize]);

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
          <button
            className="btn-secondary"
            onClick={saveFilter}
            disabled={!q && !status && !tag}
            title="Save filter"
          >
            <Bookmark className="size-4" />
            Save
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
        <ScrapeSearch
          onScraped={(newJobs) => {
            const normalized = (newJobs as Array<Record<string, unknown>>).map(
              (j) => ({
                ...(j as object),
                tags: Array.isArray((j as { tags?: unknown }).tags)
                  ? ((j as { tags: string[] }).tags)
                  : safeJsonArray((j as { tags?: string }).tags ?? null),
              })
            ) as Job[];
            setJobs((js) => [...normalized, ...js]);
          }}
        />
      </div>

      <div className="animate-rise delay-2">
        <ListView
          jobs={pageJobs}
          selected={selected}
          onToggle={toggleSelect}
          onToggleAll={() => selectAllVisible(pageJobs)}
        />
        {filtered.length > 0 && (
          <Pagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-rise">
          <div
            className="sheet flex items-center gap-3 pl-4 pr-2 py-2"
            style={{
              boxShadow:
                "0 1px 0 rgba(22,20,14,0.10), 0 18px 36px -10px rgba(22,20,14,0.45)",
            }}
          >
            <span className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
              <span className="text-accent num">
                {String(selected.size).padStart(2, "0")}
              </span>{" "}
              selected
            </span>
            <span className="hairline-strong w-px h-5 self-center" style={{ borderTop: 0, borderLeft: "1px solid rgba(22,20,14,0.18)" }} />
            <button className="btn-ghost !py-1" onClick={clearSelection}>
              Cancel
            </button>
            {!bulkConfirm ? (
              <button
                className="btn-danger !py-1.5"
                onClick={() => setBulkConfirm(true)}
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            ) : (
              <>
                <span className="font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
                  Delete {selected.size}?
                </span>
                <button
                  className="btn-danger !py-1.5"
                  onClick={bulkDelete}
                  disabled={bulkLoading}
                >
                  {bulkLoading ? (
                    <>
                      <Loader2 className="size-3.5 animate-spin" />
                      Deleting…
                    </>
                  ) : (
                    <>
                      <Trash2 className="size-3.5" />
                      Confirm
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

function Pagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (p: number) => void;
  onPageSizeChange: (s: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);
  const canPrev = page > 1;
  const canNext = page < totalPages;

  // Build a windowed page list: 1 … (page-1) page (page+1) … totalPages
  const pages: (number | "…")[] = [];
  const window = 1;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= page - window && i <= page + window)
    ) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "…") {
      pages.push("…");
    }
  }

  return (
    <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        Showing{" "}
        <span className="text-ink num">
          {String(start).padStart(2, "0")}–{String(end).padStart(2, "0")}
        </span>{" "}
        of <span className="text-ink num">{String(totalItems).padStart(2, "0")}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
          <span className="hidden md:inline">Per page</span>
          <select
            className="input !w-auto !py-1 !text-xs"
            value={pageSize}
            onChange={(e) => onPageSizeChange(parseInt(e.target.value, 10))}
          >
            {[10, 25, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="btn-ghost !p-1.5"
            onClick={() => onPageChange(page - 1)}
            disabled={!canPrev}
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>

          {pages.map((p, i) =>
            p === "…" ? (
              <span
                key={`gap-${i}`}
                className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle px-1"
              >
                …
              </span>
            ) : (
              <button
                key={p}
                onClick={() => onPageChange(p)}
                className={cn(
                  "font-mono text-[11px] num min-w-[28px] h-7 rounded-sm border transition-colors",
                  p === page
                    ? "bg-ink text-paper border-ink"
                    : "border-rule text-ink-muted hover:border-ink hover:text-ink"
                )}
              >
                {p}
              </button>
            )
          )}

          <button
            className="btn-ghost !p-1.5"
            onClick={() => onPageChange(page + 1)}
            disabled={!canNext}
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
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

function ListView({
  jobs,
  selected,
  onToggle,
  onToggleAll,
}: {
  jobs: Job[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  onToggleAll: () => void;
}) {
  if (jobs.length === 0) {
    return (
      <div className="sheet p-12 text-center">
        <div className="display-italic text-3xl text-ink-muted">No matches.</div>
        <div className="mt-2 eyebrow">Try clearing your filters</div>
      </div>
    );
  }
  const allSelected =
    jobs.length > 0 && jobs.every((j) => selected.has(j.id));
  const someSelected =
    !allSelected && jobs.some((j) => selected.has(j.id));
  return (
    <div className="sheet overflow-hidden">
      {/* Header row with select-all */}
      <div className="grid grid-cols-12 gap-3 items-center px-5 py-3 border-b border-ink/15 bg-paper-deep/40 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        <div className="col-span-1 flex items-center">
          <button
            type="button"
            onClick={onToggleAll}
            aria-label={allSelected ? "Deselect all" : "Select all"}
            className={cn(
              "grid place-items-center w-4 h-4 rounded-sm border transition-colors",
              allSelected
                ? "bg-accent border-accent text-paper"
                : someSelected
                ? "bg-accent/20 border-accent text-accent"
                : "bg-paper border-ink/30 hover:border-ink"
            )}
          >
            {allSelected ? (
              <CheckSquare className="size-3" strokeWidth={3} />
            ) : someSelected ? (
              <Square className="size-3" strokeWidth={3} />
            ) : null}
          </button>
        </div>
        <div className="col-span-11">Title · Description</div>
      </div>
      <ul className="divide-y divide-ink/10">
        {jobs.map((j) => (
          <li
            key={j.id}
            className={cn(
              "grid grid-cols-12 gap-3 items-start px-5 py-4 transition-colors group",
              selected.has(j.id)
                ? "bg-accent/[0.06]"
                : "hover:bg-paper-deep/50"
            )}
          >
            <div className="col-span-1 flex items-start pt-0.5">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onToggle(j.id);
                }}
                aria-label={selected.has(j.id) ? "Deselect" : "Select"}
                className={cn(
                  "grid place-items-center w-4 h-4 rounded-sm border transition-colors shrink-0",
                  selected.has(j.id)
                    ? "bg-accent border-accent text-paper"
                    : "bg-paper border-ink/30 opacity-0 group-hover:opacity-100 hover:border-ink"
                )}
              >
                {selected.has(j.id) && (
                  <CheckSquare className="size-3" strokeWidth={3} />
                )}
              </button>
            </div>
            <Link
              href={`/jobs/${j.id}`}
              className="col-span-11 min-w-0 block"
            >
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-[15px] font-medium tracking-tightish group-hover:text-accent transition-colors">
                  {j.title}
                </div>
                {j.employmentType && (
                  <span
                    className={cn(
                      "pill shrink-0",
                      employmentTypeColor(j.employmentType)
                    )}
                  >
                    {j.employmentType}
                  </span>
                )}
              </div>
              {j.description && (
                <div className="mt-1.5 text-[13px] leading-relaxed text-ink-muted line-clamp-2 text-pretty">
                  {j.description}
                </div>
              )}
            </Link>
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
