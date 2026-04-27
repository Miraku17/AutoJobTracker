"use client";

import { useEffect, useState } from "react";
import { STATUSES } from "@/lib/utils";

export type JobInput = {
  id?: string;
  title: string;
  company: string;
  url: string;
  description: string;
  notes: string;
  salary: string;
  location: string;
  status: string;
  tags: string[];
  appliedAt: string;
  followUpAt: string;
};

export const emptyJob: JobInput = {
  title: "",
  company: "",
  url: "",
  description: "",
  notes: "",
  salary: "",
  location: "",
  status: "saved",
  tags: [],
  appliedAt: "",
  followUpAt: "",
};

export default function JobForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = "Save",
}: {
  initial?: Partial<JobInput>;
  onSubmit: (job: JobInput) => Promise<void> | void;
  onCancel?: () => void;
  submitLabel?: string;
}) {
  const [form, setForm] = useState<JobInput>({ ...emptyJob, ...initial });
  const [tagInput, setTagInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initial) setForm({ ...emptyJob, ...initial });
  }, [initial]);

  function setField<K extends keyof JobInput>(k: K, v: JobInput[K]) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function addTag() {
    const t = tagInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) setField("tags", [...form.tags, t]);
    setTagInput("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit(form);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && (
        <div className="text-sm text-status-rejected bg-status-rejected/10 border border-status-rejected/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Job title</label>
          <input
            className="input"
            required
            value={form.title}
            onChange={(e) => setField("title", e.target.value)}
            placeholder="General Virtual Assistant"
          />
        </div>
        <div>
          <label className="label">Company</label>
          <input
            className="input"
            required
            value={form.company}
            onChange={(e) => setField("company", e.target.value)}
            placeholder="Acme Inc."
          />
        </div>
      </div>

      <div>
        <label className="label">Job URL</label>
        <input
          className="input"
          type="url"
          value={form.url}
          onChange={(e) => setField("url", e.target.value)}
          placeholder="https://www.onlinejobs.ph/jobseekers/job/..."
        />
      </div>

      <div className="grid md:grid-cols-3 gap-3">
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) => setField("status", e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Salary</label>
          <input
            className="input"
            value={form.salary}
            onChange={(e) => setField("salary", e.target.value)}
            placeholder="$800/mo"
          />
        </div>
        <div>
          <label className="label">Location</label>
          <input
            className="input"
            value={form.location}
            onChange={(e) => setField("location", e.target.value)}
            placeholder="Remote / PH"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label className="label">Date applied</label>
          <input
            className="input"
            type="date"
            value={form.appliedAt ? form.appliedAt.slice(0, 10) : ""}
            onChange={(e) =>
              setField(
                "appliedAt",
                e.target.value ? new Date(e.target.value).toISOString() : ""
              )
            }
          />
        </div>
        <div>
          <label className="label">Follow up by</label>
          <input
            className="input"
            type="date"
            value={form.followUpAt ? form.followUpAt.slice(0, 10) : ""}
            onChange={(e) =>
              setField(
                "followUpAt",
                e.target.value ? new Date(e.target.value).toISOString() : ""
              )
            }
          />
        </div>
      </div>

      <div>
        <label className="label">Tags</label>
        <div className="flex flex-wrap items-center gap-2">
          {form.tags.map((t) => (
            <span
              key={t}
              className="pill bg-accent/10 text-accent border-accent/30"
            >
              {t}
              <button
                type="button"
                className="ml-1 text-accent/70 hover:text-accent"
                onClick={() =>
                  setField("tags", form.tags.filter((x) => x !== t))
                }
              >
                ×
              </button>
            </span>
          ))}
          <input
            className="input flex-1 min-w-[120px]"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder="VA, Dev, Marketing… (Enter)"
          />
        </div>
      </div>

      <div>
        <label className="label">Description</label>
        <textarea
          className="input min-h-[80px]"
          value={form.description}
          onChange={(e) => setField("description", e.target.value)}
          placeholder="Paste the job description (optional)"
        />
      </div>

      <div>
        <label className="label">Notes</label>
        <textarea
          className="input min-h-[60px]"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Personal notes (optional)"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        {onCancel && (
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-primary" disabled={submitting}>
          {submitting ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}
