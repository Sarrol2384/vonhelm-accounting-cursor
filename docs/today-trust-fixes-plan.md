# Today Screen — Critical Trust Fixes (Implementation Plan)

**Source:** Today Screen Trust Review  
**Scope:** Trust and clarity only — no approval workflow, no Sprint 2/3 features

---

## A. Implementation plan

| Step | Work | Owner |
|------|------|-------|
| 1 | Add `owner-today-trust.ts` — bank/VAT confidence scoring, sanity gates, owner copy | API |
| 2 | Extend `GET /owner/today` — structured `queue`, `bankBalance`, `vat`; fix pending count (`count()` not `take: 10`) | API |
| 3 | Update web API client types for new response | Web |
| 4 | Replace Today health strip with separate Bank Balance + VAT cards + queue banner | Web |
| 5 | Remove internal/dev copy (“Sprint 2”) from approval cards | Web |
| 6 | Verify TypeScript compile | Both |

---

## B. Screens affected

| Screen | Change |
|--------|--------|
| **`/today`** | Primary — new card layout, queue message, VAT gating |
| `/money` | None |
| `/login` | None |

---

## C. Components affected

| File | Change |
|------|--------|
| `apps/api/src/owner/owner-today-trust.ts` | **New** — confidence + copy |
| `apps/api/src/owner/owner.service.ts` | Return trust-enriched payload |
| `apps/web/src/app/today/page.tsx` | New UI structure |
| `apps/web/src/lib/api.ts` | `ownerToday()` response type |

No changes to `owner-shell.tsx`, `money/page.tsx`, or approval resolve flow.

---

## D. API changes required

### `GET /api/owner/today` — response shape (breaking for Today client only)

**Removed:** `healthStatus`, top-level `cashPosition`, `vatPayable`, `nextVatDue`

**Added:**

```typescript
queue: {
  status: 'needs_attention' | 'clear' | 'getting_started';
  message: string;
  pendingCount: number;
}
bankBalance: {
  amount: number | null;
  accountCount: number;
  transactionCount: number;
  unconfirmedCount: number;
  lastUpdated: string | null;
  confidence: 'low' | 'partial' | 'actual';
  typeLabel: 'Actual' | 'Partial';
  supportingText: string;
}
vat: {
  display: 'not_registered' | 'unknown' | 'estimate';
  amount: number | null;
  typeLabel: 'Estimated' | 'Unknown' | null;
  headline: string;
  supportingText: string;
  reason: string | null;
  periodLabel: string | null;
  lastCalculated: string | null;
  nextDue: string | null;
}
```

**Unchanged:** `handledCount`, `pendingActions`, `activity`

### Bug fix
- `pendingApprovalCount` / queue count uses `ownerAction.count()` — not capped at 10.

---

## E. Acceptance criteria

- [ ] “All good” never appears on Today
- [ ] No combined status/cash/tax strip
- [ ] Bank figure labelled **Bank Balance** with **Actual** or **Partial** type pill
- [ ] Supporting text explains bank basis; **Last updated** shown when transactions exist
- [ ] VAT hidden when confidence score &lt; 60
- [ ] VAT hidden when sanity checks fail (stale calc, no period docs, tax &gt; 1.5× cash, etc.)
- [ ] Unknown VAT shows: “We can't estimate VAT yet” + specific reason
- [ ] Queue message is specific (`Nothing needs your attention right now` / `{N} questions need your answer` / getting-started copy)
- [ ] Demo seed no longer shows ~R169k tax in summary strip without context
- [ ] No “Sprint 2” or internal labels visible to owners
- [ ] API and web compile without errors
