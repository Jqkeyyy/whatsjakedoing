# Phase 3: Public Page Live Data Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public `/` route render real Supabase data (categories, events, status override) instead of hardcoded mock fixtures, so admin edits are visible to visitors.

**Architecture:** Rename the admin panel's existing Supabase-backed data hook (`useAdminData`) to a shared `useCalendarData` hook, and use it from both `App.tsx` (public) and `AdminApp.tsx` (admin). No new backend endpoint — the hook already reads via the anon-key Supabase client, which RLS already permits for public `SELECT`.

**Tech Stack:** React 18, TypeScript, Vitest, @testing-library/react, Supabase JS client (anon key).

## Global Constraints

- No new backend/API endpoint — reuse the existing anon-key read path (spec: "Approach").
- No polling or realtime auto-refresh — fetch once on load, same as the admin panel today (spec: "Out of scope").
- `src/mock/hubLinks.ts` stays; sidebar bio/hub links remain static (spec: "Out of scope").
- Hook behavior (return shape: `{ categories, events, statusOverride, loading, error, refetch }`) must not change — only its name and file location change.

---

### Task 1: Rename `useAdminData` to `useCalendarData`

**Files:**
- Create: `src/hooks/useCalendarData.ts`
- Create: `src/hooks/__tests__/useCalendarData.test.ts`
- Modify: `src/admin/AdminApp.tsx:3` (import line)
- Delete: `src/hooks/useAdminData.ts`
- Delete: `src/hooks/__tests__/useAdminData.test.ts`

**Interfaces:**
- Produces: `useCalendarData(): { categories: Category[]; events: CalendarEvent[]; statusOverride: StatusOverride | null; loading: boolean; error: string | null; refetch: () => void }` — identical shape to the old `useAdminData`, just renamed. `Task 2` consumes this from `App.tsx`.

This is a pure rename — the hook's internal logic does not change. Do this in one pass: create the new files with the renamed identifier, delete the old files, update the one consumer, then verify tests pass.

- [ ] **Step 1: Create the renamed hook file**

Create `src/hooks/useCalendarData.ts` with this exact content (identical to the current `src/hooks/useAdminData.ts`, with the function renamed):

```ts
// src/hooks/useCalendarData.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapCategoryRow, mapEventRow, mapStatusOverrideRow } from '../lib/mappers';
import type { Category, CalendarEvent, StatusOverride } from '../types';

interface CalendarData {
  categories: Category[];
  events: CalendarEvent[];
  statusOverride: StatusOverride | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCalendarData(): CalendarData {
  const [categories, setCategories] = useState<Category[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [statusOverride, setStatusOverride] = useState<StatusOverride | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  const refetch = useCallback(() => setVersion((v) => v + 1), []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      const [categoriesRes, eventsRes, overrideRes] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('events').select('*'),
        supabase
          .from('status_override')
          .select('*')
          .gte('ends_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1),
      ]);

      if (cancelled) return;

      const firstError = categoriesRes.error ?? eventsRes.error ?? overrideRes.error;
      if (firstError) {
        setError(firstError.message);
        setLoading(false);
        return;
      }

      setCategories((categoriesRes.data ?? []).map(mapCategoryRow));
      setEvents((eventsRes.data ?? []).map(mapEventRow));
      const overrideRows = overrideRes.data ?? [];
      setStatusOverride(overrideRows.length > 0 ? mapStatusOverrideRow(overrideRows[0]) : null);
      setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [version]);

  return { categories, events, statusOverride, loading, error, refetch };
}
```

- [ ] **Step 2: Create the renamed test file**

Create `src/hooks/__tests__/useCalendarData.test.ts` with this exact content (identical to the current `src/hooks/__tests__/useAdminData.test.ts`, with the import and describe/renderHook calls updated):

```ts
// src/hooks/__tests__/useCalendarData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCalendarData } from '../useCalendarData';
import { supabase } from '../../lib/supabaseClient';

vi.mock('../../lib/supabaseClient', () => ({
  supabase: { from: vi.fn() },
}));

function chainResolving(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.select = vi.fn().mockReturnValue(chain);
  chain.gte = vi.fn().mockReturnValue(chain);
  chain.order = vi.fn().mockReturnValue(chain);
  chain.limit = vi.fn().mockResolvedValue(result);
  // categories/events resolve directly off .select()
  chain.then = (resolve: (v: unknown) => void) => resolve(result);
  return chain;
}

beforeEach(() => {
  vi.mocked(supabase.from).mockImplementation((table: string) => {
    if (table === 'categories') {
      return chainResolving({
        data: [{ id: 'c1', name: 'Work', color: '#000', icon: null, is_busy: true }],
        error: null,
      }) as never;
    }
    if (table === 'events') {
      return chainResolving({ data: [], error: null }) as never;
    }
    return chainResolving({ data: [], error: null }) as never;
  });
});

describe('useCalendarData', () => {
  it('loads categories, events, and the active status override', async () => {
    const { result } = renderHook(() => useCalendarData());
    expect(result.current.loading).toBe(true);

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.categories).toEqual([
      { id: 'c1', name: 'Work', color: '#000', icon: undefined, isBusy: true },
    ]);
    expect(result.current.events).toEqual([]);
    expect(result.current.statusOverride).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
```

- [ ] **Step 3: Delete the old hook and test files**

```bash
rm src/hooks/useAdminData.ts src/hooks/__tests__/useAdminData.test.ts
```

- [ ] **Step 4: Update `AdminApp.tsx` to import the renamed hook**

In `src/admin/AdminApp.tsx`, change line 3 from:

```ts
import { useAdminData } from '../hooks/useAdminData';
```

to:

```ts
import { useCalendarData } from '../hooks/useCalendarData';
```

And update the one call site (currently `const { categories, events, statusOverride, loading, error, refetch } = useAdminData();`) to call `useCalendarData()` instead:

```ts
const { categories, events, statusOverride, loading, error, refetch } = useCalendarData();
```

- [ ] **Step 5: Update the existing mock in `AdminApp.test.tsx`**

`src/admin/__tests__/AdminApp.test.tsx` currently does `vi.spyOn(useAdminDataModule, 'useAdminData')` against `import * as useAdminDataModule from '../../hooks/useAdminData'`. Update the import and every `vi.spyOn`/`mockReturnValue` call in that file to reference `useCalendarDataModule` / `../../hooks/useCalendarData` / `useCalendarData` instead of the old names. There are 3 occurrences of `useAdminDataModule.useAdminData` mocked in that file (in the `beforeEach` and two of the `it` blocks) — rename all of them the same way.

- [ ] **Step 6: Run the full test suite**

Run: `npm test`
Expected: All tests pass, with no references to `useAdminData` remaining. (One pre-existing unrelated failure may appear: `AdminApp.test.tsx`'s "opens EventForm pre-filled when a calendar event is clicked" test fails due to a stale hardcoded event date — this is a known, pre-existing issue unrelated to this change; do not fix it as part of this task.)

- [ ] **Step 7: Confirm no remaining references to the old name**

Run: `grep -rn "useAdminData" src/`
Expected: No output (empty).

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useCalendarData.ts src/hooks/__tests__/useCalendarData.test.ts src/admin/AdminApp.tsx src/admin/__tests__/AdminApp.test.tsx
git rm src/hooks/useAdminData.ts src/hooks/__tests__/useAdminData.test.ts
git commit -m "refactor: rename useAdminData to useCalendarData for reuse on the public page"
```

---

### Task 2: Wire the public page to live data

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/__tests__/App.test.tsx`
- Delete: `src/mock/events.ts`
- Delete: `src/mock/categories.ts`
- Delete: `src/mock/statusOverride.ts`

**Interfaces:**
- Consumes: `useCalendarData()` from `src/hooks/useCalendarData.ts` (produced in Task 1) — `{ categories, events, statusOverride, loading, error }`.
- Consumes: `deriveStatus(events, categories, statusOverride, now)` from `src/lib/status.ts` (existing, unchanged).

- [ ] **Step 1: Write the failing test for live-data rendering**

Replace the contents of `src/__tests__/App.test.tsx` with:

```tsx
// src/__tests__/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import * as useCalendarDataModule from '../hooks/useCalendarData';
import type { Category, CalendarEvent } from '../types';

const category: Category = {
  id: 'cat-1',
  name: 'Work',
  color: '#292524',
  isBusy: true,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the status hero and hub links with no events scheduled', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Right now')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders a live event from Supabase data', () => {
    const event: CalendarEvent = {
      id: 'event-1',
      title: 'Standup meeting',
      categoryId: 'cat-1',
      startAt: new Date(Date.now() - 60_000).toISOString(),
      endAt: new Date(Date.now() + 60_000).toISOString(),
      isRecurring: false,
    };
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [category],
      events: [event],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Standup meeting')).toBeInTheDocument();
  });

  it('shows a loading state while data is being fetched', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: false,
      error: 'Failed to load',
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/App.test.tsx`
Expected: FAIL — `useCalendarData` does not exist on the `useCalendarData` module import from `App.tsx`'s perspective yet (the mock target `../hooks/useCalendarData` exists from Task 1, but `App.tsx` doesn't call it yet, so `StatusHero`/`CalendarTabs` still render mock data, not the mocked event/loading/error states).

- [ ] **Step 3: Rewrite `App.tsx` to use live data**

Replace the entire contents of `src/App.tsx` with:

```tsx
import { useCalendarData } from './hooks/useCalendarData';
import { mockHubLinks } from './mock/hubLinks';
import { deriveStatus } from './lib/status';
import { Sidebar } from './components/Sidebar';
import { StatusHero } from './components/StatusHero';
import { CalendarTabs } from './components/CalendarTabs';

function App() {
  const { categories, events, statusOverride, loading, error } = useCalendarData();
  const status = deriveStatus(events, categories, statusOverride, new Date());

  return (
    <div className="flex min-h-screen flex-col bg-cream sm:flex-row">
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        {loading && <p className="text-sm text-stone-500">Loading…</p>}
        {error && <p className="text-sm text-terracotta">{error}</p>}
        {!loading && !error && (
          <>
            <StatusHero status={status} />
            <div className="mt-6">
              <CalendarTabs events={events} categories={categories} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/App.test.tsx`
Expected: PASS (all 4 tests)

- [ ] **Step 5: Delete the now-unused mock data files**

```bash
rm src/mock/events.ts src/mock/categories.ts src/mock/statusOverride.ts
```

- [ ] **Step 6: Confirm nothing else references the deleted files**

Run: `grep -rn "mock/events\|mock/categories\|mock/statusOverride" src/`
Expected: No output (empty). (`src/mock/hubLinks.ts` is untouched and still imported by `App.tsx`.)

- [ ] **Step 7: Run the full test suite**

Run: `npm test`
Expected: All tests pass except the one pre-existing unrelated failure noted in Task 1 Step 6.

- [ ] **Step 8: Build**

Run: `npm run build`
Expected: Build succeeds with no TypeScript errors, no references to deleted mock files.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx
git rm src/mock/events.ts src/mock/categories.ts src/mock/statusOverride.ts
git commit -m "feat: render live Supabase data on the public page instead of mock fixtures"
```
