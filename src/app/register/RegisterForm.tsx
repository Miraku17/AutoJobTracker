"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password, name }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Registration failed");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="sheet p-6 relative">
      <span aria-hidden className="absolute -top-px -left-px w-3 h-3 border-t border-l border-ink" />
      <span aria-hidden className="absolute -top-px -right-px w-3 h-3 border-t border-r border-ink" />
      <span aria-hidden className="absolute -bottom-px -left-px w-3 h-3 border-b border-l border-ink" />
      <span aria-hidden className="absolute -bottom-px -right-px w-3 h-3 border-b border-r border-ink" />

      {error && (
        <div className="mb-4 font-mono text-[11px] uppercase tracking-eyebrow text-status-rejected border border-status-rejected/40 bg-status-rejected/10 px-3 py-2.5 rounded-sm">
          {error}
        </div>
      )}
      <label className="label">Name</label>
      <input
        className="input"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Jane Doe"
        autoComplete="name"
      />
      <label className="label mt-4">Email</label>
      <input
        className="input"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <label className="label mt-4">Password</label>
      <input
        className="input"
        type="password"
        required
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="At least 8 characters"
        autoComplete="new-password"
      />
      <button className="btn-primary mt-6 w-full" type="submit" disabled={loading}>
        {loading ? "Opening the ledger…" : "Create account"}
      </button>
      <div className="mt-5 hairline pt-4 text-center text-sm text-ink-muted">
        Already a member?{" "}
        <Link href="/login" className="ink-link text-accent">
          Sign in
        </Link>
      </div>
    </form>
  );
}
