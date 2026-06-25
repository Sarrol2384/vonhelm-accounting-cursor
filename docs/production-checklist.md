# Production checklist

What to change when moving from local development to **Supabase + Vercel**.  
Use this as a copy-paste guide for environment variables and deployment settings.

**Related:** [Supabase setup](./supabase-setup.md) · [UX review](./ux-review.md)

---

## Overview

Production uses **three** pieces:

| Piece | Where it runs | Purpose |
|-------|---------------|---------|
| **Database** | Supabase Postgres | Data storage |
| **API** | Vercel project → Root `apps/api` | Backend (`/api/...`) |
| **Web** | Vercel project → Root `apps/web` | Login, Today, Money UI |

You need **two Vercel projects** (one for API, one for web), both from the same GitHub repo.

---

## 1. Database (Supabase)

### Use Supabase — not local Prisma dev

| | Local dev | Production |
|--|-----------|------------|
| `DATABASE_URL` | `prisma+postgres://localhost:51213/...` | Supabase **transaction pooler**, port **6543** |
| `DIRECT_URL` | `postgres://...@localhost:51214/...` | Supabase **direct**, port **5432** |

Get both from Supabase project home → **Connect** → **ORMs** (Prisma tab).  
**Not** under Database → Settings (that page is password reset and pooling only).

Copy the **Transaction pooler** URI (6543) and **Direct connection** or **Session pooler** URI (5432). Either direct `db.[ref].supabase.co` or Supabase’s Prisma template for `DIRECT_URL` is fine.

Each Supabase project has its own **Reference ID** — if you create a new project, replace every `postgres.[ref]` and `db.[ref]` in both URLs.

### Password rules

- Use the **database password** from project creation — **not** your supabase.com login password.
- If the password contains `@`, `#`, `%`, or `&`, **URL-encode** it in the connection string (e.g. `@` → `%40`).
- After resetting the database password in Supabase, update **every** place that uses `DATABASE_URL` and `DIRECT_URL`.

### One-time database setup

Run **once** against your Supabase project (from your machine, with production URLs in `.env`):

```bash
pnpm db:push
pnpm db:seed
```

This creates tables and the demo user. Re-run `db:seed` only if you need to reset demo data (careful in real production).

### Create storage bucket (optional)

If you use file uploads later:

1. Supabase → **Storage** → create bucket `accounting-files` (private)
2. Set `SUPABASE_STORAGE_BUCKET=accounting-files` on the API

---

## 2. Vercel — API project (`apps/api`)

**Settings → General**

- **Root Directory:** `apps/api`
- **Include source files outside of the Root Directory:** **ON**

**Environment variables** (Production, Preview, Development as needed):

| Variable | Production value | Notes |
|----------|------------------|-------|
| `DATABASE_URL` | Supabase pooler URI (port **6543**) | Same as local Supabase `.env` |
| `DIRECT_URL` | Supabase direct URI (port **5432**) | Used by Prisma at build/runtime |
| `JWT_SECRET` | **New long random string** | See [Security](#6-security--must-change) |
| `WEB_URL` | Your **web** Vercel URL | e.g. `https://your-app.vercel.app` — required for CORS |
| `API_PORT` | Usually omit on Vercel | Vercel sets port automatically |

**Do not set on API project:**

- `NEXT_PUBLIC_API_URL` — web-only variable

**Optional (Supabase Auth / Storage only):**

| Variable | When needed |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase login |
| `SUPABASE_SERVICE_ROLE_KEY` | File storage on API |
| `SUPABASE_JWT_SECRET` | Supabase login (Legacy JWT secret) |

Leave Supabase auth vars **empty** if you use built-in email/password login.

**Smoke test after deploy:**

- `https://YOUR-API.vercel.app/` → JSON “VonHelm API” message
- `https://YOUR-API.vercel.app/api/auth/config` → JSON response

---

## 3. Vercel — Web project (`apps/web`)

**Settings → General**

- **Root Directory:** `apps/web`
- **Include source files outside of the Root Directory:** **ON**

**Environment variables:**

| Variable | Production value | Notes |
|----------|------------------|-------|
| `NEXT_PUBLIC_API_URL` | Your **API** Vercel URL | e.g. `https://your-api.vercel.app` — **no** trailing slash. **Not** the Supabase URL. |

**Common mistake:** `NEXT_PUBLIC_API_URL` must point at your **NestJS API**, not `https://xxxx.supabase.co`. Supabase is only the database (and optional auth).

**Optional (Supabase Auth in browser only):**

| Variable | When needed |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase login |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase login (anon public key) |

**Do not set on web project:**

- `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `SUPABASE_SERVICE_ROLE_KEY` — API only

**Login URL after deploy:**

`https://YOUR-WEB.vercel.app/login`

---

## 4. `JWT_SECRET` vs `SUPABASE_JWT_SECRET` (not the same)

These are **two different secrets** for **two different login paths**. Do not copy one into the other.

| Variable | Where it comes from | Used for |
|----------|---------------------|----------|
| **`JWT_SECRET`** | **You generate it** (see §11) | Built-in login: email + password → API signs its own JWT (`admin@demo.co.za` flow) |
| **`SUPABASE_JWT_SECRET`** | Supabase → **Project Settings → API → JWT Keys → Legacy JWT secret** | Supabase Auth login only — API **verifies** tokens Supabase issued |

**Default setup (recommended):**

- Set **`JWT_SECRET`** on the API (local `.env` + Vercel API project).
- Leave **`SUPABASE_JWT_SECRET`** empty unless you enable Supabase Auth.

**Do not use:**

- Supabase Legacy JWT secret as `JWT_SECRET`
- A random string you generated as `SUPABASE_JWT_SECRET`
- JWKS / Key Details JSON from the JWT Signing Keys tab

---

## 5. Local `.env` vs production — full comparison

| Variable | Local dev | Production |
|----------|-----------|------------|
| `DATABASE_URL` | Prisma dev **or** Supabase pooler | Supabase pooler (6543) |
| `DIRECT_URL` | Prisma dev **or** Supabase direct | Supabase direct (5432) |
| `JWT_SECRET` | Placeholder OK for dev | **Strong unique secret** |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001` | `https://your-api.vercel.app` (NestJS — **not** Supabase URL) |
| `WEB_URL` | `http://localhost:3000` | `https://your-web.vercel.app` |
| `API_PORT` | `3001` | N/A on Vercel |
| `NEXT_PUBLIC_SUPABASE_URL` | Empty unless using Supabase Auth | Same project URL if enabled |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Empty unless using Supabase Auth | From Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Empty unless using Storage | API only — **never** in web |
| `SUPABASE_JWT_SECRET` | Empty unless using Supabase Auth | Legacy JWT secret — API only |
| `SUPABASE_STORAGE_BUCKET` | `accounting-files` | Same if using Storage |

---

## 6. Security — must change

### Before real users or real data

- [ ] **`JWT_SECRET`** — replace `change-me-in-production-use-long-random-string` with a generated secret (§11). Set on **API only** (local `.env` + Vercel API).
- [ ] **`SUPABASE_JWT_SECRET`** — leave empty unless using Supabase Auth (§4).
- [ ] **Demo login** — seed creates `admin@demo.co.za` / `password123`. Change or remove before go-live.
- [ ] **Database password** — strong, unique; never commit to git.
- [ ] **`.env`** — stays local only; never push to GitHub.
- [ ] **`SUPABASE_SERVICE_ROLE_KEY`** — server/API only; never expose in browser or web env.
- [ ] **Secrets in screenshots/chat** — if exposed, reset database password and JWT secret.

### Supabase Auth (optional)

Only if you switch from built-in login to Supabase Auth:

1. `NEXT_PUBLIC_SUPABASE_URL` — Project URL
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` — anon key (web)
3. `SUPABASE_JWT_SECRET` — **Legacy JWT secret** from JWT Keys tab (API only — not `JWT_SECRET`)
4. Create matching users in Supabase **Authentication → Users**, or link by email on first sign-in

You do **not** need the JWKS / Key Details JSON from JWT Signing Keys.

---

## 7. What not to use in production

| Do not use | Why |
|------------|-----|
| `prisma+postgres://localhost:51213/...` | Local Prisma dev only — Vercel cannot reach your PC |
| `localhost` in `NEXT_PUBLIC_API_URL` or `WEB_URL` | Browser/Vercel cannot call your machine |
| Placeholder `JWT_SECRET` | Anyone could forge login tokens |
| Supabase project URL as `NEXT_PUBLIC_API_URL` | Web app would call Supabase instead of your API — login breaks |
| `SUPABASE_JWT_SECRET` copied into `JWT_SECRET` | Wrong secret type — built-in login tokens won’t validate correctly |

| Same password in git, Slack, or screenshots | Rotate if leaked |

---

## 8. Deploy order

1. Create Supabase project → copy `DATABASE_URL` + `DIRECT_URL`
2. Run `pnpm db:push` and `pnpm db:seed` locally against Supabase
3. Deploy **API** on Vercel (`apps/api`) with env vars above
4. Deploy **Web** on Vercel (`apps/web`) with `NEXT_PUBLIC_API_URL` = API URL
5. Set API `WEB_URL` to the web URL (CORS)
6. Redeploy API if you added `WEB_URL` after first deploy
7. Open `https://your-web.vercel.app/login` and test

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Login: “Database unavailable” | Wrong `DATABASE_URL`, or password not URL-encoded | Check Supabase Connect strings; encode `@` as `%40` |
| Login works locally, fails on Vercel | API env vars missing or wrong | Set `DATABASE_URL`, `JWT_SECRET` on API project |
| Web loads but login/API errors | `NEXT_PUBLIC_API_URL` wrong | Must be **API** Vercel URL (`https://…vercel.app`), not Supabase URL or localhost |
| CORS error in browser | `WEB_URL` on API doesn’t match web URL | Set `WEB_URL` to exact web origin, redeploy API |
| API `/` or `/api/auth/config` works, `/login` 404 | Opened API URL instead of web URL | Use **web** project URL for `/login` |
| `pnpm install` failed on Vercel | Monorepo root not included | Enable “Include source files outside Root Directory” |

| DB connection fails with `@` in password | `@` breaks URL parsing | Encode as `%40` in both `DATABASE_URL` and `DIRECT_URL` |
| Invalid JWT / random logouts | `JWT_SECRET` mismatch | Same value on local API `.env` and Vercel API; don’t use Supabase JWT secret here |

---

## 10. Quick copy checklist

**Supabase (once)**

- [ ] `DATABASE_URL` (6543 pooler)
- [ ] `DIRECT_URL` (5432 direct)
- [ ] Password URL-encoded if needed
- [ ] `pnpm db:push` + `pnpm db:seed`

**Vercel API**

- [ ] Root: `apps/api`
- [ ] Include files outside root: ON
- [ ] `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `WEB_URL`

**Vercel Web**

- [ ] Root: `apps/web`
- [ ] Include files outside root: ON
- [ ] `NEXT_PUBLIC_API_URL` = API URL

**Security**

- [ ] `JWT_SECRET` generated (§11) — **not** Supabase Legacy JWT secret
- [ ] `SUPABASE_JWT_SECRET` empty (unless Supabase Auth)
- [ ] Demo password changed or removed
- [ ] `.env` not in git

---

## 11. Generate a strong `JWT_SECRET`

This is for **`JWT_SECRET` only** — not `SUPABASE_JWT_SECRET`.

**macOS / Linux / Git Bash:**

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

**Windows PowerShell** (use `--eval`; plain `-e` with nested quotes often hangs on `>>`):

```powershell
node --eval "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Paste the output into:

```env
JWT_SECRET="paste-generated-string-here"
```

Use the **same** value on the **Vercel API** project. Redeploy the API after changing it (existing login tokens become invalid).
