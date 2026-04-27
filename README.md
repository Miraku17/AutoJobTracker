# OLJ Automate

A full-stack dashboard for automating and managing job applications on **OnlineJobs.ph** (and anywhere else). Built with Next.js 14 (App Router), Prisma + SQLite, JWT auth, Tailwind, and Recharts.

## Features

- **Dashboard overview** — totals, status breakdown, weekly activity, follow-up reminders, recent jobs
- **Job tracker** — kanban + list views, statuses (Saved · Applied · Interview · Offer · Rejected · Ghosted), tags, salary, location, notes, follow-up dates
- **URL importer** — paste an OnlineJobs.ph (or any) job URL, auto-extracts title/company/description
- **Cover-letter generator** — template-based with `{{job_title}}`, `{{company}}`, `{{skills}}`, `{{name}}` variables; OpenAI-ready hook
- **Reminders** — per-job follow-up reminders shown in-app
- **Search & saved filters** — filter by status/tag/keywords; save filters for reuse
- **Analytics** — weekly activity (12 weeks), status pie, conversion funnel (Applied → Interview → Offer), response/offer rate, top tags
- **Smart automation**
  - Duplicate detection by normalized URL hash
  - Auto-tagging from keywords (VA, Dev, Marketing, Design, etc.)
  - Suggested follow-up date (+4 days) when status is set to Applied
- **Auth** — email/password, JWT sessions in httpOnly cookies, route middleware
- **UI** — clean SaaS dashboard, Notion+Linear vibes, fully responsive

## Tech stack

- Next.js 14 (App Router) + TypeScript
- Prisma + SQLite (swap to Postgres by changing the `provider` in `prisma/schema.prisma` and `DATABASE_URL`)
- TailwindCSS, Lucide icons, Recharts
- jose (JWT), bcryptjs (password hashing)
- cheerio (URL scraping)

## Quick start

```bash
# 1. install deps
npm install

# 2. configure env (a working .env is included for dev)
cp .env.example .env

# 3. create the database & schema
npx prisma db push

# 4. (optional) seed a demo account: demo@olj.app / demo1234
npm run db:seed

# 5. run the dev server
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/login`. Register a new account or sign in with the seeded demo user.

## Environment variables

| name | required | description |
|---|---|---|
| `DATABASE_URL` | yes | Prisma connection string. Default: `file:./dev.db` (SQLite). |
| `JWT_SECRET` | yes | Long random string (≥16 chars) used to sign session tokens. |
| `OPENAI_API_KEY` | no | If set, the cover-letter generator can refine output via OpenAI (placeholder hook in `src/lib/cover-letter.ts`). |

## Project layout

```
prisma/
  schema.prisma       # User, Job, Template, Reminder, SearchFilter, Event
  seed.ts             # demo user + starter templates
src/
  app/
    layout.tsx
    page.tsx          # redirects based on session
    login/, register/ # auth screens
    (app)/            # authenticated layout w/ sidebar
      dashboard/
      jobs/, jobs/[id]/
      analytics/
      templates/
      settings/
    api/
      auth/{login,register,logout,me}
      jobs/, jobs/[id]/, jobs/import
      templates/, templates/[id]
      reminders/, reminders/[id]
      filters/, filters/[id]
      cover-letter/
      stats/
      health/
  components/         # Sidebar, Modal, JobForm, ImportJob, WeeklyChart, ...
  lib/
    auth.ts           # JWT + bcrypt + Prisma (server-only)
    auth-edge.ts      # JWT-only verifier for middleware (Edge runtime)
    prisma.ts
    scraper.ts        # cheerio-based metadata extraction + auto-tagger
    cover-letter.ts   # template renderer + AI placeholder
    utils.ts
  middleware.ts       # gates non-public routes
```

## Switching to PostgreSQL

```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public" npx prisma migrate dev
```

## Scripts

| script | purpose |
|---|---|
| `npm run dev` | start the Next.js dev server |
| `npm run build` | runs `prisma generate && prisma migrate deploy && next build` |
| `npm start` | production server |
| `npm run db:push` | sync schema to dev SQLite |
| `npm run db:migrate` | create/apply a migration |
| `npm run db:seed` | seed demo user + templates |

## Notes

- Email delivery for reminders is a stub — drop in Resend, SendGrid, or SMTP from `src/app/api/reminders/route.ts`.
- The OpenAI hook in `src/lib/cover-letter.ts` is intentionally a placeholder so the project runs without keys; wire it up to the Anthropic or OpenAI SDK as needed.
- OnlineJobs.ph scraping uses standard HTTP fetch + cheerio. Behind authentication walls (some OLJ pages) extraction will fall back to OpenGraph metadata.
