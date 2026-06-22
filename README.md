# SA Accountant Edition

South African accounting platform for accountants — multi-tenant, ZAR, bi-monthly VAT, VAT 201.

## Stack

- **Web:** Next.js 15, React 19, Tailwind CSS 4
- **API:** NestJS 10, JWT + optional Supabase Auth
- **Database:** PostgreSQL (local Docker or **Supabase**), Prisma ORM
- **Storage:** Optional Supabase Storage for bank statements
- **Monorepo:** pnpm workspaces, Turborepo

## Quick start

### Prerequisites

- Node.js 20+
- pnpm 9+
- **Either** Docker (local Postgres) **or** a [Supabase](https://supabase.com) project

### Option A: Local Postgres (Docker)

```bash
docker compose up -d
cp .env.example .env
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

### Option B: Supabase (no Docker)

1. Create a Supabase project
2. Copy connection strings and API keys into `.env` (see [docs/supabase-setup.md](docs/supabase-setup.md))
3. Run:

```bash
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL, DIRECT_URL, and API keys
pnpm install
pnpm db:build
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

### Option C: Prisma local dev (no Docker, no Supabase)

Use when Docker is unavailable (e.g. Windows without Docker Desktop):

```bash
cp .env.example .env
pnpm install
pnpm db:local          # starts embedded Postgres on localhost:51214
pnpm db:build
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

Update `DATABASE_URL` and `DIRECT_URL` in `.env` to the URL printed by `pnpm db:local` if the port differs.

Open **http://localhost:3000/login** (both web `:3000` and API `:3001` must be running).

### Demo login (local auth)

- **Email:** admin@demo.co.za
- **Password:** password123

When Supabase Auth is configured (`SUPABASE_JWT_SECRET` set), login uses Supabase — create matching user in Supabase Dashboard or link by email on first sign-in.

## Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | Postgres connection (pooler for API) |
| `DIRECT_URL` | Yes | Direct Postgres (Prisma migrations) |
| `JWT_SECRET` | Yes | Local JWT signing |
| `NEXT_PUBLIC_API_URL` | Yes | API base URL for web app |
| `NEXT_PUBLIC_SUPABASE_URL` | Optional | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Optional | Supabase anon key (browser) |
| `SUPABASE_SERVICE_ROLE_KEY` | Optional | Storage uploads (server only) |
| `SUPABASE_JWT_SECRET` | Optional | Verify Supabase Auth tokens in API |
| `SUPABASE_STORAGE_BUCKET` | Optional | Bucket name (default: `accounting-files`) |

See [`.env.example`](.env.example) for templates.

## Project structure

```
apps/web/          Next.js frontend + Supabase browser client
apps/api/          NestJS REST API + Supabase Auth/Storage
packages/db/       Prisma schema, migrations, seed
packages/ui/       Shared UI components
docs/              Setup guides including Supabase
```

## Features

- Multi-tenant firm + company model with company switcher
- Company Console with alerts, VAT deadlines, compliance strip
- Accountant Dashboard with KPIs, notes, tasks
- Banking: import, review, reconcile, Supabase file storage
- General Ledger: chart of accounts, journals, trial balance
- SA VAT: periods, close workflow, VAT 201 calculation wizard
- Sales & Purchases: customers, suppliers, invoices, bills
- Reports catalog with JSON/PDF/Excel export and audit trail

## Troubleshooting blank page

If `localhost:3000` shows a blank screen:

1. Ensure **both** apps are running: `pnpm dev` starts web and API
2. Open **http://localhost:3000/login** directly
3. Run `pnpm db:push && pnpm db:seed` if the database is empty
4. Check browser DevTools → Console for errors
