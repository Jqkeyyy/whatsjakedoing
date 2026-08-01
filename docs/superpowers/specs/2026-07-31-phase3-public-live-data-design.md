# Phase 3: Public page reads live data

## Problem

`src/App.tsx` (the public `/` route) renders hardcoded fixtures from `src/mock/events.ts`,
`src/mock/categories.ts`, and `src/mock/statusOverride.ts`. The `/admin` panel (built in
Phase 2) writes real data to Supabase, but none of it is visible on the public page — the
public page is fully decoupled from the database. This was intentional at the time
(see `docs/superpowers/plans/2026-07-29-phase2-supabase-admin.md`, "Public `/` route stays
on mock data this phase") and deferred as "Phase 3 scope."

## Goal

Make the public page render real data from Supabase, so admin edits (events, categories,
status overrides) are visible to visitors.

## Approach

`src/hooks/useAdminData.ts` already does what the public page needs: it reads `categories`,
`events`, and `status_override` directly from Supabase via the anon-key client
(`src/lib/supabaseClient.ts`), which Row Level Security already permits for public `SELECT`
(per the Phase 2 plan's stated intent — "matching how the eventual public view will read").
No new backend endpoint is needed; reuse this hook for both routes.

## Changes

1. **Rename `src/hooks/useAdminData.ts` → `src/hooks/useCalendarData.ts`.** Behavior is
   unchanged: returns `{ categories, events, statusOverride, loading, error, refetch }`.
   Rename its test file (`useAdminData.test.ts` → `useCalendarData.test.ts`) to match.
2. **Update `src/admin/AdminApp.tsx`** to import `useCalendarData` instead of `useAdminData`.
   No behavior change — same hook, new name.
3. **Update `src/App.tsx`** to call `useCalendarData()` instead of importing
   `mockEvents`/`mockCategories`/`mockStatusOverride`. Add the same loading/error text states
   `AdminApp.tsx` already uses (`Loading…` paragraph, error message paragraph) before
   rendering `StatusHero` and `CalendarTabs`. `deriveStatus` is called with the fetched data
   instead of mock data.
4. **Delete unused mock files**: `src/mock/events.ts`, `src/mock/categories.ts`,
   `src/mock/statusOverride.ts`. `src/mock/hubLinks.ts` is kept — the sidebar bio and hub
   links remain static, since there's no admin UI for editing them and that's out of scope.
5. **Update `src/__tests__/App.test.tsx`** to mock `useCalendarData` (same pattern
   `src/admin/__tests__/AdminApp.test.tsx` already uses) instead of relying on the deleted
   mock-data imports.

## Out of scope

- No new public API endpoint — the existing anon-key/RLS read path is reused as-is.
- No polling or realtime auto-refresh. The public page fetches once on load, same as the
  admin panel currently does. Visitors reload the page to see updates.
- Sidebar bio and hub links stay static (no admin UI exists for them; not part of this
  phase).

## Testing

- `useCalendarData` keeps its existing test coverage (renamed, not rewritten).
- `App.test.tsx` is updated to mock the hook rather than depend on real Supabase calls or
  static mock data, consistent with how `AdminApp.test.tsx` is tested.
- Manual verification: after deploying, confirm the public page shows "no events" state
  correctly (the database is currently empty) and that creating a test event in `/admin`
  makes it appear on `/` after a reload.
