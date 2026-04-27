"use client";

import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

export type ScrapedResult = {
  title: string | null;
  company: string | null;
  description: string | null;
  location: string | null;
  source: string | null;
  url: string;
  suggestedTags?: string[];
};

export default function ImportJob({
  onScraped,
}: {
  onScraped: (data: ScrapedResult) => void;
}) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function go() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/jobs/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not fetch this URL");
        return;
      }
      onScraped(data.scraped);
      setUrl("");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="sheet p-5 relative overflow-hidden">
      <div
        aria-hidden
        className="absolute -right-6 -top-6 size-24 rounded-full bg-accent/10 blur-2xl"
      />
      <div className="flex items-center gap-3 mb-3 relative">
        <div className="grid place-items-center w-10 h-10 rounded-sm border border-ink bg-ink text-paper">
          <Download className="size-4" />
        </div>
        <div>
          <div className="eyebrow-accent">Wire service</div>
          <div className="display text-xl mt-0.5">Import from URL</div>
        </div>
      </div>
      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mb-3">
        Paste an OnlineJobs.ph link — title, company &amp; description auto-extract.
      </p>
      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="input flex-1"
          type="url"
          placeholder="https://www.onlinejobs.ph/jobseekers/job/..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
        />
        <button
          className="btn-primary whitespace-nowrap"
          onClick={go}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Fetching…
            </>
          ) : (
            "Fetch"
          )}
        </button>
      </div>
      {error && (
        <div className="mt-3 font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
          {error}
        </div>
      )}
    </div>
  );
}
