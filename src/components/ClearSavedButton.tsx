"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2, Loader2 } from "lucide-react";

export default function ClearSavedButton({ count }: { count: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();

  if (count === 0) return null;

  async function clear() {
    setLoading(true);
    try {
      const res = await fetch("/api/jobs/clear-saved", { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      setConfirming(false);
      startTransition(() => router.refresh());
    } catch {
      alert("Could not clear saved jobs.");
    } finally {
      setLoading(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="btn-ghost text-ink-muted hover:text-status-rejected"
        title={`Delete all ${count} saved jobs`}
      >
        <Trash2 className="size-3.5" />
        Clear saved ({count})
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2 border border-status-rejected/40 bg-status-rejected/5 rounded-sm pl-3 pr-1 py-1">
      <span className="font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
        Delete {count}? This can&rsquo;t be undone.
      </span>
      <button
        onClick={() => setConfirming(false)}
        className="btn-ghost !py-1 !px-2"
        disabled={loading || pending}
      >
        Cancel
      </button>
      <button
        onClick={clear}
        className="btn-danger !py-1 !px-2"
        disabled={loading || pending}
      >
        {loading || pending ? (
          <>
            <Loader2 className="size-3 animate-spin" />
            Clearing…
          </>
        ) : (
          <>
            <Trash2 className="size-3" />
            Confirm
          </>
        )}
      </button>
    </div>
  );
}
