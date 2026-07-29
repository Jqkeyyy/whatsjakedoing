# Phase 1: Calendar UI with Static/Mock Data — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "What's Jake Doing" calendar UI end to end against static/mock data — no backend yet — matching the Warm & Playful design approved in the spec.

**Architecture:** A Vite + React + TypeScript SPA. Pure logic (recurrence expansion, status derivation, date/time formatting) lives in `src/lib/` and is unit-tested with Vitest. Presentational pieces live in `src/components/` and are tested with React Testing Library. `src/App.tsx` composes everything against data from `src/mock/`. This structure is designed so Phase 2 can swap `src/mock/*` for real Supabase reads without touching `src/lib/` or `src/components/`.

**Tech Stack:** React 18, TypeScript, Vite, Tailwind CSS, Vitest, @testing-library/react.

**Scope note:** This plan covers **Build Phase 1 only** (static/mock-data calendar UI), per `docs/superpowers/specs/2026-07-28-whats-jake-doing-design.md`. Supabase integration, password-gated admin editing, and deployment are separate plans written after this phase is reviewed.

## Global Constraints

- Design tokens (from the spec): background `#FFFBEB` (cream), text/border `#292524` (ink), primary accent `#9A3412`/`#C2410C` (terracotta), secondary accent `#059669` (sage), tertiary accent `#D97706` (gold).
- Typography: **Calistoga** (display/headings) + **Inter** (body/UI), loaded via Google Fonts.
- Card style: `2px` ink border + a flat offset shadow (`4px 4px 0 #292524`) — the "hand-drawn" look from the approved mockup.
- Times render in the **viewer's local browser timezone** (no explicit `timeZone` override in any `Intl.DateTimeFormat` call) — do not hardcode a timezone anywhere in this phase.
- Recurrence is expanded on the fly for a given date range; recurring events are never materialized as individual stored rows (matches the spec's v1 recurrence scope — whole-series only, no per-instance exceptions).
- Sidebar stacks above the main content on mobile (simple responsive stacking); a hamburger/drawer toggle is explicitly out of scope for this phase (YAGNI — add only if the stacked layout proves insufficient).

---

### Task 1: Project scaffold (Vite + React + TS + Tailwind + Vitest)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `vite.config.ts`
- Create: `postcss.config.js`
- Create: `tailwind.config.js`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/App.tsx` (placeholder, replaced in Task 13)
- Create: `src/index.css`
- Create: `src/vite-env.d.ts`
- Create: `src/test/setup.ts`

**Interfaces:**
- Produces: Tailwind theme tokens `cream`, `ink`, `terracotta` (with `terracotta.light`), `sage`, `gold`; `fontFamily.display` (Calistoga), `fontFamily.sans` (Inter, set as default sans); `boxShadow.offset`. All later tasks' Tailwind classes (`bg-cream`, `border-ink`, `text-terracotta`, `font-display`, `shadow-offset`) depend on this.
- Produces: Vitest configured with `environment: 'jsdom'`, `globals: true`, and a setup file that registers `@testing-library/jest-dom` matchers — all later component test tasks depend on this.

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "whats-jake-doing",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.3",
    "autoprefixer": "^10.4.20",
    "jsdom": "^25.0.1",
    "postcss": "^8.4.47",
    "tailwindcss": "^3.4.14",
    "typescript": "^5.6.3",
    "vite": "^5.4.10",
    "vitest": "^2.1.4"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json` and `tsconfig.node.json`**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

`tsconfig.node.json`:

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 3: Create `vite.config.ts`, `postcss.config.js`, `tailwind.config.js`**

`vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

`postcss.config.js`:

```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        cream: '#FFFBEB',
        ink: '#292524',
        terracotta: { DEFAULT: '#9A3412', light: '#C2410C' },
        sage: '#059669',
        gold: '#D97706',
      },
      fontFamily: {
        display: ['Calistoga', 'serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        offset: '4px 4px 0 #292524',
      },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>What's Jake Doing</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Calistoga&family=Inter:wght@400;500;600;700&display=swap"
      rel="stylesheet"
    />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/main.tsx`, `src/index.css`, `src/vite-env.d.ts`, `src/test/setup.ts`**

`src/main.tsx`:

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
}
```

`src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />
```

`src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';
```

- [ ] **Step 6: Create a placeholder `src/App.tsx`**

This gets fully replaced in Task 13. It exists now only so the project builds.

```tsx
function App() {
  return <div>Loading…</div>;
}

export default App;
```

- [ ] **Step 7: Install dependencies**

Run: `npm install`
Expected: installs without error, creates `node_modules/` and `package-lock.json`.

- [ ] **Step 8: Verify the project builds**

Run: `npm run build`
Expected: exits 0, produces a `dist/` folder.

- [ ] **Step 9: Commit**

```bash
git add package.json package-lock.json tsconfig.json tsconfig.node.json vite.config.ts postcss.config.js tailwind.config.js index.html src
git commit -m "chore: scaffold Vite + React + TS + Tailwind + Vitest project"
```

---

### Task 2: Core types + mock data

**Files:**
- Create: `src/types.ts`
- Create: `src/mock/categories.ts`
- Create: `src/mock/events.ts`
- Create: `src/mock/hubLinks.ts`
- Create: `src/mock/statusOverride.ts`

**Interfaces:**
- Consumes: nothing (first domain code in the project).
- Produces: `Category`, `RecurrenceRule`, `CalendarEvent`, `StatusOverride`, `HubLink` types, and `mockCategories`, `mockEvents`, `mockHubLinks`, `mockStatusOverride` values — every later task imports from `src/types.ts` and most import the mock data.

- [ ] **Step 1: Create `src/types.ts`**

```ts
export interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon?: string;
  isBusy: boolean;
}

export interface RecurrenceRule {
  freq: 'daily' | 'weekly';
  daysOfWeek?: number[]; // 0=Sunday..6=Saturday, required when freq is 'weekly'
  until: string; // ISO date (YYYY-MM-DD), inclusive end of recurrence
}

export interface CalendarEvent {
  id: string;
  title: string;
  categoryId: string;
  location?: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  isRecurring: boolean;
  recurrence?: RecurrenceRule;
}

export interface StatusOverride {
  id: string;
  statusText?: string;
  isBusy: boolean;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
}

export interface HubLink {
  id: string;
  label: string;
  url: string;
}
```

- [ ] **Step 2: Create `src/mock/categories.ts`**

```ts
import type { Category } from '../types';

export const mockCategories: Category[] = [
  { id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true },
  { id: 'cat-school', name: 'School', color: '#C2410C', isBusy: true },
  { id: 'cat-summit', name: 'Summit Moving', color: '#D97706', isBusy: true },
  { id: 'cat-sass', name: 'Sass Web Design', color: '#B45309', isBusy: true },
  { id: 'cat-free', name: 'Free time', color: '#059669', isBusy: false },
  { id: 'cat-sleep', name: 'Sleep', color: '#292524', isBusy: true },
];
```

- [ ] **Step 3: Create `src/mock/events.ts`**

These events are generated relative to "today" (module load time) so the dev demo always shows something plausible regardless of when it's run. This is intentionally different from the deterministic, hardcoded fixtures used in unit tests (Tasks 3-5).

```ts
import type { CalendarEvent } from '../types';

function isoAtHour(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoDateOnly(daysFromToday: number): string {
  return isoAtHour(daysFromToday, 0).slice(0, 10);
}

export const mockEvents: CalendarEvent[] = [
  {
    id: 'evt-work-today',
    title: 'Client work',
    categoryId: 'cat-work',
    startAt: isoAtHour(0, 9),
    endAt: isoAtHour(0, 12),
    isRecurring: false,
  },
  {
    id: 'evt-sass-today',
    title: 'Sass Web Design',
    categoryId: 'cat-sass',
    location: 'Home office',
    startAt: isoAtHour(0, 14),
    endAt: isoAtHour(0, 17),
    isRecurring: false,
  },
  {
    id: 'evt-summit-tomorrow',
    title: 'Moving job',
    categoryId: 'cat-summit',
    location: 'Denver, CO',
    startAt: isoAtHour(1, 8),
    endAt: isoAtHour(1, 13),
    isRecurring: false,
  },
  {
    id: 'evt-sleep-nightly',
    title: 'Sleep',
    categoryId: 'cat-sleep',
    startAt: isoAtHour(0, 23),
    endAt: isoAtHour(1, 7),
    isRecurring: true,
    recurrence: {
      freq: 'daily',
      until: isoDateOnly(60),
    },
  },
  {
    id: 'evt-school-weekly',
    title: 'Class',
    categoryId: 'cat-school',
    startAt: isoAtHour(0, 18),
    endAt: isoAtHour(0, 20),
    isRecurring: true,
    recurrence: {
      freq: 'weekly',
      daysOfWeek: [1, 3],
      until: isoDateOnly(60),
    },
  },
];
```

- [ ] **Step 4: Create `src/mock/hubLinks.ts`**

URLs are intentionally provisional (`example.com`) — real URLs are wired up in Build Phase 4 per the spec. This is application data, not a code placeholder.

```ts
import type { HubLink } from '../types';

export const mockHubLinks: HubLink[] = [
  { id: 'link-portfolio', label: 'Portfolio', url: 'https://example.com/portfolio' },
  { id: 'link-sass', label: 'Sass Web Design', url: 'https://example.com/sass-web-design' },
  { id: 'link-summit', label: 'Summit Moving and Junk Removal', url: 'https://example.com/summit-moving' },
  { id: 'link-email', label: 'Email', url: 'mailto:jake@example.com' },
  { id: 'link-instagram', label: 'Instagram', url: 'https://instagram.com/example' },
  { id: 'link-linkedin', label: 'LinkedIn', url: 'https://linkedin.com/in/example' },
];
```

- [ ] **Step 5: Create `src/mock/statusOverride.ts`**

`null` by default so the demo reflects real event-derived status out of the box.

```ts
import type { StatusOverride } from '../types';

export const mockStatusOverride: StatusOverride | null = null;
```

- [ ] **Step 6: Verify types compile**

Run: `npx tsc --noEmit`
Expected: exits 0, no type errors.

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/mock
git commit -m "feat: add core types and mock data"
```

---

### Task 3: Recurrence expansion logic

**Files:**
- Create: `src/lib/recurrence.ts`
- Test: `src/lib/__tests__/recurrence.test.ts`

**Interfaces:**
- Consumes: `CalendarEvent` from `src/types.ts`.
- Produces: `expandRecurringEvents(event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[]` and `expandAllEvents(events: CalendarEvent[], rangeStart: Date, rangeEnd: Date): CalendarEvent[]` — Task 11 (`CalendarTabs`) depends on `expandAllEvents`.

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/recurrence.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { expandRecurringEvents } from '../recurrence';
import type { CalendarEvent } from '../../types';

describe('expandRecurringEvents', () => {
  it('returns a non-recurring event unchanged when it overlaps the range', () => {
    const event: CalendarEvent = {
      id: 'evt-1',
      title: 'One-off',
      categoryId: 'cat-work',
      startAt: '2026-07-28T09:00:00',
      endAt: '2026-07-28T10:00:00',
      isRecurring: false,
    };
    const result = expandRecurringEvents(
      event,
      new Date('2026-07-28T00:00:00'),
      new Date('2026-07-29T00:00:00')
    );
    expect(result).toEqual([event]);
  });

  it('excludes a non-recurring event outside the range', () => {
    const event: CalendarEvent = {
      id: 'evt-1',
      title: 'One-off',
      categoryId: 'cat-work',
      startAt: '2026-07-28T09:00:00',
      endAt: '2026-07-28T10:00:00',
      isRecurring: false,
    };
    const result = expandRecurringEvents(
      event,
      new Date('2026-08-01T00:00:00'),
      new Date('2026-08-02T00:00:00')
    );
    expect(result).toEqual([]);
  });

  it('expands a daily recurring event into one instance per day in range', () => {
    const event: CalendarEvent = {
      id: 'evt-sleep',
      title: 'Sleep',
      categoryId: 'cat-sleep',
      startAt: '2026-07-01T23:00:00',
      endAt: '2026-07-02T07:00:00',
      isRecurring: true,
      recurrence: { freq: 'daily', until: '2026-12-31' },
    };
    const result = expandRecurringEvents(
      event,
      new Date('2026-07-10T00:00:00'),
      new Date('2026-07-12T23:59:59')
    );
    expect(result).toHaveLength(3);
    const firstStart = new Date(result[0].startAt);
    const firstEnd = new Date(result[0].endAt);
    expect([firstStart.getMonth(), firstStart.getDate(), firstStart.getHours(), firstStart.getMinutes()]).toEqual([
      6, 10, 23, 0,
    ]);
    expect([firstEnd.getMonth(), firstEnd.getDate(), firstEnd.getHours(), firstEnd.getMinutes()]).toEqual([
      6, 11, 7, 0,
    ]);
    expect(result[0].id).not.toBe(event.id);
  });

  it('expands a weekly recurring event only on matching days', () => {
    const event: CalendarEvent = {
      id: 'evt-class',
      title: 'Class',
      categoryId: 'cat-school',
      startAt: '2026-07-01T18:00:00',
      endAt: '2026-07-01T20:00:00',
      isRecurring: true,
      recurrence: { freq: 'weekly', daysOfWeek: [1, 3], until: '2026-12-31' },
    };
    // 2026-07-13 is a Monday; range covers a full Sun-Sat week
    const result = expandRecurringEvents(
      event,
      new Date('2026-07-13T00:00:00'),
      new Date('2026-07-19T23:59:59')
    );
    const days = result.map((e) => new Date(e.startAt).getDay());
    expect(days).toEqual([1, 3]);
  });

  it('stops generating instances after the until date', () => {
    const event: CalendarEvent = {
      id: 'evt-limited',
      title: 'Limited',
      categoryId: 'cat-work',
      startAt: '2026-07-01T09:00:00',
      endAt: '2026-07-01T10:00:00',
      isRecurring: true,
      recurrence: { freq: 'daily', until: '2026-07-15' },
    };
    const result = expandRecurringEvents(
      event,
      new Date('2026-07-14T00:00:00'),
      new Date('2026-07-17T23:59:59')
    );
    expect(result).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/__tests__/recurrence.test.ts`
Expected: FAIL — `src/lib/recurrence.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/recurrence.ts`**

```ts
import type { CalendarEvent } from '../types';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function expandRecurringEvents(
  event: CalendarEvent,
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  if (!event.isRecurring || !event.recurrence) {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return end >= rangeStart && start <= rangeEnd ? [event] : [];
  }

  const { freq, daysOfWeek, until } = event.recurrence;
  const untilDate = new Date(`${until}T23:59:59.999`);
  const effectiveEnd = untilDate < rangeEnd ? untilDate : rangeEnd;

  const originalStart = new Date(event.startAt);
  const durationMs = new Date(event.endAt).getTime() - originalStart.getTime();

  const instances: CalendarEvent[] = [];
  const cursor = new Date(rangeStart);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= effectiveEnd) {
    const matchesDay =
      freq === 'daily' || (freq === 'weekly' && (daysOfWeek ?? []).includes(cursor.getDay()));

    if (matchesDay) {
      const instanceStart = new Date(cursor);
      instanceStart.setHours(
        originalStart.getHours(),
        originalStart.getMinutes(),
        originalStart.getSeconds(),
        0
      );
      const instanceEnd = new Date(instanceStart.getTime() + durationMs);

      if (instanceEnd >= rangeStart && instanceStart <= rangeEnd) {
        instances.push({
          ...event,
          id: `${event.id}__${instanceStart.toISOString().slice(0, 10)}`,
          startAt: instanceStart.toISOString(),
          endAt: instanceEnd.toISOString(),
        });
      }
    }

    cursor.setTime(cursor.getTime() + MS_PER_DAY);
  }

  return instances;
}

export function expandAllEvents(
  events: CalendarEvent[],
  rangeStart: Date,
  rangeEnd: Date
): CalendarEvent[] {
  return events.flatMap((event) => expandRecurringEvents(event, rangeStart, rangeEnd));
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/__tests__/recurrence.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/recurrence.ts src/lib/__tests__/recurrence.test.ts
git commit -m "feat: add recurrence expansion logic"
```

---

### Task 4: Status derivation logic

**Files:**
- Create: `src/lib/status.ts`
- Test: `src/lib/__tests__/status.test.ts`

**Interfaces:**
- Consumes: `CalendarEvent`, `Category`, `StatusOverride` from `src/types.ts`. Expects `events` to already be the expanded/current-range instances (caller's responsibility — see Task 11).
- Produces: `StatusResult` (`{ label: string; isBusy: boolean; source: 'override' | 'event' | 'default' }`) and `deriveStatus(events, categories, override, now): StatusResult` — Task 7 (`StatusHero`) consumes the `StatusResult` type, Task 13 (`App`) calls `deriveStatus`.

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/status.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deriveStatus } from '../status';
import type { CalendarEvent, Category, StatusOverride } from '../../types';

const categories: Category[] = [
  { id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true },
  { id: 'cat-free', name: 'Free time', color: '#059669', isBusy: false },
];

const now = new Date('2026-07-28T15:00:00.000Z');

describe('deriveStatus', () => {
  it('returns free by default when nothing is scheduled', () => {
    const result = deriveStatus([], categories, null, now);
    expect(result).toEqual({ label: 'Free', isBusy: false, source: 'default' });
  });

  it('derives status from an active event via its category', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Client work',
        categoryId: 'cat-work',
        startAt: '2026-07-28T14:00:00.000Z',
        endAt: '2026-07-28T16:00:00.000Z',
        isRecurring: false,
      },
    ];
    const result = deriveStatus(events, categories, null, now);
    expect(result).toEqual({ label: 'Client work', isBusy: true, source: 'event' });
  });

  it('ignores events that are not currently active', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Later today',
        categoryId: 'cat-work',
        startAt: '2026-07-28T20:00:00.000Z',
        endAt: '2026-07-28T21:00:00.000Z',
        isRecurring: false,
      },
    ];
    const result = deriveStatus(events, categories, null, now);
    expect(result.source).toBe('default');
  });

  it('prefers an active manual override over an active event', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Client work',
        categoryId: 'cat-work',
        startAt: '2026-07-28T14:00:00.000Z',
        endAt: '2026-07-28T16:00:00.000Z',
        isRecurring: false,
      },
    ];
    const override: StatusOverride = {
      id: 'ovr-1',
      statusText: 'Driving',
      isBusy: true,
      startsAt: '2026-07-28T14:30:00.000Z',
      endsAt: '2026-07-28T15:30:00.000Z',
    };
    const result = deriveStatus(events, categories, override, now);
    expect(result).toEqual({ label: 'Driving', isBusy: true, source: 'override' });
  });

  it('falls through to event/default once the override has expired', () => {
    const override: StatusOverride = {
      id: 'ovr-1',
      statusText: 'Driving',
      isBusy: true,
      startsAt: '2026-07-28T10:00:00.000Z',
      endsAt: '2026-07-28T11:00:00.000Z',
    };
    const result = deriveStatus([], categories, override, now);
    expect(result.source).toBe('default');
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/__tests__/status.test.ts`
Expected: FAIL — `src/lib/status.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/status.ts`**

```ts
import type { CalendarEvent, Category, StatusOverride } from '../types';

export interface StatusResult {
  label: string;
  isBusy: boolean;
  source: 'override' | 'event' | 'default';
}

export function deriveStatus(
  events: CalendarEvent[],
  categories: Category[],
  override: StatusOverride | null,
  now: Date
): StatusResult {
  if (override) {
    const start = new Date(override.startsAt);
    const end = new Date(override.endsAt);
    if (now >= start && now <= end) {
      return {
        label: override.statusText ?? (override.isBusy ? 'Busy' : 'Free'),
        isBusy: override.isBusy,
        source: 'override',
      };
    }
  }

  const activeEvent = events.find((event) => {
    const start = new Date(event.startAt);
    const end = new Date(event.endAt);
    return now >= start && now <= end;
  });

  if (activeEvent) {
    const category = categories.find((c) => c.id === activeEvent.categoryId);
    return {
      label: activeEvent.title,
      isBusy: category?.isBusy ?? true,
      source: 'event',
    };
  }

  return { label: 'Free', isBusy: false, source: 'default' };
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/__tests__/status.test.ts`
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/status.ts src/lib/__tests__/status.test.ts
git commit -m "feat: add right-now status derivation logic"
```

---

### Task 5: Date/time helper functions

**Files:**
- Create: `src/lib/datetime.ts`
- Test: `src/lib/__tests__/datetime.test.ts`

**Interfaces:**
- Consumes: nothing beyond the built-in `Date`/`Intl` APIs.
- Produces: `isSameDay(a: Date, b: Date): boolean`, `formatTimeRange(startIso: string, endIso: string): string`, `formatDayHeading(date: Date): string`, `formatWeekdayLabel(date: Date): string`, `getWeekDays(date: Date): Date[]` (7 entries, Sunday-first), `getMonthGrid(date: Date): Date[][]` (array of 7-day weeks covering the full month). Tasks 6, 8, 9, 10, 11 all import from this file.

- [ ] **Step 1: Write the failing tests**

`src/lib/__tests__/datetime.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  isSameDay,
  formatTimeRange,
  formatDayHeading,
  formatWeekdayLabel,
  getWeekDays,
  getMonthGrid,
} from '../datetime';

describe('isSameDay', () => {
  it('returns true for the same calendar day', () => {
    expect(isSameDay(new Date('2026-07-28T01:00:00'), new Date('2026-07-28T23:00:00'))).toBe(true);
  });

  it('returns false for different days', () => {
    expect(isSameDay(new Date('2026-07-28T23:59:00'), new Date('2026-07-29T00:01:00'))).toBe(false);
  });
});

describe('formatTimeRange', () => {
  it('formats a start and end time as a readable range', () => {
    const result = formatTimeRange('2026-07-28T09:00:00', '2026-07-28T12:30:00');
    expect(result).toBe('9:00 AM – 12:30 PM');
  });
});

describe('formatDayHeading', () => {
  it('formats a full weekday, month, and day', () => {
    expect(formatDayHeading(new Date('2026-07-28T00:00:00'))).toBe('Tuesday, July 28');
  });
});

describe('formatWeekdayLabel', () => {
  it('formats a short weekday abbreviation with the day number', () => {
    expect(formatWeekdayLabel(new Date('2026-07-28T00:00:00'))).toBe('Tue 28');
  });
});

describe('getWeekDays', () => {
  it('returns 7 days starting on Sunday and containing the given date', () => {
    const week = getWeekDays(new Date('2026-07-28T00:00:00'));
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(0);
    expect(week[6].getDay()).toBe(6);
    expect(week.some((d) => isSameDay(d, new Date('2026-07-28T00:00:00')))).toBe(true);
  });
});

describe('getMonthGrid', () => {
  it('returns full 7-day weeks covering the entire month', () => {
    const grid = getMonthGrid(new Date('2026-07-15T00:00:00'));
    const allDays = grid.flat();
    expect(allDays.length % 7).toBe(0);
    expect(allDays.some((d) => isSameDay(d, new Date('2026-07-01T00:00:00')))).toBe(true);
    expect(allDays.some((d) => isSameDay(d, new Date('2026-07-31T00:00:00')))).toBe(true);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/__tests__/datetime.test.ts`
Expected: FAIL — `src/lib/datetime.ts` does not exist yet.

- [ ] **Step 3: Implement `src/lib/datetime.ts`**

```ts
export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function formatTimeRange(startIso: string, endIso: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
  return `${formatter.format(new Date(startIso))} – ${formatter.format(new Date(endIso))}`;
}

export function formatDayHeading(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

export function formatWeekdayLabel(date: Date): string {
  const weekday = new Intl.DateTimeFormat('en-US', { weekday: 'short' }).format(date);
  return `${weekday} ${date.getDate()}`;
}

export function getWeekDays(date: Date): Date[] {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - start.getDay());
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function getMonthGrid(date: Date): Date[][] {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());

  const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  const gridEnd = new Date(lastOfMonth);
  gridEnd.setDate(gridEnd.getDate() + (6 - gridEnd.getDay()));

  const weeks: Date[][] = [];
  const cursor = new Date(gridStart);
  while (cursor <= gridEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      week.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    weeks.push(week);
  }
  return weeks;
}
```

Note: `formatTimeRange`/`formatDayHeading`/`formatWeekdayLabel` fix the **locale** to `'en-US'` for deterministic text formatting across machines, but deliberately omit any `timeZone` option so the actual time conversion still follows the viewer's local system timezone, per the Global Constraints above.

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/__tests__/datetime.test.ts`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/lib/datetime.ts src/lib/__tests__/datetime.test.ts
git commit -m "feat: add date/time formatting and range helpers"
```

---

### Task 6: `CategoryDot` and `EventCard` components

**Files:**
- Create: `src/components/CategoryDot.tsx`
- Create: `src/components/EventCard.tsx`
- Test: `src/components/__tests__/CategoryDot.test.tsx`
- Test: `src/components/__tests__/EventCard.test.tsx`

**Interfaces:**
- Consumes: `formatTimeRange` from `src/lib/datetime.ts`; `CalendarEvent`, `Category` from `src/types.ts`.
- Produces: `<CategoryDot color: string, label?: string />` and `<EventCard event: CalendarEvent, category: Category | undefined />` — Tasks 8, 9, 10 use `CategoryDot`; Task 8 (`DayView`) uses `EventCard`.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/CategoryDot.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CategoryDot } from '../CategoryDot';

describe('CategoryDot', () => {
  it('renders a colored dot with the given color', () => {
    const { container } = render(<CategoryDot color="#9A3412" />);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toHaveStyle({ backgroundColor: '#9A3412' });
  });

  it('renders the label when provided', () => {
    render(<CategoryDot color="#9A3412" label="Work" />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });
});
```

`src/components/__tests__/EventCard.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';
import type { CalendarEvent, Category } from '../../types';

const category: Category = { id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true };
const event: CalendarEvent = {
  id: 'evt-1',
  title: 'Client work',
  categoryId: 'cat-work',
  location: 'Home office',
  startAt: '2026-07-28T09:00:00',
  endAt: '2026-07-28T12:00:00',
  isRecurring: false,
};

describe('EventCard', () => {
  it('renders the event title, category, time, and location', () => {
    render(<EventCard event={event} category={category} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Home office')).toBeInTheDocument();
  });

  it('omits the location line when the event has none', () => {
    const noLocation = { ...event, location: undefined };
    render(<EventCard event={noLocation} category={category} />);
    expect(screen.queryByText('Home office')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/CategoryDot.test.tsx src/components/__tests__/EventCard.test.tsx`
Expected: FAIL — neither component exists yet.

- [ ] **Step 3: Implement `src/components/CategoryDot.tsx`**

```tsx
interface CategoryDotProps {
  color: string;
  label?: string;
}

export function CategoryDot({ color, label }: CategoryDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="h-2.5 w-2.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      {label && <span className="text-sm">{label}</span>}
    </span>
  );
}
```

- [ ] **Step 4: Implement `src/components/EventCard.tsx`**

```tsx
import type { CalendarEvent, Category } from '../types';
import { formatTimeRange } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface EventCardProps {
  event: CalendarEvent;
  category: Category | undefined;
}

export function EventCard({ event, category }: EventCardProps) {
  return (
    <div className="rounded-xl border-2 border-ink bg-white p-3 shadow-offset">
      <div className="flex items-center justify-between">
        <span className="font-display text-ink">{event.title}</span>
        <CategoryDot color={category?.color ?? '#292524'} label={category?.name} />
      </div>
      <p className="mt-1 text-sm text-stone-600">{formatTimeRange(event.startAt, event.endAt)}</p>
      {event.location && <p className="mt-0.5 text-xs text-stone-500">{event.location}</p>}
    </div>
  );
}
```

- [ ] **Step 5: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/CategoryDot.test.tsx src/components/__tests__/EventCard.test.tsx`
Expected: PASS (4 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/CategoryDot.tsx src/components/EventCard.tsx src/components/__tests__/CategoryDot.test.tsx src/components/__tests__/EventCard.test.tsx
git commit -m "feat: add CategoryDot and EventCard components"
```

---

### Task 7: `StatusHero` component

**Files:**
- Create: `src/components/StatusHero.tsx`
- Test: `src/components/__tests__/StatusHero.test.tsx`

**Interfaces:**
- Consumes: `StatusResult` type from `src/lib/status.ts`.
- Produces: `<StatusHero status: StatusResult />` — Task 13 (`App`) renders this with the output of `deriveStatus`.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/StatusHero.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusHero } from '../StatusHero';

describe('StatusHero', () => {
  it('shows the status label and a Free badge when not busy', () => {
    render(<StatusHero status={{ label: 'Reading', isBusy: false, source: 'default' }} />);
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows a Busy badge when the status is busy', () => {
    render(<StatusHero status={{ label: 'Client work', isBusy: true, source: 'event' }} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
    expect(screen.getByText('Busy')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/StatusHero.test.tsx`
Expected: FAIL — `src/components/StatusHero.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/StatusHero.tsx`**

```tsx
import type { StatusResult } from '../lib/status';

interface StatusHeroProps {
  status: StatusResult;
}

export function StatusHero({ status }: StatusHeroProps) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-6 shadow-offset">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Right now</p>
      <p className="font-display mt-1 text-2xl text-terracotta">{status.label}</p>
      <p className="mt-1 text-sm text-stone-600">{status.isBusy ? 'Busy' : 'Free'}</p>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/StatusHero.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/StatusHero.tsx src/components/__tests__/StatusHero.test.tsx
git commit -m "feat: add StatusHero component"
```

---

### Task 8: `DayView` component

**Files:**
- Create: `src/components/DayView.tsx`
- Test: `src/components/__tests__/DayView.test.tsx`

**Interfaces:**
- Consumes: `formatDayHeading` from `src/lib/datetime.ts`; `EventCard` from `src/components/EventCard.tsx`; `CalendarEvent`, `Category` from `src/types.ts`. Expects `events` to already be filtered to the given day (caller's responsibility — see Task 11).
- Produces: `<DayView date: Date, events: CalendarEvent[], categories: Category[] />` — Task 11 (`CalendarTabs`) renders this for the "day" view.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/DayView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayView } from '../DayView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('DayView', () => {
  it('shows an empty state when there are no events', () => {
    render(<DayView date={new Date('2026-07-28T12:00:00')} events={[]} categories={categories} />);
    expect(screen.getByText('Nothing scheduled.')).toBeInTheDocument();
  });

  it('renders events sorted by start time', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-2',
        title: 'Afternoon block',
        categoryId: 'cat-work',
        startAt: '2026-07-28T14:00:00',
        endAt: '2026-07-28T16:00:00',
        isRecurring: false,
      },
      {
        id: 'evt-1',
        title: 'Morning block',
        categoryId: 'cat-work',
        startAt: '2026-07-28T09:00:00',
        endAt: '2026-07-28T11:00:00',
        isRecurring: false,
      },
    ];
    render(<DayView date={new Date('2026-07-28T12:00:00')} events={events} categories={categories} />);
    const titles = screen.getAllByText(/block/).map((el) => el.textContent);
    expect(titles).toEqual(['Morning block', 'Afternoon block']);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/DayView.test.tsx`
Expected: FAIL — `src/components/DayView.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/DayView.tsx`**

```tsx
import type { CalendarEvent, Category } from '../types';
import { EventCard } from './EventCard';
import { formatDayHeading } from '../lib/datetime';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
}

export function DayView({ date, events, categories }: DayViewProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return (
    <div>
      <h2 className="font-display text-lg text-ink">{formatDayHeading(date)}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {sorted.length === 0 && <p className="text-sm text-stone-500">Nothing scheduled.</p>}
        {sorted.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            category={categories.find((c) => c.id === event.categoryId)}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/DayView.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/DayView.tsx src/components/__tests__/DayView.test.tsx
git commit -m "feat: add DayView component"
```

---

### Task 9: `WeekView` component

**Files:**
- Create: `src/components/WeekView.tsx`
- Test: `src/components/__tests__/WeekView.test.tsx`

**Interfaces:**
- Consumes: `getWeekDays`, `isSameDay`, `formatTimeRange`, `formatWeekdayLabel` from `src/lib/datetime.ts`; `CategoryDot` from `src/components/CategoryDot.tsx`.
- Produces: `<WeekView date: Date, events: CalendarEvent[], categories: Category[] />` — Task 11 (`CalendarTabs`) renders this for the "week" view.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/WeekView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekView } from '../WeekView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('WeekView', () => {
  it('renders 7 day columns', () => {
    render(<WeekView date={new Date('2026-07-28T12:00:00')} events={[]} categories={categories} />);
    expect(screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/)).toHaveLength(7);
  });

  it('places an event under the correct day', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Client work',
        categoryId: 'cat-work',
        startAt: '2026-07-28T09:00:00',
        endAt: '2026-07-28T11:00:00',
        isRecurring: false,
      },
    ];
    render(<WeekView date={new Date('2026-07-28T12:00:00')} events={events} categories={categories} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/WeekView.test.tsx`
Expected: FAIL — `src/components/WeekView.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/WeekView.tsx`**

```tsx
import type { CalendarEvent, Category } from '../types';
import { getWeekDays, isSameDay, formatTimeRange, formatWeekdayLabel } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
}

export function WeekView({ date, events, categories }: WeekViewProps) {
  const days = getWeekDays(date);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((event) => isSameDay(new Date(event.startAt), day))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
          <div key={day.toISOString()} className="rounded-xl border-2 border-ink bg-white p-2">
            <p className="text-xs font-semibold uppercase text-stone-500">
              {formatWeekdayLabel(day)}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {dayEvents.map((event) => {
                const category = categories.find((c) => c.id === event.categoryId);
                return (
                  <div key={event.id} className="text-xs">
                    <CategoryDot color={category?.color ?? '#292524'} />
                    <span className="ml-1">{event.title}</span>
                    <span className="ml-1 text-stone-500">
                      {formatTimeRange(event.startAt, event.endAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/WeekView.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/WeekView.tsx src/components/__tests__/WeekView.test.tsx
git commit -m "feat: add WeekView component"
```

---

### Task 10: `MonthView` component

**Files:**
- Create: `src/components/MonthView.tsx`
- Test: `src/components/__tests__/MonthView.test.tsx`

**Interfaces:**
- Consumes: `getMonthGrid`, `isSameDay` from `src/lib/datetime.ts`; `CategoryDot` from `src/components/CategoryDot.tsx`.
- Produces: `<MonthView date: Date, events: CalendarEvent[], categories: Category[] />` — Task 11 (`CalendarTabs`) renders this for the "month" view.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/MonthView.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MonthView } from '../MonthView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('MonthView', () => {
  it('renders full weeks of 7 days each', () => {
    const { container } = render(
      <MonthView date={new Date('2026-07-15T12:00:00')} events={[]} categories={categories} />
    );
    const dayCells = container.querySelectorAll('.grid > div');
    expect(dayCells.length % 7).toBe(0);
    expect(dayCells.length).toBeGreaterThan(0);
  });

  it('renders a category dot on the day an event occurs', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Client work',
        categoryId: 'cat-work',
        startAt: '2026-07-15T09:00:00',
        endAt: '2026-07-15T11:00:00',
        isRecurring: false,
      },
    ];
    const { container } = render(
      <MonthView date={new Date('2026-07-15T12:00:00')} events={events} categories={categories} />
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/MonthView.test.tsx`
Expected: FAIL — `src/components/MonthView.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/MonthView.tsx`**

```tsx
import type { CalendarEvent, Category } from '../types';
import { getMonthGrid, isSameDay } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
}

export function MonthView({ date, events, categories }: MonthViewProps) {
  const weeks = getMonthGrid(date);

  return (
    <div className="flex flex-col gap-1">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(new Date(event.startAt), day));
            const inMonth = day.getMonth() === date.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[64px] rounded-lg border border-stone-300 p-1 ${
                  inMonth ? 'bg-white' : 'bg-stone-100 text-stone-400'
                }`}
              >
                <p className="text-xs">{day.getDate()}</p>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayEvents.map((event) => {
                    const category = categories.find((c) => c.id === event.categoryId);
                    return <CategoryDot key={event.id} color={category?.color ?? '#292524'} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/MonthView.test.tsx`
Expected: PASS (2 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/MonthView.tsx src/components/__tests__/MonthView.test.tsx
git commit -m "feat: add MonthView component"
```

---

### Task 11: `CalendarTabs` component

**Files:**
- Create: `src/components/CalendarTabs.tsx`
- Test: `src/components/__tests__/CalendarTabs.test.tsx`

**Interfaces:**
- Consumes: `expandAllEvents` from `src/lib/recurrence.ts`; `getWeekDays`, `getMonthGrid` from `src/lib/datetime.ts`; `DayView`, `WeekView`, `MonthView`.
- Produces: `<CalendarTabs events: CalendarEvent[], categories: Category[], initialDate?: Date />` — Task 13 (`App`) renders this with the full (unexpanded) mock event list; this component is what filters events down to the visible range via `expandAllEvents`.

- [ ] **Step 1: Write the failing tests**

`src/components/__tests__/CalendarTabs.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarTabs } from '../CalendarTabs';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

const events: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Client work',
    categoryId: 'cat-work',
    startAt: '2026-07-28T09:00:00',
    endAt: '2026-07-28T11:00:00',
    isRecurring: false,
  },
];

describe('CalendarTabs', () => {
  it('defaults to the Day view', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    expect(screen.getByText('Client work')).toBeInTheDocument();
  });

  it('switches to Week view when the Week tab is clicked', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'week' }));
    expect(screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/).length).toBeGreaterThan(0);
  });

  it('switches to Month view when the Month tab is clicked', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'month' }));
    expect(screen.queryByText('Client work')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/components/__tests__/CalendarTabs.test.tsx`
Expected: FAIL — `src/components/CalendarTabs.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/CalendarTabs.tsx`**

```tsx
import { useMemo, useState } from 'react';
import type { CalendarEvent, Category } from '../types';
import { expandAllEvents } from '../lib/recurrence';
import { getWeekDays, getMonthGrid } from '../lib/datetime';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarTabsProps {
  events: CalendarEvent[];
  categories: Category[];
  initialDate?: Date;
}

export function CalendarTabs({ events, categories, initialDate = new Date() }: CalendarTabsProps) {
  const [view, setView] = useState<ViewMode>('day');
  const [date] = useState(initialDate);

  const rangeStart = useMemo(() => {
    if (view === 'day') return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (view === 'week') return getWeekDays(date)[0];
    return getMonthGrid(date)[0][0];
  }, [view, date]);

  const rangeEnd = useMemo(() => {
    if (view === 'day') {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    }
    if (view === 'week') return getWeekDays(date)[6];
    const grid = getMonthGrid(date);
    return grid[grid.length - 1][6];
  }, [view, date]);

  const visibleEvents = useMemo(
    () => expandAllEvents(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  );

  return (
    <div>
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold capitalize ${
              view === mode ? 'bg-terracotta text-white' : 'bg-white text-ink'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {view === 'day' && <DayView date={date} events={visibleEvents} categories={categories} />}
        {view === 'week' && <WeekView date={date} events={visibleEvents} categories={categories} />}
        {view === 'month' && <MonthView date={date} events={visibleEvents} categories={categories} />}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/components/__tests__/CalendarTabs.test.tsx`
Expected: PASS (3 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/CalendarTabs.tsx src/components/__tests__/CalendarTabs.test.tsx
git commit -m "feat: add CalendarTabs component with day/week/month switching"
```

---

### Task 12: `Sidebar` component

**Files:**
- Create: `src/components/Sidebar.tsx`
- Test: `src/components/__tests__/Sidebar.test.tsx`

**Interfaces:**
- Consumes: `HubLink` from `src/types.ts`.
- Produces: `<Sidebar bio: string, hubLinks: HubLink[] />` — Task 13 (`App`) renders this with `mockHubLinks`.

- [ ] **Step 1: Write the failing test**

`src/components/__tests__/Sidebar.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Sidebar } from '../Sidebar';
import type { HubLink } from '../../types';

const hubLinks: HubLink[] = [
  { id: 'link-portfolio', label: 'Portfolio', url: 'https://example.com/portfolio' },
];

describe('Sidebar', () => {
  it('renders the bio and hub links', () => {
    render(<Sidebar bio="Building things." hubLinks={hubLinks} />);
    expect(screen.getByText('Building things.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Portfolio' })).toHaveAttribute(
      'href',
      'https://example.com/portfolio'
    );
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/components/__tests__/Sidebar.test.tsx`
Expected: FAIL — `src/components/Sidebar.tsx` does not exist yet.

- [ ] **Step 3: Implement `src/components/Sidebar.tsx`**

Sidebar stacks above the main content on mobile (`border-b`, full width) and becomes a left rail on `sm:` and up (`border-r`, fixed width) — per the Global Constraints, no drawer/toggle interaction in this phase.

```tsx
import type { HubLink } from '../types';

interface SidebarProps {
  bio: string;
  hubLinks: HubLink[];
}

export function Sidebar({ bio, hubLinks }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4 border-b-2 border-ink bg-cream p-4 sm:w-64 sm:border-b-0 sm:border-r-2">
      <div>
        <h1 className="font-display text-xl text-ink">Jake</h1>
        <p className="mt-1 text-sm text-stone-600">{bio}</p>
      </div>
      <nav className="flex flex-col gap-2">
        {hubLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="rounded-full border-2 border-ink bg-white px-3 py-1.5 text-center text-sm font-semibold text-ink"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/components/__tests__/Sidebar.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Commit**

```bash
git add src/components/Sidebar.tsx src/components/__tests__/Sidebar.test.tsx
git commit -m "feat: add Sidebar component"
```

---

### Task 13: `App` composition

**Files:**
- Modify: `src/App.tsx` (replaces the Task 1 placeholder)
- Test: `src/__tests__/App.test.tsx`

**Interfaces:**
- Consumes: `mockCategories`, `mockEvents`, `mockHubLinks`, `mockStatusOverride` from `src/mock/*`; `deriveStatus` from `src/lib/status.ts`; `Sidebar`, `StatusHero`, `CalendarTabs`.
- Produces: the assembled page — nothing downstream depends on `App`, this is the final task with a testable deliverable (Task 14 is manual verification only).

- [ ] **Step 1: Write the failing test**

`src/__tests__/App.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App', () => {
  it('renders the status hero and hub links', () => {
    render(<App />);
    expect(screen.getByText('Right now')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test and verify it fails**

Run: `npx vitest run src/__tests__/App.test.tsx`
Expected: FAIL — the current `App.tsx` placeholder renders only "Loading…", so neither "Right now" nor "Portfolio" are present.

- [ ] **Step 3: Replace `src/App.tsx`**

```tsx
import { mockCategories } from './mock/categories';
import { mockEvents } from './mock/events';
import { mockHubLinks } from './mock/hubLinks';
import { mockStatusOverride } from './mock/statusOverride';
import { deriveStatus } from './lib/status';
import { Sidebar } from './components/Sidebar';
import { StatusHero } from './components/StatusHero';
import { CalendarTabs } from './components/CalendarTabs';

function App() {
  const status = deriveStatus(mockEvents, mockCategories, mockStatusOverride, new Date());

  return (
    <div className="flex min-h-screen flex-col bg-cream sm:flex-row">
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        <StatusHero status={status} />
        <div className="mt-6">
          <CalendarTabs events={mockEvents} categories={mockCategories} />
        </div>
      </main>
    </div>
  );
}

export default App;
```

- [ ] **Step 4: Run the test and verify it passes**

Run: `npx vitest run src/__tests__/App.test.tsx`
Expected: PASS (1 test)

- [ ] **Step 5: Run the full test suite**

Run: `npm test`
Expected: all test files pass (Tasks 3–13 combined).

- [ ] **Step 6: Verify the production build still succeeds**

Run: `npm run build`
Expected: exits 0.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx src/__tests__/App.test.tsx
git commit -m "feat: compose App with sidebar, status hero, and calendar tabs"
```

---

### Task 14: Manual verification in the browser

**Files:** none (manual check only, no code changes).

**Interfaces:** none — this task only observes the app built in Tasks 1-13.

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: prints a local URL (e.g. `http://localhost:5173`).

- [ ] **Step 2: Open the app in a browser and check the desktop layout**

Confirm: cream background, sidebar on the left with bio + hub link pills, status hero card with terracotta headline and Free/Busy badge, Day/Week/Month tab pills below it, and the fonts look like a warm serif headline (Calistoga) over a clean sans body (Inter) — not the browser default serif/sans.

- [ ] **Step 3: Click through Day, Week, and Month tabs**

Confirm: Day view lists today's mock events in order with times; Week view shows 7 day columns with today's events under the correct day; Month view shows a full month grid with colored dots on days that have events, including the recurring "Sleep" and "Class" events appearing on the expected days.

- [ ] **Step 4: Resize the browser to a mobile width (e.g. 375px)**

Confirm: sidebar stacks above the main content (full width), status hero and calendar remain readable and usable, no horizontal scrolling.

- [ ] **Step 5: Stop the dev server**

Press `Ctrl+C` in the terminal running `npm run dev`.

No commit for this task — it's a verification checkpoint before moving to Phase 2 (Supabase integration).
