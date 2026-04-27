# OLJ Automate

A personal-use job application tracker for OnlineJobs.ph (and other listing sites). Single-user, runs locally.

## What it does

- **Track** every application from saved → applied → interview → offer/rejected/ghosted (kanban + list views)
- **Import** a single job by URL — cheerio-based scraper auto-extracts title, company, description
- **Scrape** OnlineJobs.ph search pages (e.g. `?jobkeyword=developer`) in bulk via the Play button on `/jobs`
- **Cover letters** rendered from templates with `{{job_title}}`, `{{company}}`, `{{skills}}`, `{{name}}` variables
- **Reminders** for follow-ups (in-app only — no email delivery wired up)
- **Analytics** on `/analytics` — weekly cadence, status breakdown, conversion funnel, top tags

## Stack

- Next.js 14 (App Router) + TypeScript
- Prisma + **SQLite** (`prisma/dev.db`, file-based, gitignored). Schema in `prisma/schema.prisma`.
- TailwindCSS + lucide-react icons + recharts
- Auth: jose (JWT in httpOnly cookie) + bcryptjs. Edge-safe verifier in `src/lib/auth-edge.ts` for middleware; full Prisma auth in `src/lib/auth.ts`.
- Cheerio for HTML scraping (`src/lib/scraper.ts`)

## Repo layout

```
prisma/
  schema.prisma       User, Job, Template, Reminder, SearchFilter, Event
  seed.ts             demo user + starter templates
  dev.db              SQLite — gitignored, back up by copying
src/
  app/
    layout.tsx        loads Fraunces + Manrope + JetBrains Mono via next/font
    globals.css       design tokens + .display, .eyebrow, .sheet, .stamp, etc.
    login/, register/ editorial split-screen auth
    (app)/            authenticated layout w/ Sidebar + footer colophon
      dashboard/, jobs/, jobs/[id]/, analytics/, templates/, settings/
    api/
      auth/{login,register,logout,me}
      jobs/, jobs/[id]/, jobs/import, jobs/scrape-search
      templates/, templates/[id]
      reminders/, reminders/[id]
      filters/, filters/[id]
      cover-letter/, stats/, health/
  components/         Sidebar, PageHeader, Modal, JobForm, ImportJob,
                      ScrapeSearch, StatusPill, WeeklyChart
  lib/
    auth.ts           JWT + bcrypt + Prisma (server-only)
    auth-edge.ts      JWT-only verifier for middleware (Edge runtime)
    prisma.ts         singleton client
    scraper.ts        cheerio-based per-job + listing-page scrapers
    cover-letter.ts   template renderer + AI placeholder
    utils.ts          STATUSES, statusColor, statusDot, formatters, hashUrl
  middleware.ts       gates non-public routes
scripts/
  cleanup-junk-jobs.ts  one-off DB cleanup
```

## Design system — "Career Ledger"

The UI is an editorial dossier — light cream paper, deep ink, vermillion accent, hairline rules, dossier-style numbered sections. Don't drift back toward generic dark-mode SaaS aesthetics.

- **Fonts**: Fraunces (display, with `opsz`/`SOFT`/`WONK` axes — use `.display` and `.display-italic` classes), Manrope (body), JetBrains Mono (eyebrow labels, metadata, dates)
- **Palette tokens** (in `tailwind.config.ts`): `paper`, `paper-card`, `paper-deep` / `ink`, `ink-muted`, `ink-subtle` / `accent` (vermillion `#c4341a`) / `status-{saved,applied,interview,offer,rejected,ghosted}`. Legacy aliases (`bg-card`, `border`, `fg-muted`, etc.) still resolve to the new tokens — fine to use either.
- **Reusable patterns**: `.sheet` (paper card w/ shadow), `.eyebrow` / `.eyebrow-accent` (mono uppercase tracked label), `.section-marker` (e.g. "§ 03"), `.dropcap` (first-letter Fraunces italic accent), `.stamp` (rotated red rubber stamp), `.hairline` / `.hairline-strong`, `.ink-link` (underline-on-hover), `.animate-rise` with `delay-1..5`
- **Numbers** want `tabular-nums` — use the `.num` utility
- **Backdrop**: body has a fixed paper-grain SVG noise overlay at z-0 with `mix-blend-mode: multiply`. Modal uses `isolation: isolate` so the grain doesn't bleed through.

## Auth model

- JWT in `auth_token` httpOnly cookie, 30-day expiry
- `requireUser()` (server) / `getSessionFromCookies()` for layouts
- `middleware.ts` redirects unauthenticated requests on `/(app)/*` routes to `/login?next=`
- Public routes: `/login`, `/register`, `/api/auth/*`, `/api/health`

## Conventions

- Server components are the default; only mark `"use client"` when needed (forms, interactive bits ending in `*Client.tsx`)
- API routes return via `jsonOk()` / `jsonError()` helpers from `lib/utils.ts`
- Validate inputs with `zod` in API routes
- All status strings come from `STATUSES` in `lib/utils.ts` — use `statusColor()` and `statusDot()` for consistent visual treatment
- Tags are stored as a JSON-encoded string in SQLite (`tags: JSON.stringify([...])`); read with `safeJsonArray()`
- Duplicate jobs detected via `urlHash` (normalized URL hash from `lib/utils.ts`)

## Commands

```bash
npm run dev          # next dev
npm run build        # prisma generate && prisma migrate deploy && next build
npm run db:push      # sync schema to dev.db
npm run db:migrate   # create + apply migration
npm run db:seed      # demo@olj.app / demo1234 + starter templates
npx tsc --noEmit     # typecheck only
```

## Personal-use context

This is a personal tracker for one user — SQLite is intentional and appropriate. Don't suggest "scaling" to Postgres unless the user is explicitly preparing to deploy. If they ever do deploy, the README documents the swap (change `provider` to `postgresql`, point `DATABASE_URL` at a hosted DB).

## Working preferences

- **Git**: the user authors commits and pushes. Don't run `git add`, `git commit`, or `git push` unless explicitly asked — just describe what changed and let them stage. Read-only git (`status`, `diff`, `log`) is fine.
- **Scope discipline**: don't refactor surrounding code while fixing a bug. Don't add hypothetical helpers or feature flags.
- **No comments unless the WHY is non-obvious.** Identifiers should explain WHAT.
