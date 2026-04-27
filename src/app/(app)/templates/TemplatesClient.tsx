"use client";

import { useState } from "react";
import { Plus, Star, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { extractVariables, renderTemplate } from "@/lib/cover-letter";

type Template = {
  id: string;
  name: string;
  subject: string | null;
  body: string;
  isDefault: boolean;
  updatedAt: string | Date;
};

const STARTER = {
  name: "",
  subject: "Application for {{job_title}} at {{company}}",
  body: `Hi {{company}} team,

I'm excited to apply for the {{job_title}} role. With experience in {{skills}}, I can hit the ground running.

I'd love to chat about how I can help. Available for an interview at your convenience.

Best,
{{name}}`,
  isDefault: false,
};

export default function TemplatesClient({ initial }: { initial: Template[] }) {
  const [templates, setTemplates] = useState<Template[]>(initial);
  const [editing, setEditing] = useState<Template | null>(null);
  const [creating, setCreating] = useState(false);

  async function create(form: typeof STARTER) {
    const res = await fetch("/api/templates", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setTemplates((ts) =>
        form.isDefault
          ? [data.template, ...ts.map((t) => ({ ...t, isDefault: false }))]
          : [data.template, ...ts]
      );
      setCreating(false);
    }
  }

  async function update(id: string, form: typeof STARTER) {
    const res = await fetch(`/api/templates/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setTemplates((ts) =>
        ts.map((t) =>
          t.id === id
            ? data.template
            : form.isDefault
            ? { ...t, isDefault: false }
            : t
        )
      );
      setEditing(null);
    }
  }

  async function makeDefault(t: Template) {
    setTemplates((ts) =>
      ts.map((x) => ({ ...x, isDefault: x.id === t.id }))
    );
    await fetch(`/api/templates/${t.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
  }

  async function remove(id: string) {
    if (!confirm("Delete template?")) return;
    setTemplates((ts) => ts.filter((t) => t.id !== id));
    await fetch(`/api/templates/${id}`, { method: "DELETE" });
  }

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button className="btn-primary" onClick={() => setCreating(true)}>
          <Plus className="size-4" />
          New template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className="sheet p-16 text-center animate-rise">
          <div className="display-italic text-3xl text-ink-muted">
            The drawer is empty.
          </div>
          <div className="mt-2 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle">
            Templates make every cover letter a one-click affair
          </div>
          <button className="btn-primary mt-6" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Create your first template
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-5 animate-rise">
          {templates.map((t, i) => (
            <article
              key={t.id}
              className="sheet p-5 group relative hover:border-ink transition-colors"
            >
              <div className="absolute top-3 right-3 font-mono text-[10px] uppercase tracking-eyebrow text-ink-subtle num">
                № {String(i + 1).padStart(2, "0")}
              </div>
              <div className="flex items-start gap-3 mb-2 pr-12">
                {t.isDefault && (
                  <span className="stamp shrink-0 mt-1">Default</span>
                )}
                <div className="min-w-0 flex-1">
                  <div className="eyebrow-accent mb-0.5">Template</div>
                  <h3 className="display text-2xl truncate">{t.name}</h3>
                  {t.subject && (
                    <div className="mt-1 font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted truncate">
                      ✉ {t.subject}
                    </div>
                  )}
                </div>
              </div>
              <div className="hairline pt-3 text-[13px] text-ink-muted line-clamp-5 whitespace-pre-wrap leading-relaxed">
                {t.body}
              </div>
              <div className="mt-3 flex flex-wrap gap-1">
                {extractVariables(`${t.subject ?? ""}\n${t.body}`).map((v) => (
                  <span
                    key={v}
                    className="pill bg-paper-deep border-rule text-ink-muted"
                  >
                    {`{{${v}}}`}
                  </span>
                ))}
              </div>
              <div className="mt-4 hairline pt-3 flex items-center gap-2">
                <button className="btn-secondary" onClick={() => setEditing(t)}>
                  Edit
                </button>
                {!t.isDefault && (
                  <button className="btn-ghost" onClick={() => makeDefault(t)}>
                    <Star className="size-4" />
                    Set default
                  </button>
                )}
                <button
                  className="btn-ghost text-status-rejected ml-auto !p-2"
                  onClick={() => remove(t.id)}
                  title="Delete"
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New template"
        size="lg"
      >
        <TemplateForm
          initial={STARTER}
          onSubmit={create}
          onCancel={() => setCreating(false)}
          submitLabel="Create"
        />
      </Modal>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit template"
        size="lg"
      >
        {editing && (
          <TemplateForm
            initial={{
              name: editing.name,
              subject: editing.subject ?? "",
              body: editing.body,
              isDefault: editing.isDefault,
            }}
            onSubmit={(f) => update(editing.id, f)}
            onCancel={() => setEditing(null)}
            submitLabel="Save"
          />
        )}
      </Modal>
    </div>
  );
}

function TemplateForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
}: {
  initial: typeof STARTER;
  onSubmit: (form: typeof STARTER) => void | Promise<void>;
  onCancel: () => void;
  submitLabel: string;
}) {
  const [form, setForm] = useState(initial);
  const [submitting, setSubmitting] = useState(false);

  async function go(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(form);
    setSubmitting(false);
  }

  const preview = renderTemplate(form.body, {
    job_title: "General Virtual Assistant",
    company: "Acme Inc.",
    skills: "task management, customer support, async comms",
    name: "Jane Doe",
  });

  return (
    <form onSubmit={go} className="grid md:grid-cols-2 gap-5">
      <div className="space-y-3">
        <div>
          <label className="label">Name</label>
          <input
            className="input"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Subject (optional)</label>
          <input
            className="input"
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Body</label>
          <textarea
            className="input min-h-[280px] font-mono text-[12px] leading-relaxed"
            required
            value={form.body}
            onChange={(e) => setForm({ ...form, body: e.target.value })}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isDefault}
            onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
            className="accent-accent"
          />
          Make default
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? "Saving…" : submitLabel}
          </button>
        </div>
      </div>
      <div className="border border-ink/15 bg-paper p-5 rounded-sm relative">
        <div className="absolute top-3 right-3">
          <span className="stamp">Preview</span>
        </div>
        <div className="eyebrow mb-2">Sample render</div>
        <pre className="whitespace-pre-wrap text-[14px] leading-relaxed font-sans text-ink">
          {preview}
        </pre>
      </div>
    </form>
  );
}
