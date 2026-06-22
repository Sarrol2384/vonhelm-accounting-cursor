# Sprint 1 Completion Report — VonHelm Owner Foundation

**Sprint:** Days 1–14 (Foundation + data in)  
**Source plan:** [MVP Gap Analysis — Sprint 1](./ai-financial-os-mvp-gap-analysis.md#sprint-1-days-114--foundation--data-in)  
**Report date:** 20 June 2026  
**Product name (working):** VonHelm  
**Status:** **Substantially complete** — core owner shell, CSV ingest, AB pipeline v0, and Today read path shipped. Several Sprint 1 acceptance items met; baseline migration and bank-account onboarding UX remain open.

---

## Executive summary

Sprint 1 established the **owner-first application shell**, wired **bank CSV import** end-to-end (web → API → rules → AB pipeline), and introduced the **`OwnerAction` approval queue** data model. The team also pulled forward **Sprint 2 read surfaces** (`GET /owner/today`, `/today` page, plain-language Money list) and **VonHelm branding** on login/shell.

An owner using demo credentials can log in, land on **Today**, import a CSV on **Money**, see auto-handled vs needs-you items, and browse recent activity. **One-tap approvals do not work yet** (resolve API and buttons are Sprint 2).

| Sprint 1 acceptance criterion | Met? |
|------------------------------|------|
| No General Ledger / Company Console in owner nav | ✅ Yes |
| CSV import creates txns; rules set `selectionId` when matched | ✅ Yes |
| Uncategorized txns create `OwnerAction` rows | ✅ Yes |
| No regressions on existing API login | ⚠️ Assumed (no automated tests) |
| Baseline Prisma migration | ❌ No (reference migration only; `db push` used) |
| Dedicated FNB/Std/Nedbank template docs | ❌ No (inline hints on Money page only) |

---

## 1. Features completed

### Owner application shell
- New **`OwnerShell`** replaces accountant `AppShell` for all authenticated routes (login excluded).
- Primary nav: **Today**, **Money**, **Get Paid**, **Pay**, **More** (desktop sidebar + mobile bottom nav).
- Accountant routes (`/ledger`, `/console`, `/vat`, `/dashboard`, `/banking`, etc.) **hidden from nav** but still reachable by direct URL.
- Root `/` redirects to **`/today`**.
- Post-login and company-switch redirects go to **`/today`** (was `/console` / `/dashboard`).

### VonHelm branding (post–Sprint 1 naming decision)
- Central brand constants in `apps/web/src/lib/brand.ts` (`VonHelm`, tagline, company name).
- Page metadata, shell header, and login panel updated to owner/VonHelm copy.

### Bank CSV import (owner UI)
- **`parseBankCsv`** client parser for FNB / Standard Bank / Nedbank-style exports (flexible headers: `date`, `debit`/`credit`, `amount`, `payee`, etc.).
- **Money** page: file picker, account selector (when multiple accounts), success/error feedback.
- Web API client: **`importBankCsv`**, **`createBankAccount`** (client method only — no owner UI yet).

### Autonomous Bookkeeper pipeline v0 (`AbPipelineService`)
- Runs after **single txn create** and **CSV import batch** (via `BankingService`).
- If `selectionId` set by rules → txn marked **`REVIEWED`**, pending `OwnerAction` rows **dismissed**.
- If uncategorized → creates **`OwnerAction`** with plain-English question and two choices (`Yes, that's right` / `No, something else`).
- Idempotent: skips duplicate pending actions per `bankTransactionId`.

### Owner API façade (partial — includes Sprint 2 read path)
- **`GET /api/owner/health`** — tenancy check, company name, timestamp.
- **`GET /api/owner/today`** — aggregates cash, handled count, pending approvals, VAT snapshot, activity feed; **re-processes** uncategorized `NEW` txns on each load.

### Today screen (read-only killer feature shell)
- Greeting, health strip (`all_good` / `N needs you`), cash + optional VAT estimate.
- Pending approval cards (**display only** — banner: “Approval actions coming in Sprint 2”).
- Handled transaction count.
- Empty-state CTA → Money CSV import.
- Recent activity feed with plain descriptions and handled badges.

### Money screen v0
- Cash total for selected bank account.
- Plain-language transaction list (payee/description, +/- amounts, “Handled ✓”).
- No reconciliation tabs or `NEW`/`REVIEWED` accountant workflow exposed.

### Stub owner routes (placeholders)
- **Get Paid**, **Pay**, **Tax** (`/tax`), **More** — scaffold pages with links to legacy accountant views where applicable.

---

## 2. Files created

### API (`apps/api/src/owner/`)
| File | Purpose |
|------|---------|
| `owner.module.ts` | NestJS module; exports `AbPipelineService` |
| `owner.controller.ts` | `GET /owner/health`, `GET /owner/today` |
| `owner.service.ts` | Health + Today aggregation; triggers AB on load |
| `ab-pipeline.service.ts` | Rules post-process → REVIEWED or `OwnerAction` |

### Web (`apps/web/src/`)
| File | Purpose |
|------|---------|
| `components/owner-shell.tsx` | Owner nav, header, mobile drawer, bottom bar |
| `lib/bank-csv.ts` | CSV parser for SA bank exports |
| `lib/brand.ts` | VonHelm product/company constants |
| `app/today/page.tsx` | Today command center (read-only) |
| `app/money/page.tsx` | Cash + CSV import + txn list |
| `app/get-paid/page.tsx` | Sprint 3 stub |
| `app/pay/page.tsx` | Sprint 4 stub |
| `app/more/page.tsx` | Links to tax, settings, legacy reports |
| `app/tax/page.tsx` | Sprint 4 stub (owner tax) |

### Database
| File | Purpose |
|------|---------|
| `packages/db/prisma/migrations/20260620_sprint1_owner_actions/migration.sql` | Reference SQL for `OwnerAction` (not full baseline) |

---

## 3. Files modified

| File | Change |
|------|--------|
| `packages/db/prisma/schema.prisma` | Added `OwnerActionType`, `OwnerActionStatus`, `OwnerAction` model; relations on `Company`, `BankTransaction` |
| `apps/api/src/app.module.ts` | Registered `OwnerModule` |
| `apps/api/src/banking/banking.module.ts` | Imports `OwnerModule` |
| `apps/api/src/banking/banking.service.ts` | Injects `AbPipelineService`; calls pipeline after `createTransaction` and `importCsv` |
| `apps/web/src/app/layout.tsx` | Uses `OwnerShell`; VonHelm metadata |
| `apps/web/src/app/page.tsx` | Redirect `/` → `/today` |
| `apps/web/src/app/login/page.tsx` | VonHelm owner login copy and value props |
| `apps/web/src/lib/api.ts` | Added `createBankAccount`, `importBankCsv`, `ownerHealth`, `ownerToday` |
| `apps/web/src/lib/auth-context.tsx` | Post-auth redirects to `/today` |

**Unchanged but relevant:** `apps/web/src/components/app-shell.tsx` (legacy accountant shell — unused by root layout), all accountant pages under `/console`, `/ledger`, `/vat`, `/banking`, etc.

---

## 4. Database changes

### New enums
```prisma
enum OwnerActionType {
  BANK_TRANSACTION
}

enum OwnerActionStatus {
  PENDING
  RESOLVED
  DISMISSED
}
```

### New model: `OwnerAction`
| Column | Type | Notes |
|--------|------|-------|
| `id` | `String` @id | cuid |
| `companyId` | `String` | FK → `Company` (CASCADE) |
| `type` | `OwnerActionType` | Only `BANK_TRANSACTION` today |
| `status` | `OwnerActionStatus` | Default `PENDING` |
| `bankTransactionId` | `String?` | FK → `BankTransaction` (CASCADE) |
| `question` | `String` | Plain-English prompt |
| `choices` | `Json?` | e.g. `["Yes, that's right", "No, something else"]` |
| `selectedChoice` | `String?` | Unused until resolve endpoint |
| `resolvedAt` | `DateTime?` | |
| `resolvedByUserId` | `String?` | |
| `createdAt` / `updatedAt` | `DateTime` | |

### Indexes
- `@@index([companyId, status])`
- `@@index([bankTransactionId])`

### Application method
- Schema applied via **`pnpm db:push`** (local dev DB). Reference migration file exists; **no full baseline migration** for the entire schema history.

### Behavioural data flow
1. CSV row → `BankTransaction` (`status: NEW`).
2. `applyRules` may set `selectionId` + `vatCode`.
3. `AbPipelineService.processTransaction`:
   - **Categorized** → `status: REVIEWED`; dismiss pending actions.
   - **Uncategorized** → insert `OwnerAction` (`PENDING`).

---

## 5. API endpoints added

All under global prefix `/api`, JWT + `x-company-id` required.

| Method | Path | Handler | Response (summary) |
|--------|------|---------|-------------------|
| `GET` | `/owner/health` | `OwnerController.health` | `{ status, companyId, companyName, timestamp }` |
| `GET` | `/owner/today` | `OwnerController.today` | `{ cashPosition, handledCount, pendingApprovalCount, healthStatus, vatPayable, nextVatDue, pendingActions[], activity[] }` |

### Existing endpoints wired by Sprint 1 (not new, but now used from owner UI)

| Method | Path | Used for |
|--------|------|----------|
| `POST` | `/banking/accounts/:accountId/import` | CSV import from Money page |
| `GET` | `/banking/accounts` | List accounts + balance |
| `GET` | `/banking/accounts/:accountId/transactions` | Money txn list |
| `POST` | `/auth/login` | Demo owner login |

**Not added (planned Sprint 2):** `POST /owner/actions/:id/resolve`

---

## 6. Known issues

| # | Issue | Severity | Detail |
|---|--------|----------|--------|
| 1 | **No approval actions** | High | Today shows questions but no resolve API/UI; cards are read-only. |
| 2 | **No bank account creation UI** | High | `createBankAccount` exists in API client only. If company has zero accounts, CSV import is disabled (`!selectedAccount`). Demo seed likely has accounts; greenfield owner blocked. |
| 3 | **Accountant routes still public** | Medium | `/ledger`, `/console`, `/vat` work by URL — nav hidden only. |
| 4 | **`GET /owner/today` side effects** | Medium | Every Today load re-runs AB pipeline on all uncategorized `NEW` txns (N+1 queries). Risk at scale; acceptable for demo, not for 50+ txns target in Sprint 2. |
| 5 | **No automated tests** | Medium | Login regression and import → queue flow unverified in CI. |
| 6 | **Migration discipline** | Medium | `db push` only; reference migration is incremental, not baseline. Fresh deploy needs documented push/seed path. |
| 7 | **AB choices don’t affect books** | Medium | Approving (when built) won’t post journals — `journalEntryId` still never set from banking. |
| 8 | **CSV parser edge cases** | Low | Single `amount` column heuristic; unusual bank formats may fail silently (rows skipped). |
| 9 | **VAT on Today** | Low | `vatPayable` from open `VatPeriod`; not bank-truth; owner Tax screen still stub. |
| 10 | **Type cast on CSV import** | Low | `rows as unknown as Array<Record<string, string>>` in Money page — works but brittle. |

---

## 7. Technical debt introduced

| Debt | Why | Suggested fix |
|------|-----|----------------|
| **Sprint boundary blur** | `GET /owner/today` + full Today page are Sprint 2 deliverables | Treat resolve + polish as Sprint 2; don’t expand Today further until resolve ships |
| **AB pipeline in banking + owner** | `BankingService` depends on `OwnerModule`; pipeline also invoked from `OwnerService.getToday` | Single event hook or job queue after import; remove duplicate processing on read |
| **Synchronous batch processing** | `processImportBatch` loops sequentially per txn | Batch insert actions; optional background job for large CSVs |
| **Hard-coded approval choices** | Two strings in `ab-pipeline.service.ts` | Config or category picker data when resolve ships |
| **No `OwnerAction` unique constraint** | Duplicate prevention is app-level `findFirst` only | DB unique partial index on `(bankTransactionId)` WHERE `status = 'PENDING'` |
| **Owner shell duplicates nav logic** | Desktop sidebar + mobile drawer + bottom nav maintained separately | Extract shared nav config (already one array — OK for now) |
| **Legacy + owner routes coexist** | Two UX paradigms in one Next app | Route groups or feature flag before launch |
| **Brand constants web-only** | API emails/PDFs won’t say VonHelm | Shared package or env when notifications ship |
| **`db push` workflow** | No reproducible migration history for prod | Sprint 1 carry-over: baseline migration + `migrate deploy` |

---

## 8. Remaining Sprint 1 work

Items from the **original Sprint 1 plan** not fully done:

| Item | Status | Notes |
|------|--------|-------|
| Baseline Prisma migration | ❌ Open | Only `20260620_sprint1_owner_actions` reference SQL |
| FNB / Standard Bank / Nedbank **template docs** | ❌ Open | Inline copy on Money page; no `docs/` bank template guide or sample CSVs |
| Verify login regression | ❌ Open | Manual only |
| Bank account setup for owner (minimal) | ❌ Open | Required for CSV path without seed data |

Items **deferred to Sprint 2** (were never Sprint 1 scope but partially built):

| Item | Status |
|------|--------|
| `POST /owner/actions/:id/resolve` | Not started |
| One-tap approval card buttons | Not started |
| GL account → owner category mapping | Partial (`plainCategory` strips account codes in API only) |
| Integration tests (import → queue → resolve) | Not started |
| Today performance (<3s @ 50 txns) | Not measured |
| Remove accountant jargon from owner UI | Mostly done on Money/Today; legacy links remain |

---

## Recommended Sprint 2 entry criteria

1. Ship **`POST /owner/actions/:id/resolve`** and wire Today approval buttons.
2. Add **“Add bank account”** on Money (or onboarding step) so CSV works without seed.
3. Add **5 integration tests** for import → `OwnerAction` → resolve.
4. Stop running AB pipeline on **every** `GET /owner/today` (process on write only).
5. Run **`prisma migrate`** baseline before any staging deploy.

---

## Verification performed (dev)

| Check | Result |
|-------|--------|
| `@accounting/db` build | ✅ |
| API `tsc --noEmit` | ✅ |
| Web `tsc --noEmit` | ✅ |
| `prisma db push` (Sprint 1 schema) | ✅ (local DB) |
| End-to-end manual (login → import → Today) | ⚠️ Not re-run for this report |

**Demo credentials:** `admin@demo.co.za` / `password123`

---

## Related documents

| Doc | Link |
|-----|------|
| Sprint 1 plan | [Gap analysis § Sprint 1](./ai-financial-os-mvp-gap-analysis.md#sprint-1-days-114--foundation--data-in) |
| Sprint 2 plan | [Gap analysis § Sprint 2](./ai-financial-os-mvp-gap-analysis.md#sprint-2-days-1528--today--approvals-killer-feature) |
| AB design | [Autonomous Bookkeeper Blueprint](./autonomous-bookkeeper-blueprint.md) |
| Owner UX | [UX Architecture](./ai-financial-os-ux-architecture.md) |
