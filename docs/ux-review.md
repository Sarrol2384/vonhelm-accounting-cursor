# UX Review — Owner Workflow

**Perspective:** Small business owner with no accounting background  
**Scope:** User experience only — current workflow friction, no new modules, AI, or architecture  
**Flows reviewed:** First login → Import bank CSV → View Today → Approve transactions  
**Date:** June 2026  
**Related:** [Sprint 2 Plan](./sprint-2-plan.md), [Today trust fixes](./today-trust-fixes-plan.md)

---

## Persona

*I run a pharmacy. I know my bank app and my suppliers. I do not know accounting terms, CSV formats, or what “sorted” means in software.*

---

## 1. First login

**What I see:** A login screen saying “Welcome back” and “Run your business. We handle the money.” Demo email and password are pre-filled.

### Friction

| Issue | Why it hurts |
|--------|----------------|
| **“Welcome back”** | Feels wrong on first visit. I’m not “back” — I’m trying this for the first time. |
| **Demo credentials on screen** | Looks like everyone uses the same login. I don’t know if this is my real account or a test. |
| **No sign-up, no “forgot password”** | If I don’t have those demo details, I’m stuck with no explanation. |
| **Left panel jargon** | “VAT-ready books,” “SARS-aligned compliance,” “handled overnight” — I sell medicine; I don’t know what any of that promises yet. |
| **Developer errors** | If login fails, I may see “run `pnpm dev`” or “Database not running.” That reads like *I* broke something technical. **Trust drops hard.** |
| **No “what happens next”** | After Sign in, I don’t know I’ll land on “Today” or that I need to import my bank first. |

### Where users may get stuck

- Login fails with a technical message.
- User does not have credentials and has no path forward.

### Trust risk

Error messages that mention databases and terminal commands make the product feel unfinished, not “for business owners.”

---

## 2. Importing a bank CSV

**What I see:** **Money** page. Maybe I need to “Add bank account” first — account name, bank name, opening balance. Then “Import bank CSV” and “Choose CSV file.”

### Friction

| Issue | Why it hurts |
|--------|----------------|
| **“CSV”** | My bank says “Download statement” or “Export transactions.” I may not know that means a CSV file. |
| **No how-to steps** | Nothing says: *Open your banking app → Export/download → Choose that file here.* I’m guessing. |
| **“Account name” vs my real account** | I might name it “Business Cheque” while the dropdown later shows a person’s name. Unclear what this label is for. |
| **“Opening balance”** | No plain explanation. Do I copy from my bank app today? From month start? What if I get it wrong? |
| **Page order** | Bank accounts block sits above import. If I already have an account (e.g. from setup), the “add first account” prompt is gone and **nothing obvious tells me to import next.** |
| **“Choose CSV file” disabled** | If no account is selected, the button is grey with little explanation unless I have zero accounts. |
| **Import errors** | “No valid transactions found. Your CSV needs Date and Amount columns” — still sounds like *I* formatted the file wrong, not *how* to fix it. |
| **Success message** | “Rules applied — check Today for items needing you.” **What rules?** What is Today? I have to discover another tab. |
| **“Total cash”** | Shows one account’s balance when I pick from the dropdown, but the label says “Total cash.” If I have two accounts, the number feels wrong. |
| **Transaction list** | Raw bank text (`ACB DEBIT:EXTERNAL AIGLIFE…`) with no plain-English summary. Looks like something went wrong. |
| **Sorted ✓ / Confirmed ✓** | Badges appear with no explanation on this page (only on Today for some of this). |

### Where users may get stuck

- Before import: don’t know I need an account + file.
- During import: file rejected with unclear fix.
- After import: success message but no clear “go to Today now.”

### Trust risk

Wrong opening balance + confusing “total cash” makes me doubt every number on the next screen.

---

## 3. Viewing Today

**What I see:** Greeting, company name, a coloured banner (“X questions need your answer”), **Bank Balance**, **VAT this period**, maybe **Needs you**, maybe “sorted automatically,” and **Recent activity**.

### Friction

| Issue | Why it hurts |
|--------|----------------|
| **Too much at once** | Bank balance, VAT, queue, handled counts, activity — I wanted “what do I do today?” not a dashboard. |
| **“Actual” / “Partial” pills** | On bank balance with no explanation. Partial sounds like my books are wrong. |
| **VAT block** | “Estimated,” “Unknown,” “Not registered” — even if I’m not VAT registered, seeing tax language early is stressful. |
| **Two similar warnings** | Banner says “3 questions need your answer” and section says **Needs you** — fine, but “Showing 3 of 27” means **24 questions are hidden** with no “see rest” or “what happens to the others.” |
| **Bank balance disclaimer** | “Not money owed to you, tax due, or profit” — good, but long; I still wonder *what* the big number is. |
| **“Sorted automatically”** | **Category** is accounting language. The helper text helps, but “Your accountant may still review before filing” — **filing what?** |
| **Empty state** | Only appears in a narrow case. If I imported but have pending questions, I never see the friendly “import your bank” card — I only see pressure. |
| **Nav: Get Paid / Pay** | Tabs look real; inside they say “ships in Sprint 3/4” and link to “legacy view.” **Feels broken or bait-and-switch.** |
| **Loading** | Spinner only — no “Loading your day…” |

### Where users may get stuck

- 27 questions but only 3 visible — I think I’m done after 3.
- VAT/balance pills make me worry before I’ve done anything.

### Trust risk

Hidden question count + “Partial” balance + VAT estimate = “this app is guessing about my business.”

---

## 4. Approving transactions

**What I see:** A card like: *“We're not sure what this was — does this R 38,42 payment to ACB DEBIT:EXTERNAL AIGLIFE… on 01 Jun 2026 look correct?”* Buttons: **Yes, that's right** / **No, something else**. Small text: confirming doesn’t pick a category yet.

### Friction

| Issue | Why it hurts |
|--------|----------------|
| **Question is hostile** | “We're not sure what this was” sounds like the system failed, not like a normal check. |
| **Raw bank garbage in the question** | `ACB DEBIT:EXTERNAL AIGLIFE 009040000002072978` — I don’t know if that’s insurance, a debit order, or fraud. |
| **Duplicate info** | Amount and date appear in the question and again below. |
| **“Yes, that's right”** | Right *how*? Correct amount? Correct that it’s mine? Not stolen? |
| **“No, something else”** | No hint what happens — fixed? hidden forever? will it ask again tomorrow? |
| **Category disclaimer** | “Confirming does not pick a category yet” is honest but leaves me thinking: **then why am I clicking Yes?** and **where DO I pick a category?** (Nowhere in this flow.) |
| **No way to fix details** | I can’t say “it’s insurance” or edit payee — only yes/no. |
| **After Yes** | Card disappears on refresh. No “Done — 26 left” or “You’re all caught up.” |
| **After No** | Same — no explanation of outcome. |
| **Errors** | “We could not save your answer” — generic; card stays; I don’t know if my tap counted. |

### Where users may get stuck

- I don’t understand Yes vs No, or I tap No expecting to explain and nothing happens.

### Trust risk

Approving payments I don’t understand, with no category and cryptic bank text, feels like signing off on bookkeeping I don’t control.

---

## Cross-cutting friction

1. **No guided path:** Login → add account → import → Today → approve is never spelled out as Step 1–2–3–4.
2. **Accounting words leak through:** sorted, category, rules, filing, CSV, Partial/Actual, legacy, Sprint.
3. **Raw bank data shown to owners** instead of shortened labels (“AIG Life insurance?”).
4. **Dead nav items** (Get Paid, Pay, parts of More) break the “simple owner app” promise.
5. **Multi-company / wrong company** — no visible company switcher in the shell; if I have multiple businesses, unclear which I’m viewing.
6. **Same error every time** — if the backend/database fails, login and Today both fail with scary or technical copy.

---

## Confusing wording (inventory)

| Location | Copy | Owner reads it as |
|----------|------|-------------------|
| Login | Welcome back | I’ve used this before (maybe I haven’t) |
| Login | VAT-ready books, SARS-aligned | Marketing jargon, not a promise I understand |
| Money | Import bank CSV | Technical file format, not “download from bank” |
| Money | Opening balance | Accounting term with no guidance |
| Money | Rules applied | Hidden automation I didn’t set up |
| Today | Actual / Partial | My data is complete or broken |
| Today | Sorted automatically | Something was categorized (unclear what) |
| Today | Showing 3 of 27 | Maybe only 3 exist total |
| Approval | We're not sure what this was | The app failed |
| Approval | Confirming does not pick a category yet | This button doesn’t do what I need |
| Nav | Legacy view | Old broken part of the app |
| Nav | Ships in Sprint 3 | Internal dev note, not product copy |

---

## Missing instructions (inventory)

| Step | What’s missing |
|------|----------------|
| After login | “Start on Money — add your bank and import transactions” |
| Add bank account | What opening balance means and where to get the number |
| Import | Where to download the file in a typical banking app |
| Import success | Primary CTA: “Go to Today — N questions waiting” |
| Today (first visit) | What Bank Balance, VAT, and Needs you each mean in one sentence |
| Approval Yes | What you’re confirming (amount + payee correct, not category) |
| Approval No | What happens next (dismissed, won’t ask again, no category picker yet) |
| Cap (3 of 27) | More cards appear as you answer — you’re not finished |

---

## Unclear buttons (inventory)

| Button | Ambiguity |
|--------|-----------|
| Yes, that's right | Correct payment vs correct category vs approve for tax |
| No, something else | Fix it vs reject vs recategorize |
| Choose CSV file | Disabled state — why greyed out? |
| Get Paid / Pay (nav) | Look active but lead to placeholder screens |

---

## Highest-impact UX fixes (copy & flow only)

Prioritized mitigations within the **current** workflow — no new modules:

1. **First-run checklist** on Today or Money: “1. Add bank → 2. Import file → 3. Answer questions here.”
2. **Replace “CSV”** with “Download from your bank app, then upload here” plus one line on where to find export.
3. **Shorten approval questions** — friendly payee label, not full bank feed text.
4. **Explain Yes / No outcomes** in one line each (what changes, what doesn’t).
5. **After import success** — prominent button: “Go to Today (N questions waiting).”
6. **Hide or soften** Get Paid / Pay until they work, or remove “Sprint 3” from owner-facing text.
7. **“Showing 3 of 27”** — add: “Answer these first — more will appear as you go.”

---

## Screens & routes referenced

| Flow step | Route | Key files |
|-----------|-------|-----------|
| Login | `/login` | `apps/web/src/app/login/page.tsx` |
| Import | `/money` | `apps/web/src/app/money/page.tsx` |
| Today | `/today` | `apps/web/src/app/today/page.tsx` |
| Approvals | `/today` (Needs you section) | `apps/web/src/app/today/page.tsx`, `POST /api/owner/actions/:id/resolve` |
