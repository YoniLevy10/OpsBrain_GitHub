---
name: ultrareview
description: Fast, high-signal code review for OpsBrain. Use when the user says "ultrareview", asks for a quick review, wants a PR review, or says "run checks". Produces a short risk-focused report (crash/security/data integrity/perf), plus an actionable fix list and minimal test plan.
---

# Ultrareview (OpsBrain)

## Goal
Provide a **fast, risk-first** review of the current change-set and confirm it is **buildable and deployable**.

## When to use
- User says **/ultrareview** (or “ultrareview”).
- User asks: “תבדוק מהר”, “תעשה code review”, “PR review”, “תריץ בדיקות”, “verify before deploy”.

## Operating rules
- Prefer **high-signal** over exhaustive commentary.
- Focus in this order: **crashes → auth/tenancy/RLS → data integrity → security → performance → UX → style**.
- Do not propose large refactors unless they directly mitigate risk or unblock deploy.
- If a command is long-running, run it in background and poll its output.

## Procedure

### 1) Snapshot repo state (always)
Run these (in parallel when possible):
- `git status --porcelain`
- `git diff` (and `git diff --staged` if relevant)
- `git log -5 --oneline`

### 2) Identify the “blast radius”
From diffs, answer:
- What user-facing surfaces changed (routes/pages/auth/layout/data hooks)?
- What persistence changed (Supabase tables/policies/migrations/storage)?
- Any cross-cutting concerns (providers, router, realtime, i18n/RTL)?

### 3) Run checks (choose smallest set that gives confidence)
Default for OpsBrain:
- `npm run build`
- `npm run lint`
- `npm run typecheck` (note: may currently be noisy; if it fails, classify as **new regressions** vs **existing debt**)

If you touched auth/routing:
- sanity: verify redirects `/` → `/Login` when signed out; `/app/*` protected.

If you touched Supabase/realtime:
- look for duplicate subscriptions, missing cleanup, and policy assumptions.

### 4) Review for critical risks
Flag issues under headings:
- **Crash risk**: runtime exceptions, missing providers, invalid hooks usage.
- **Auth & multi-tenancy**: workspace scoping, `workspace_id` filters, RLS expectations, leakage paths.
- **Data integrity**: unsafe updates/deletes, missing constraints, migrations backwards compatibility.
- **Security**: exposed secrets, unsafe HTML, SSRF, auth bypass, client-side trust.
- **Performance**: rerender loops, unbounded subscriptions, heavy bundles, repeated fetches.

### 5) Deliverable format (keep short)
Return:
- **Summary**: 2–4 bullets.
- **Risks (ranked)**: P0/P1/P2 list with 1–2 sentences each.
- **Action list**: concrete edits by file/function.
- **Test plan**: 3–8 checkbox items (only what’s needed).

## Example output
- **Summary**
  - Build/lint pass; routing now redirects `/` → `/Login` when signed out.
  - Realtime notifications subscription now deduped and cleaned up.
- **Risks**
  - **P1**: Supabase RLS migration not applied could cause 400s on `user_workspace_states`.
- **Action list**
  - Apply migration `20260424000001_fix_user_workspace_states.sql` in Supabase SQL editor.
- **Test plan**
  - [ ] Visit `/` signed out → redirects to `/Login`
  - [ ] Sign in with Google → lands on `/app/Dashboard`
  - [ ] Open notifications → no console errors
