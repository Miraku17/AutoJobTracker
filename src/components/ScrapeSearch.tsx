"use client";

import { useState } from "react";
import { Play, Loader2, Sparkles } from "lucide-react";

const PRESETS = [
  { label: "Developer", q: "developer" },
  { label: "VA", q: "virtual+assistant" },
  { label: "Designer", q: "designer" },
  { label: "Marketing", q: "marketing" },
  { label: "Writer", q: "writer" },
];

const buildUrl = (q: string) =>
  `https://www.onlinejobs.ph/jobseekers/jobsearch?jobkeyword=${q}`;

type Result = {
  found: number;
  saved: number;
  duplicates: number;
  skipped: number;
  jobs: unknown[];
};

export default function ScrapeSearch({
  onScraped,
}: {
  onScraped: (jobs: unknown[]) => void;
}) {
  const [url, setUrl] = useState(buildUrl("developer"));
  const [limit, setLimit] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function go() {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/jobs/scrape-search", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: url.trim(), limit }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Scrape failed");
        return;
      }
      setResult(data);
      if (Array.isArray(data.jobs) && data.jobs.length > 0) {
        onScraped(data.jobs);
      }
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
        className="absolute -left-10 -bottom-10 size-40 rounded-full bg-status-offer/10 blur-2xl"
      />
      <div className="flex items-center gap-3 mb-3 relative">
        <div className="grid place-items-center w-10 h-10 rounded-sm border border-accent bg-accent text-paper shadow-ink">
          <Sparkles className="size-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="eyebrow-accent">Auto run</div>
          <div className="display text-xl mt-0.5">Scrape an OLJ search</div>
        </div>
        <span className="hidden md:inline-flex pill bg-paper-deep border-rule text-ink-muted">
          Beta
        </span>
      </div>

      <p className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted mb-3">
        Paste any onlinejobs.ph search URL — every result on the page will be filed
        as <span className="text-ink">Saved</span>. Duplicates are skipped.
      </p>

      {/* Presets */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {PRESETS.map((p) => {
          const presetUrl = buildUrl(p.q);
          const active = url === presetUrl;
          return (
            <button
              key={p.q}
              type="button"
              onClick={() => setUrl(presetUrl)}
              className={
                "pill border transition-colors " +
                (active
                  ? "bg-ink text-paper border-ink"
                  : "bg-paper-deep border-rule text-ink-muted hover:border-ink hover:text-ink")
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-2">
        <input
          className="input flex-1"
          type="url"
          placeholder="https://www.onlinejobs.ph/jobseekers/jobsearch?jobkeyword=developer"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !loading && go()}
        />
        <select
          className="input md:w-32"
          value={limit}
          onChange={(e) => setLimit(parseInt(e.target.value, 10))}
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              up to {n}
            </option>
          ))}
        </select>
        <button
          className="btn-primary whitespace-nowrap !pl-3"
          onClick={go}
          disabled={loading}
          title="Run scrape"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Scraping…
            </>
          ) : (
            <>
              <Play className="size-4 fill-current" />
              Play
            </>
          )}
        </button>
      </div>

      {(result || error) && (
        <div className="mt-4 hairline pt-3">
          {error && (
            <div className="font-mono text-[10px] uppercase tracking-eyebrow text-status-rejected">
              {error}
            </div>
          )}
          {result && (
            <div className="grid grid-cols-3 gap-3">
              <ResultStat label="Found" value={result.found} />
              <ResultStat label="Saved" value={result.saved} accent />
              <ResultStat label="Duplicates" value={result.duplicates} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  return (
    <div className="border border-ink/15 rounded-sm px-3 py-2 bg-paper">
      <div className="font-mono text-[10px] uppercase tracking-eyebrow text-ink-muted">
        {label}
      </div>
      <div
        className="display num text-2xl mt-1"
        style={accent ? { color: "#c4341a" } : undefined}
      >
        {String(value).padStart(2, "0")}
      </div>
    </div>
  );
}
