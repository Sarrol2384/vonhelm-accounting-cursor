# Supabase setup guide

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Choose a region close to South Africa (e.g. `eu-west-1` or nearest available)
3. Save your database password

## 2. Connection strings

In **Project Settings → Database**:

| Variable | Connection type | Port | Use for |
|----------|----------------|------|---------|
| `DIRECT_URL` | Direct / Session | 5432 | `pnpm db:push`, `pnpm db:seed` |
| `DATABASE_URL` | Pooler / Transaction | 6543 | NestJS API at runtime |

Add to [`.env`](../.env):

```env
DATABASE_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.[REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres?sslmode=require"
```

## 3. API keys (Auth + Storage)

In **Project Settings → API**, copy:

```env
NEXT_PUBLIC_SUPABASE_URL="https://[REF].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_SERVICE_ROLE_KEY="eyJ..."   # server only — never expose to browser
SUPABASE_JWT_SECRET="your-jwt-secret" # API → JWT Settings
SUPABASE_STORAGE_BUCKET="accounting-files"
```

## 4. Create storage bucket

1. Go to **Storage** in Supabase Dashboard
2. Create bucket `accounting-files` (private)
3. No public access — API uses service role for signed URLs

## 5. Push schema and seed

```bash
pnpm install
pnpm db:generate
pnpm db:push
pnpm db:seed
pnpm dev
```

## 6. Link Supabase Auth users

The seed creates `admin@demo.co.za` in the app database. For Supabase Auth:

1. Create the same user in **Authentication → Users** (or sign up via login if enabled)
2. On first Supabase login, the API links `supabaseAuthId` to the existing profile by email

## 7. Local development without Supabase

Leave Supabase env vars empty. The app uses:

- **Docker:** `docker compose up -d` then local URLs in `.env.example` Option A
- **Prisma dev:** `pnpm db:local` (no Docker) — see README Option C
- Built-in JWT login (`admin@demo.co.za` / `password123`)

Run `pnpm db:build` after `pnpm install` so the API resolves `@accounting/db` correctly.
