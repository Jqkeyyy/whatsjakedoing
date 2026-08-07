# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the "Warm & Playful" cream/terracotta design system with the new dark, cosmic "ember sky" design system across both the public site and the admin app, including an animated starfield/shooting-star/glisten background.

**Architecture:** Pure styling swap at the Tailwind-token and component-className level (no data/routing/auth changes), plus one new self-contained `CosmicBackground` component (pure CSS starfield/sun + two small JS-driven timers for the shooting star and glisten sparkle) mounted once at each app shell (`App.tsx`, `AdminApp.tsx`).

**Tech Stack:** React + TypeScript + Vite + Tailwind CSS (existing stack, no new dependencies). CSS Motion Path (`offset-path`/`offset-distance`/`offset-rotate`) for the shooting star, driven by plain `setTimeout` scheduling in a small custom hook + component — no animation library.

## Global Constraints

- Spec: `docs/superpowers/specs/2026-08-07-frontend-redesign-design.md` — every task below implements a piece of it.
- Dark theme is the **only** theme — no light mode / theme toggle.
- Applies to **both** the public site (`App.tsx` tree) and the admin app (`AdminApp.tsx` tree).
- All background motion (starfield twinkle, shooting star, glisten) must respect `prefers-reduced-motion: reduce` — when set, the twinkle/shooting-star/glisten do not animate or fire at all; the static starfield and sun remain visible.
- No data model, routing, auth, or ICS feed changes — visual only.
- No new npm dependencies.
- Existing tests assert on rendered text/behavior, not Tailwind class names — restyle tasks must keep all existing tests green without modifying their assertions.

---

## Task 1: Design tokens — Tailwind config, fonts, base CSS

**Files:**
- Modify: `tailwind.config.js`
- Modify: `index.html`
- Modify: `src/index.css`

**Interfaces:**
- Produces: Tailwind color tokens `void`, `surface`, `hairline`, `ink`, `muted`, `faint`, `ember`, `teal`, `violet`; `font-display` now maps to Inter Tight; `shadow-depth` utility. All later tasks consume these tokens by name.

- [ ] **Step 1: Replace the Tailwind theme**

Replace the full contents of `tailwind.config.js`:

```js
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        void: '#08080B',
        surface: '#17171A',
        hairline: 'rgba(255,255,255,0.06)',
        ink: '#F5F3EF',
        muted: '#9C9CA3',
        faint: '#7A7A80',
        ember: '#FF8A3D',
        teal: '#4FD1C5',
        violet: '#9D8CFF',
      },
      fontFamily: {
        display: ['"Inter Tight"', 'sans-serif'],
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        depth: '0 8px 20px -8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.03)',
      },
    },
  },
  plugins: [],
};
```

This removes `cream`, `ink` (old warm near-black), `terracotta`, `sage`, `gold`, and the `shadow-offset` utility entirely — every remaining reference to them in components gets fixed in later tasks.

- [ ] **Step 2: Swap the Google Fonts import**

In `index.html`, replace the font `<link>`:

```html
<link
  href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@800&family=Inter:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

- [ ] **Step 3: Set the page background and keep Inter as the base body font**

Replace the full contents of `src/index.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  font-family: 'Inter', sans-serif;
  background-color: #08080B;
}
```

(This is the same file `CosmicBackground`'s CSS gets appended to in Task 12 — for now it just prevents a white/cream flash before any component renders.)

- [ ] **Step 4: Run the full test suite — must stay green (no behavior changed yet)**

Run: `npm test`
Expected: all existing tests PASS (config/font/base-CSS changes don't affect rendered text or behavior).

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js index.html src/index.css
git commit -m "feat: swap design tokens and fonts to the dark cosmic palette"
```

---

## Task 2: Sidebar + StatusHero restyle

**Files:**
- Modify: `src/components/Sidebar.tsx`
- Modify: `src/components/StatusHero.tsx`

**Interfaces:**
- Consumes: Tailwind tokens from Task 1 (`surface`, `hairline`, `ink`, `muted`, `faint`, `ember`, `shadow-depth`).

- [ ] **Step 1: Restyle Sidebar**

Replace the full contents of `src/components/Sidebar.tsx`:

```tsx
import type { HubLink } from '../types';

interface SidebarProps {
  bio: string;
  hubLinks: HubLink[];
}

export function Sidebar({ bio, hubLinks }: SidebarProps) {
  return (
    <aside className="flex flex-col gap-4 border-b border-hairline p-4 sm:w-64 sm:border-b-0 sm:border-r">
      <div>
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">Jake</h1>
        <p className="mt-1 text-sm text-muted">{bio}</p>
      </div>
      <nav className="flex flex-col gap-2">
        {hubLinks.map((link) => (
          <a
            key={link.id}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-semibold text-faint transition-colors hover:text-ember"
          >
            {link.label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
```

- [ ] **Step 2: Restyle StatusHero**

Replace the full contents of `src/components/StatusHero.tsx`:

```tsx
import type { StatusResult } from '../lib/status';

interface StatusHeroProps {
  status: StatusResult;
}

export function StatusHero({ status }: StatusHeroProps) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-depth">
      <p className="text-xs font-semibold uppercase tracking-wide text-ember">Right now</p>
      <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {status.label}
      </p>
      <p className="mt-1 text-sm text-muted">{status.isBusy ? 'Busy' : 'Free'}</p>
    </div>
  );
}
```

- [ ] **Step 3: Run the affected tests**

Run: `npm test -- Sidebar StatusHero`
Expected: PASS (these tests check text content only — `Building things.`, `Portfolio` link, `Reading`/`Free`/`Busy` — unaffected by class changes).

- [ ] **Step 4: Commit**

```bash
git add src/components/Sidebar.tsx src/components/StatusHero.tsx
git commit -m "feat: restyle Sidebar and StatusHero for the dark cosmic theme"
```

---

## Task 3: EventCard restyle

**Files:**
- Modify: `src/components/EventCard.tsx`

**Interfaces:**
- Consumes: `surface`, `ink`, `muted`, `faint`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle EventCard and fix the near-black fallback dot color**

Replace the full contents of `src/components/EventCard.tsx`:

```tsx
import type { CalendarEvent, Category } from '../types';
import { formatTimeRange } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface EventCardProps {
  event: CalendarEvent;
  category: Category | undefined;
  onClick?: () => void;
}

export function EventCard({ event, category, onClick }: EventCardProps) {
  return (
    <div
      className={`rounded-xl bg-surface p-3 shadow-depth ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-extrabold tracking-tight text-ink">{event.title}</span>
        <CategoryDot color={category?.color ?? '#FF8A3D'} label={category?.name} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatTimeRange(event.startAt, event.endAt)}</p>
      {event.location && <p className="mt-0.5 text-xs text-faint">{event.location}</p>}
    </div>
  );
}
```

The fallback dot color changes from `#292524` (near-black — invisible against the new dark surface) to `#FF8A3D` (ember).

- [ ] **Step 2: Run the affected tests**

Run: `npm test -- EventCard`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/components/EventCard.tsx
git commit -m "feat: restyle EventCard for the dark cosmic theme"
```

---

## Task 4: Calendar views restyle (CalendarTabs, DayView, WeekView, MonthView)

**Files:**
- Modify: `src/components/CalendarTabs.tsx`
- Modify: `src/components/DayView.tsx`
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/MonthView.tsx`

**Interfaces:**
- Consumes: `surface`, `void`, `ink`, `muted`, `faint`, `ember`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle the view-mode tab buttons in CalendarTabs**

In `src/components/CalendarTabs.tsx`, replace the button's `className`:

```tsx
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
              view === mode ? 'bg-ember text-void' : 'bg-surface text-ink'
            }`}
```

(This replaces `rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold capitalize` / `bg-terracotta text-white` : `bg-white text-ink`.)

- [ ] **Step 2: Restyle DayView**

In `src/components/DayView.tsx`, replace the heading and empty-state lines:

```tsx
      <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">{formatDayHeading(date)}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {sorted.length === 0 && <p className="text-sm text-muted">Nothing scheduled.</p>}
```

- [ ] **Step 3: Restyle WeekView**

Replace the full contents of `src/components/WeekView.tsx`:

```tsx
import type { CalendarEvent, Category } from '../types';
import { getWeekDays, isSameDay, formatTimeRange, formatWeekdayLabel } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function WeekView({ date, events, categories, onEventClick }: WeekViewProps) {
  const days = getWeekDays(date);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((event) => isSameDay(new Date(event.startAt), day))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
          <div key={day.toISOString()} className="rounded-xl bg-surface p-2 shadow-depth">
            <p className="text-xs font-semibold uppercase text-faint">
              {formatWeekdayLabel(day)}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {dayEvents.map((event) => {
                const category = categories.find((c) => c.id === event.categoryId);
                return (
                  <div
                    key={event.id}
                    className={`text-xs ${onEventClick ? 'cursor-pointer' : ''}`}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    role={onEventClick ? 'button' : undefined}
                  >
                    <CategoryDot color={category?.color ?? '#FF8A3D'} />
                    <span className="ml-1 text-ink">{event.title}</span>
                    <span className="ml-1 text-faint">
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

- [ ] **Step 4: Restyle MonthView**

Replace the full contents of `src/components/MonthView.tsx`:

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
                className={`min-h-[64px] rounded-lg p-1 ${
                  inMonth ? 'bg-surface text-ink' : 'bg-void text-faint'
                }`}
              >
                <p className="text-xs">{day.getDate()}</p>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayEvents.map((event) => {
                    const category = categories.find((c) => c.id === event.categoryId);
                    return <CategoryDot key={event.id} color={category?.color ?? '#FF8A3D'} />;
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

- [ ] **Step 5: Run the affected tests**

Run: `npm test -- CalendarTabs DayView WeekView MonthView`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/CalendarTabs.tsx src/components/DayView.tsx src/components/WeekView.tsx src/components/MonthView.tsx
git commit -m "feat: restyle calendar views for the dark cosmic theme"
```

---

## Task 5: Public App shell restyle

**Files:**
- Modify: `src/App.tsx`

**Interfaces:**
- Consumes: `void`, `muted` tokens.

- [ ] **Step 1: Restyle the App shell**

Replace the full contents of `src/App.tsx`:

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
    <div className="flex min-h-screen flex-col bg-void sm:flex-row">
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
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

(Only the `bg-cream` → `bg-void` and `text-stone-500`/`text-terracotta` → `text-muted`/`text-red-400` changes — no structural change. `CosmicBackground` gets mounted here in Task 12.)

- [ ] **Step 2: Run the affected tests**

Run: `npm test -- App.test`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat: restyle App shell for the dark cosmic theme"
```

---

## Task 6: LoginForm restyle

**Files:**
- Modify: `src/admin/LoginForm.tsx`

**Interfaces:**
- Consumes: `void`, `surface`, `ink`, `hairline`, `ember`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle LoginForm**

Replace the full contents of `src/admin/LoginForm.tsx`:

```tsx
import { useState } from 'react';
import { login } from '../lib/adminApi';

interface LoginFormProps {
  onSuccess: () => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(password);
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-void">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl bg-surface p-6 shadow-depth"
      >
        <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">Admin login</h1>
        <label htmlFor="admin-password" className="mt-4 block text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-3 py-2 text-ink focus:border-ember focus:outline-none"
        />
        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full bg-ember px-4 py-2 font-semibold text-void disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Run the affected tests**

Run: `npm test -- LoginForm`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/admin/LoginForm.tsx
git commit -m "feat: restyle LoginForm for the dark cosmic theme"
```

---

## Task 7: EventForm restyle

**Files:**
- Modify: `src/admin/EventForm.tsx`

**Interfaces:**
- Consumes: `void`, `surface`, `ink`, `hairline`, `ember`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle EventForm's render output**

In `src/admin/EventForm.tsx`, replace everything from `return (` to the matching closing `);` (the component's logic above it is unchanged) with:

```tsx
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-void/80 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-depth"
      >
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          {seriesId ? 'Edit event' : 'New event'}
        </h2>

        <label htmlFor="event-title" className="mt-3 block text-sm font-semibold text-ink">
          Title
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label htmlFor="event-category" className="mt-3 block text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id="event-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="event-location" className="mt-3 block text-sm font-semibold text-ink">
          Location
        </label>
        <input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label htmlFor="event-start" className="mt-3 block text-sm font-semibold text-ink">
          Start (Central time)
        </label>
        <input
          id="event-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label htmlFor="event-end" className="mt-3 block text-sm font-semibold text-ink">
          End (Central time)
        </label>
        <input
          id="event-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          Repeats
        </label>

        {isRecurring && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-hairline p-3">
            <label htmlFor="event-freq" className="text-sm font-semibold text-ink">
              Frequency
            </label>
            <select
              id="event-freq"
              value={freq}
              onChange={(e) => setFreq(e.target.value as RecurrenceRule['freq'])}
              className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            {freq === 'weekly' && (
              <div>
                <p className="text-sm font-semibold text-ink">Days</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, day) => (
                    <label key={day} className="flex items-center gap-1 text-sm text-ink">
                      <input type="checkbox" checked={daysOfWeek.includes(day)} onChange={() => toggleDay(day)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label htmlFor="event-until" className="text-sm font-semibold text-ink">
              Repeat until
            </label>
            <input
              id="event-until"
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              required
              className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink">
            Cancel
          </button>
          <div className="flex gap-2">
            {seriesId && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-red-400 shadow-depth"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="rounded-full bg-ember px-3 py-1.5 text-sm font-semibold text-void"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
```

- [ ] **Step 2: Run the affected tests**

Run: `npm test -- EventForm`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/admin/EventForm.tsx
git commit -m "feat: restyle EventForm for the dark cosmic theme"
```

---

## Task 8: CategoryManager + StatusOverrideControl restyle

**Files:**
- Modify: `src/admin/CategoryManager.tsx`
- Modify: `src/admin/StatusOverrideControl.tsx`

**Interfaces:**
- Consumes: `void`, `surface`, `ink`, `hairline`, `ember`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle CategoryManager**

Replace the full contents of `src/admin/CategoryManager.tsx`:

```tsx
import { useState } from 'react';
import type { Category } from '../types';
import { createCategory, deleteCategory } from '../lib/adminApi';
import { CategoryDot } from '../components/CategoryDot';

interface CategoryManagerProps {
  categories: Category[];
  onChange: () => void;
}

export function CategoryManager({ categories, onChange }: CategoryManagerProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');
  const [isBusy, setIsBusy] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await createCategory({ name, color, isBusy });
      setName('');
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create category');
    }
  }

  async function handleDelete(id: string) {
    setError(null);
    try {
      await deleteCategory(id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete category');
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-depth">
      <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Categories</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between">
            <CategoryDot color={category.color} label={category.name} />
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              aria-label={`Delete ${category.name}`}
              className="text-xs font-semibold text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>

      <form onSubmit={handleAdd} className="mt-4 flex flex-col gap-2">
        <label htmlFor="category-name" className="text-sm font-semibold text-ink">
          Name
        </label>
        <input
          id="category-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />
        <label htmlFor="category-color" className="text-sm font-semibold text-ink">
          Color
        </label>
        <input
          id="category-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)} />
          Counts as busy
        </label>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button type="submit" className="rounded-full bg-ember px-3 py-1.5 font-semibold text-void">
          Add category
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: Restyle StatusOverrideControl**

Replace the full contents of `src/admin/StatusOverrideControl.tsx`:

```tsx
import { useState } from 'react';
import type { StatusOverride } from '../types';
import { setStatusOverride, clearStatusOverride } from '../lib/adminApi';
import { chicagoWallTimeToUtcIso } from '../lib/timezone';

interface StatusOverrideControlProps {
  current: StatusOverride | null;
  onChange: () => void;
}

export function StatusOverrideControl({ current, onChange }: StatusOverrideControlProps) {
  const [statusText, setStatusText] = useState('');
  const [isBusy, setIsBusy] = useState(true);
  const [until, setUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await setStatusOverride({
        statusText: statusText || undefined,
        isBusy,
        startsAt: new Date().toISOString(),
        endsAt: chicagoWallTimeToUtcIso(until),
      });
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set status');
    }
  }

  async function handleClear() {
    if (!current) return;
    setError(null);
    try {
      await clearStatusOverride(current.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear status');
    }
  }

  return (
    <div className="rounded-2xl bg-surface p-4 shadow-depth">
      <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">Status override</h2>

      {current ? (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink">
            {current.statusText ?? (current.isBusy ? 'Busy' : 'Free')} until{' '}
            {new Date(current.endsAt).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full bg-void px-3 py-1.5 text-sm font-semibold text-red-400 shadow-depth"
          >
            Clear
          </button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="mt-2 flex flex-col gap-2">
          <label htmlFor="override-text" className="text-sm font-semibold text-ink">
            Status text
          </label>
          <input
            id="override-text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)} />
            Busy
          </label>
          <label htmlFor="override-until" className="text-sm font-semibold text-ink">
            Until (Central time)
          </label>
          <input
            id="override-until"
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            required
            className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
          />
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            className="rounded-full bg-ember px-3 py-1.5 text-sm font-semibold text-void"
          >
            Set status
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Run the affected tests**

Run: `npm test -- CategoryManager StatusOverrideControl`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add src/admin/CategoryManager.tsx src/admin/StatusOverrideControl.tsx
git commit -m "feat: restyle CategoryManager and StatusOverrideControl for the dark cosmic theme"
```

---

## Task 9: AdminApp shell restyle

**Files:**
- Modify: `src/admin/AdminApp.tsx`

**Interfaces:**
- Consumes: `ink`, `muted`, `surface`, `ember`, `void`, `shadow-depth` tokens.

- [ ] **Step 1: Restyle the AdminApp shell**

In `src/admin/AdminApp.tsx`, replace the `return (` block (everything from `return (` in the component to its matching closing `);`) with:

```tsx
  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <a href="/" className="text-sm font-semibold text-ink underline">
            ← Calendar
          </a>
          <h1 className="font-display text-xl font-extrabold tracking-tight text-ink">Admin</h1>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleLogout();
          }}
          className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-ink shadow-depth"
        >
          Log out
        </button>
      </div>

      {logoutError && <p className="mt-4 text-sm text-red-400">{logoutError}</p>}
      {loading && <p className="mt-4 text-sm text-muted">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      {!loading && !error && (
        <>
          <div className="mt-4">
            <StatusHero status={status} />
          </div>

          <div className="mt-4">
            <StatusOverrideControl current={statusOverride} onChange={refetch} />
          </div>

          <div className="mt-4">
            <CategoryManager categories={categories} onChange={refetch} />
          </div>

          <div className="relative mt-6">
            <CalendarTabs
              events={events}
              categories={categories}
              onEventClick={(event) => {
                setEditingEvent(event);
                setShowEventForm(true);
              }}
            />
            <button
              type="button"
              onClick={() => {
                setEditingEvent(null);
                setShowEventForm(true);
              }}
              aria-label="Add event"
              className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full bg-ember text-2xl text-void shadow-depth"
            >
              +
            </button>
          </div>

          {showEventForm && (
            <EventForm
              categories={categories}
              initialEvent={editingEvent ?? undefined}
              onSaved={() => {
                setShowEventForm(false);
                refetch();
              }}
              onClose={() => setShowEventForm(false)}
            />
          )}
        </>
      )}
    </div>
  );
```

Note: the root wrapper drops `bg-cream` with nothing yet in its place — Task 12 mounts `CosmicBackground` here, which supplies the page background.

- [ ] **Step 2: Run the affected tests**

Run: `npm test -- AdminApp`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/admin/AdminApp.tsx
git commit -m "feat: restyle AdminApp shell for the dark cosmic theme"
```

---

## Task 10: `usePrefersReducedMotion` hook

**Files:**
- Create: `src/hooks/usePrefersReducedMotion.ts`
- Test: `src/hooks/__tests__/usePrefersReducedMotion.test.ts`
- Modify: `src/test/setup.ts`

**Interfaces:**
- Produces: `usePrefersReducedMotion(): boolean` — later consumed by `CosmicBackground` (Tasks 12-14) to gate the shooting-star/glisten timers.

- [ ] **Step 1: Add a global `matchMedia` polyfill to the test setup**

jsdom does not implement `window.matchMedia`. Without a default stub, every existing test that renders `App` or `AdminApp` will crash once `CosmicBackground` (Task 12) calls this hook for real. Append to `src/test/setup.ts`:

```ts
import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
```

This makes `prefers-reduced-motion` default to "not requested" for every test unless a test explicitly overrides it via `vi.spyOn(window, 'matchMedia')` (which `vi.restoreAllMocks()` cleanly undoes back to this default).

- [ ] **Step 2: Write the failing test**

Create `src/hooks/__tests__/usePrefersReducedMotion.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePrefersReducedMotion } from '../usePrefersReducedMotion';

function mockMatchMedia(matches: boolean) {
  const listeners: Array<() => void> = [];
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_event: string, cb: () => void) => listeners.push(cb),
    removeEventListener: vi.fn(),
  } as unknown as MediaQueryList;
  vi.spyOn(window, 'matchMedia').mockReturnValue(mql);
  return { mql, trigger: () => listeners.forEach((cb) => cb()) };
}

describe('usePrefersReducedMotion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns false when the user has not requested reduced motion', () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when the user has requested reduced motion', () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(true);
  });

  it('updates when the media query change fires', () => {
    const { mql, trigger } = mockMatchMedia(false);
    const { result } = renderHook(() => usePrefersReducedMotion());
    expect(result.current).toBe(false);

    (mql as { matches: boolean }).matches = true;
    act(() => {
      trigger();
    });
    expect(result.current).toBe(true);
  });
});
```

- [ ] **Step 3: Run it to verify it fails**

Run: `npm test -- usePrefersReducedMotion`
Expected: FAIL with "Cannot find module '../usePrefersReducedMotion'" or similar.

- [ ] **Step 4: Implement the hook**

Create `src/hooks/usePrefersReducedMotion.ts`:

```ts
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => window.matchMedia(QUERY).matches);

  useEffect(() => {
    const mql = window.matchMedia(QUERY);
    const handleChange = () => setReduced(mql.matches);
    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
  }, []);

  return reduced;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- usePrefersReducedMotion`
Expected: PASS (all 3 cases).

- [ ] **Step 6: Run the full suite to confirm the matchMedia polyfill didn't break anything else**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/usePrefersReducedMotion.ts src/hooks/__tests__/usePrefersReducedMotion.test.ts src/test/setup.ts
git commit -m "feat: add usePrefersReducedMotion hook with jsdom matchMedia polyfill"
```

---

## Task 11: `cosmicRandom` pure helper functions

**Files:**
- Create: `src/lib/cosmicRandom.ts`
- Test: `src/lib/__tests__/cosmicRandom.test.ts`

**Interfaces:**
- Produces: `randomBetween(min, max): number`, `randomDelayMs(minMs, maxMs): number`, `randomArcPath(width, height): string`, `randomGlistenPosition(): { top: number; left: number }`. Consumed by `CosmicBackground` in Tasks 13-14.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/cosmicRandom.test.ts`:

```ts
import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  randomBetween,
  randomDelayMs,
  randomArcPath,
  randomGlistenPosition,
} from '../cosmicRandom';

describe('randomBetween', () => {
  afterEach(() => vi.restoreAllMocks());

  it('returns min when Math.random returns 0', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(randomBetween(10, 20)).toBe(10);
  });

  it('approaches max as Math.random approaches 1', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9999);
    expect(randomBetween(10, 20)).toBeCloseTo(20, 1);
  });
});

describe('randomDelayMs', () => {
  afterEach(() => vi.restoreAllMocks());

  it('rounds to the nearest millisecond within range', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomDelayMs(1000, 2000)).toBe(1500);
  });
});

describe('randomArcPath', () => {
  afterEach(() => vi.restoreAllMocks());

  it('produces a well-formed SVG quadratic path string', () => {
    const path = randomArcPath(400, 300);
    expect(path).toMatch(/^M -?\d+ -?\d+ Q -?\d+ -?\d+ -?\d+ -?\d+$/);
  });

  it('starts near the top-left and ends near the bottom-right for the given bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    const path = randomArcPath(400, 300);
    expect(path).toBe('M 0 0 Q 120 0 240 120');
  });
});

describe('randomGlistenPosition', () => {
  it('returns top/left percentages within the 5-90 range', () => {
    const { top, left } = randomGlistenPosition();
    expect(top).toBeGreaterThanOrEqual(5);
    expect(top).toBeLessThanOrEqual(90);
    expect(left).toBeGreaterThanOrEqual(5);
    expect(left).toBeLessThanOrEqual(90);
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- cosmicRandom`
Expected: FAIL with "Cannot find module '../cosmicRandom'".

- [ ] **Step 3: Implement cosmicRandom.ts**

Create `src/lib/cosmicRandom.ts`:

```ts
export function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

export function randomDelayMs(minMs: number, maxMs: number): number {
  return Math.round(randomBetween(minMs, maxMs));
}

export function randomArcPath(width: number, height: number): string {
  const startX = randomBetween(0, width * 0.4);
  const startY = randomBetween(0, height * 0.5);
  const controlX = randomBetween(width * 0.3, width * 0.7);
  const controlY = randomBetween(0, height * 0.3);
  const endX = randomBetween(width * 0.6, width);
  const endY = randomBetween(height * 0.4, height);
  return `M ${startX.toFixed(0)} ${startY.toFixed(0)} Q ${controlX.toFixed(0)} ${controlY.toFixed(0)} ${endX.toFixed(0)} ${endY.toFixed(0)}`;
}

export function randomGlistenPosition(): { top: number; left: number } {
  return { top: randomBetween(5, 90), left: randomBetween(5, 90) };
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npm test -- cosmicRandom`
Expected: PASS (all cases).

- [ ] **Step 5: Commit**

```bash
git add src/lib/cosmicRandom.ts src/lib/__tests__/cosmicRandom.test.ts
git commit -m "feat: add cosmicRandom pure helper functions"
```

---

## Task 12: `CosmicBackground` — static starfield + sun, mounted at both shells

**Files:**
- Create: `src/components/CosmicBackground.tsx`
- Test: `src/components/__tests__/CosmicBackground.test.tsx`
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Modify: `src/admin/AdminApp.tsx`
- Modify: `src/admin/LoginForm.tsx`

**Interfaces:**
- Produces: `<CosmicBackground />` — a self-contained, prop-less component. Task 13/14 extend this same file to add the shooting star and glisten.

- [ ] **Step 1: Write the failing test**

Create `src/components/__tests__/CosmicBackground.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicBackground } from '../CosmicBackground';

describe('CosmicBackground', () => {
  it('renders the starfield and sun layers', () => {
    render(<CosmicBackground />);
    expect(screen.getByTestId('cosmic-background')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-starfield')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-sun')).toBeInTheDocument();
  });

  it('does not render a shooting star or glisten on initial mount', () => {
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npm test -- CosmicBackground`
Expected: FAIL with "Cannot find module '../CosmicBackground'".

- [ ] **Step 3: Add the starfield/sun CSS**

Append to `src/index.css`:

```css

.cosmic-starfield {
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(1.5px 1.5px at 8% 15%, #fff, transparent),
    radial-gradient(1px 1px at 18% 40%, #fff, transparent),
    radial-gradient(1.2px 1.2px at 30% 8%, #fff, transparent),
    radial-gradient(1px 1px at 42% 55%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 55% 22%, #fff, transparent),
    radial-gradient(1px 1px at 65% 70%, #fff, transparent),
    radial-gradient(1.2px 1.2px at 75% 35%, #fff, transparent),
    radial-gradient(1px 1px at 85% 60%, #fff, transparent),
    radial-gradient(1.5px 1.5px at 92% 20%, #fff, transparent),
    radial-gradient(1px 1px at 15% 75%, #fff, transparent),
    radial-gradient(1px 1px at 38% 85%, #fff, transparent),
    radial-gradient(1.2px 1.2px at 60% 90%, #fff, transparent),
    radial-gradient(1px 1px at 5% 55%, #fff, transparent),
    radial-gradient(1px 1px at 95% 80%, #fff, transparent),
    radial-gradient(1.3px 1.3px at 48% 12%, #fff, transparent);
  opacity: 0.7;
}

@media (prefers-reduced-motion: no-preference) {
  .cosmic-starfield {
    animation: cosmic-twinkle 4s ease-in-out infinite;
  }
}

@keyframes cosmic-twinkle {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.9; }
}

.cosmic-sun {
  position: absolute;
  top: -60px;
  right: -60px;
  width: 260px;
  height: 260px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #FFD9A8 0%, #FF8A3D 28%, #C5501A 55%, #5C1E08 78%, #08080B 100%);
  box-shadow: 0 40px 80px -20px rgba(255, 120, 40, 0.35);
}
```

The twinkle animation is gated by a plain CSS `@media (prefers-reduced-motion: no-preference)` — no JS needed for this part.

- [ ] **Step 4: Implement CosmicBackground (static version)**

Create `src/components/CosmicBackground.tsx`:

```tsx
export function CosmicBackground() {
  return (
    <div
      data-testid="cosmic-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
      aria-hidden="true"
    >
      <div data-testid="cosmic-starfield" className="cosmic-starfield" />
      <div data-testid="cosmic-sun" className="cosmic-sun" />
    </div>
  );
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `npm test -- CosmicBackground`
Expected: PASS.

- [ ] **Step 6: Mount it in the public App shell**

In `src/App.tsx`, add the import and render it as the first child of the root `div`:

```tsx
import { useCalendarData } from './hooks/useCalendarData';
import { mockHubLinks } from './mock/hubLinks';
import { deriveStatus } from './lib/status';
import { Sidebar } from './components/Sidebar';
import { StatusHero } from './components/StatusHero';
import { CalendarTabs } from './components/CalendarTabs';
import { CosmicBackground } from './components/CosmicBackground';

function App() {
  const { categories, events, statusOverride, loading, error } = useCalendarData();
  const status = deriveStatus(events, categories, statusOverride, new Date());

  return (
    <div className="flex min-h-screen flex-col bg-void sm:flex-row">
      <CosmicBackground />
      <Sidebar
        bio="Building things, moving things, and figuring out what's next."
        hubLinks={mockHubLinks}
      />
      <main className="flex-1 p-4 sm:p-8">
        {loading && <p className="text-sm text-muted">Loading…</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
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

- [ ] **Step 7: Mount it in the AdminApp shell**

In `src/admin/AdminApp.tsx`, add the import:

```tsx
import { CosmicBackground } from '../components/CosmicBackground';
```

And render it as the first child inside the root `<div className="min-h-screen p-4 sm:p-8">`, immediately before the header row `<div className="flex items-center justify-between">`.

- [ ] **Step 8: Mount it in LoginForm too**

`AdminApp` early-returns `<LoginForm />` before it ever reaches the authenticated branch where `CosmicBackground` was just mounted (`if (!authenticated) return <LoginForm onSuccess={...} />;`) — so without this step, the login screen would be the one place in the app stuck with a flat, starless background, contradicting the spec's "shared background on both public and admin" requirement.

In `src/admin/LoginForm.tsx`, add the import:

```tsx
import { CosmicBackground } from '../components/CosmicBackground';
```

And render it as the first child inside the root `<div className="flex min-h-screen items-center justify-center bg-void">`, immediately before the `<form ...>`.

- [ ] **Step 9: Run the full test suite**

Run: `npm test`
Expected: all PASS — including `App.test.tsx`, `AdminApp.test.tsx`, and `LoginForm.test.tsx`, which now render `CosmicBackground` for real (using the `matchMedia` polyfill from Task 10) but assert on unrelated text/behavior.

- [ ] **Step 10: Commit**

```bash
git add src/components/CosmicBackground.tsx src/components/__tests__/CosmicBackground.test.tsx src/index.css src/App.tsx src/admin/AdminApp.tsx src/admin/LoginForm.tsx
git commit -m "feat: add static CosmicBackground (starfield + sun) mounted at both app shells"
```

---

## Task 13: Shooting star

**Files:**
- Create: `src/lib/cosmicConfig.ts`
- Modify: `src/components/CosmicBackground.tsx`
- Modify: `src/components/__tests__/CosmicBackground.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `usePrefersReducedMotion` (Task 10), `randomArcPath`/`randomDelayMs` (Task 11).
- Produces: `SHOOTING_STAR_MIN_DELAY_MS`, `SHOOTING_STAR_MAX_DELAY_MS`, `SHOOTING_STAR_VISIBLE_MS` constants — Task 14 adds glisten constants to this same file.

- [ ] **Step 1: Write the failing tests**

Replace the full contents of `src/components/__tests__/CosmicBackground.test.tsx`:

```tsx
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CosmicBackground } from '../CosmicBackground';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';

vi.mock('../../hooks/usePrefersReducedMotion');

describe('CosmicBackground', () => {
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('renders the starfield and sun layers', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.getByTestId('cosmic-background')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-starfield')).toBeInTheDocument();
    expect(screen.getByTestId('cosmic-sun')).toBeInTheDocument();
  });

  it('does not render a shooting star on initial mount', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
  });

  it('launches a shooting star once the random delay elapses', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    vi.spyOn(Math, 'random').mockReturnValue(0); // shortest possible delay

    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();

    vi.advanceTimersByTime(3 * 60_000);
    expect(screen.getByTestId('cosmic-shooting-star')).toBeInTheDocument();
  });

  it('never launches a shooting star when reduced motion is on', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(<CosmicBackground />);
    vi.advanceTimersByTime(60 * 60_000);
    expect(screen.queryByTestId('cosmic-shooting-star')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run it to verify the new tests fail**

Run: `npm test -- CosmicBackground`
Expected: FAIL — the "launches a shooting star" and "never launches ... reduced motion" cases fail because the component doesn't schedule anything yet.

- [ ] **Step 3: Add the timing constants**

Create `src/lib/cosmicConfig.ts`:

```ts
export const SHOOTING_STAR_MIN_DELAY_MS = 3 * 60_000;
export const SHOOTING_STAR_MAX_DELAY_MS = 10 * 60_000;
export const SHOOTING_STAR_VISIBLE_MS = 2600;
```

- [ ] **Step 4: Add the shooting-star CSS**

Append to `src/index.css`:

```css

.cosmic-shooting-star {
  position: absolute;
  top: 0;
  left: 0;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 5px 1px rgba(255, 255, 255, 0.7);
  offset-rotate: auto;
  offset-distance: 0%;
  opacity: 0;
}

.cosmic-shooting-star::before {
  content: '';
  position: absolute;
  top: 50%;
  right: 100%;
  width: 55px;
  height: 1px;
  background: linear-gradient(to left, rgba(255, 255, 255, 0.75), transparent);
  transform: translateY(-50%);
}

@media (prefers-reduced-motion: no-preference) {
  .cosmic-shooting-star {
    animation: cosmic-shoot 2.6s linear forwards;
  }
}

@keyframes cosmic-shoot {
  0%   { offset-distance: 0%;  opacity: 0;    transform: scale(0.5); }
  10%  { offset-distance: 3%;  opacity: 1;    transform: scale(1); }
  35%  { offset-distance: 30%; opacity: 1;    transform: scale(0.95); }
  60%  { offset-distance: 52%; opacity: 0.85; transform: scale(0.85); }
  78%  { offset-distance: 70%; opacity: 0.55; transform: scale(0.7); }
  92%  { offset-distance: 85%; opacity: 0.25; transform: scale(0.5); }
  100% { offset-distance: 100%; opacity: 0;   transform: scale(0.35); }
}
```

- [ ] **Step 5: Wire the shooting-star timer into CosmicBackground**

Replace the full contents of `src/components/CosmicBackground.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { randomArcPath, randomDelayMs } from '../lib/cosmicRandom';
import {
  SHOOTING_STAR_MIN_DELAY_MS,
  SHOOTING_STAR_MAX_DELAY_MS,
  SHOOTING_STAR_VISIBLE_MS,
} from '../lib/cosmicConfig';

interface ShootingStarState {
  key: number;
  path: string;
}

export function CosmicBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const nextKey = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    let launchTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    function scheduleLaunch() {
      const delay = randomDelayMs(SHOOTING_STAR_MIN_DELAY_MS, SHOOTING_STAR_MAX_DELAY_MS);
      launchTimer = setTimeout(() => {
        nextKey.current += 1;
        setShootingStar({
          key: nextKey.current,
          path: randomArcPath(window.innerWidth, window.innerHeight),
        });
        clearTimer = setTimeout(() => setShootingStar(null), SHOOTING_STAR_VISIBLE_MS);
        scheduleLaunch();
      }, delay);
    }

    scheduleLaunch();
    return () => {
      clearTimeout(launchTimer);
      clearTimeout(clearTimer);
    };
  }, [reducedMotion]);

  return (
    <div
      data-testid="cosmic-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
      aria-hidden="true"
    >
      <div data-testid="cosmic-starfield" className="cosmic-starfield" />
      <div data-testid="cosmic-sun" className="cosmic-sun" />
      {shootingStar && (
        <span
          key={shootingStar.key}
          data-testid="cosmic-shooting-star"
          className="cosmic-shooting-star"
          style={{ offsetPath: `path('${shootingStar.path}')` } as unknown as React.CSSProperties}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- CosmicBackground`
Expected: PASS (all 4 cases).

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cosmicConfig.ts src/components/CosmicBackground.tsx src/components/__tests__/CosmicBackground.test.tsx src/index.css
git commit -m "feat: add randomized shooting star to CosmicBackground"
```

---

## Task 14: Glisten sparkles

**Files:**
- Modify: `src/lib/cosmicConfig.ts`
- Modify: `src/components/CosmicBackground.tsx`
- Modify: `src/components/__tests__/CosmicBackground.test.tsx`
- Modify: `src/index.css`

**Interfaces:**
- Consumes: `randomGlistenPosition` (Task 11, already exists).
- Produces: `GLISTEN_MIN_DELAY_MS`, `GLISTEN_MAX_DELAY_MS`, `GLISTEN_VISIBLE_MS` constants.

- [ ] **Step 1: Write the failing tests**

Add to `src/components/__tests__/CosmicBackground.test.tsx`, inside the existing `describe('CosmicBackground', ...)` block (after the shooting-star tests):

```tsx
  it('does not render a glisten sparkle on initial mount', () => {
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    render(<CosmicBackground />);
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });

  it('shows a glisten sparkle once its random delay elapses', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(false);
    vi.spyOn(Math, 'random').mockReturnValue(0);

    render(<CosmicBackground />);
    vi.advanceTimersByTime(20_000);
    expect(screen.getByTestId('cosmic-glisten')).toBeInTheDocument();
  });

  it('never shows a glisten sparkle when reduced motion is on', () => {
    vi.useFakeTimers();
    vi.mocked(usePrefersReducedMotion).mockReturnValue(true);

    render(<CosmicBackground />);
    vi.advanceTimersByTime(5 * 60_000);
    expect(screen.queryByTestId('cosmic-glisten')).not.toBeInTheDocument();
  });
```

- [ ] **Step 2: Run it to verify the new tests fail**

Run: `npm test -- CosmicBackground`
Expected: FAIL — the glisten cases fail because nothing renders `cosmic-glisten` yet.

- [ ] **Step 3: Add the glisten timing constants**

Append to `src/lib/cosmicConfig.ts`:

```ts

export const GLISTEN_MIN_DELAY_MS = 20_000;
export const GLISTEN_MAX_DELAY_MS = 60_000;
export const GLISTEN_VISIBLE_MS = 1200;
```

- [ ] **Step 4: Add the glisten CSS**

Append to `src/index.css`:

```css

.cosmic-glisten {
  position: absolute;
  width: 16px;
  height: 16px;
}

.cosmic-glisten::before,
.cosmic-glisten::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  background: linear-gradient(to right, transparent, #fff, transparent);
}

.cosmic-glisten::before {
  width: 100%;
  height: 1.5px;
  transform: translate(-50%, -50%);
}

.cosmic-glisten::after {
  width: 1.5px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, #fff, transparent);
  transform: translate(-50%, -50%);
}

.cosmic-glisten-core {
  position: absolute;
  top: 6px;
  left: 6px;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 6px 2px rgba(255, 255, 255, 0.9);
  opacity: 0;
}

@media (prefers-reduced-motion: no-preference) {
  .cosmic-glisten,
  .cosmic-glisten-core {
    animation: cosmic-glisten-anim 1.2s ease-in-out forwards;
  }
}

@keyframes cosmic-glisten-anim {
  0%   { opacity: 0; transform: scale(0) rotate(0deg); }
  15%  { opacity: 1; transform: scale(0.3) rotate(0deg); }
  45%  { opacity: 1; transform: scale(1.15) rotate(90deg); }
  75%  { opacity: 0.5; transform: scale(0.8) rotate(150deg); }
  100% { opacity: 0; transform: scale(0) rotate(210deg); }
}
```

Note `.cosmic-glisten-core` is positioned with fixed `top: 6px; left: 6px` (centering a 4px dot inside the 16px box) rather than `top: 50%; left: 50%; transform: translate(-50%,-50%)` — the animation itself drives `transform` (scale/rotate), and a base rule setting `transform` too would be silently overwritten by the animation, breaking centering.

- [ ] **Step 5: Wire the glisten timer into CosmicBackground**

Replace the full contents of `src/components/CosmicBackground.tsx`:

```tsx
import { useEffect, useRef, useState } from 'react';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
import { randomArcPath, randomDelayMs, randomGlistenPosition } from '../lib/cosmicRandom';
import {
  SHOOTING_STAR_MIN_DELAY_MS,
  SHOOTING_STAR_MAX_DELAY_MS,
  SHOOTING_STAR_VISIBLE_MS,
  GLISTEN_MIN_DELAY_MS,
  GLISTEN_MAX_DELAY_MS,
  GLISTEN_VISIBLE_MS,
} from '../lib/cosmicConfig';

interface ShootingStarState {
  key: number;
  path: string;
}

interface GlistenState {
  key: number;
  top: number;
  left: number;
}

export function CosmicBackground() {
  const reducedMotion = usePrefersReducedMotion();
  const [shootingStar, setShootingStar] = useState<ShootingStarState | null>(null);
  const [glisten, setGlisten] = useState<GlistenState | null>(null);
  const nextKey = useRef(0);

  useEffect(() => {
    if (reducedMotion) return;

    let launchTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    function scheduleLaunch() {
      const delay = randomDelayMs(SHOOTING_STAR_MIN_DELAY_MS, SHOOTING_STAR_MAX_DELAY_MS);
      launchTimer = setTimeout(() => {
        nextKey.current += 1;
        setShootingStar({
          key: nextKey.current,
          path: randomArcPath(window.innerWidth, window.innerHeight),
        });
        clearTimer = setTimeout(() => setShootingStar(null), SHOOTING_STAR_VISIBLE_MS);
        scheduleLaunch();
      }, delay);
    }

    scheduleLaunch();
    return () => {
      clearTimeout(launchTimer);
      clearTimeout(clearTimer);
    };
  }, [reducedMotion]);

  useEffect(() => {
    if (reducedMotion) return;

    let launchTimer: ReturnType<typeof setTimeout>;
    let clearTimer: ReturnType<typeof setTimeout>;

    function scheduleGlisten() {
      const delay = randomDelayMs(GLISTEN_MIN_DELAY_MS, GLISTEN_MAX_DELAY_MS);
      launchTimer = setTimeout(() => {
        nextKey.current += 1;
        setGlisten({ key: nextKey.current, ...randomGlistenPosition() });
        clearTimer = setTimeout(() => setGlisten(null), GLISTEN_VISIBLE_MS);
        scheduleGlisten();
      }, delay);
    }

    scheduleGlisten();
    return () => {
      clearTimeout(launchTimer);
      clearTimeout(clearTimer);
    };
  }, [reducedMotion]);

  return (
    <div
      data-testid="cosmic-background"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-void"
      aria-hidden="true"
    >
      <div data-testid="cosmic-starfield" className="cosmic-starfield" />
      <div data-testid="cosmic-sun" className="cosmic-sun" />
      {shootingStar && (
        <span
          key={shootingStar.key}
          data-testid="cosmic-shooting-star"
          className="cosmic-shooting-star"
          style={{ offsetPath: `path('${shootingStar.path}')` } as unknown as React.CSSProperties}
        />
      )}
      {glisten && (
        <span
          key={glisten.key}
          data-testid="cosmic-glisten"
          className="cosmic-glisten"
          style={{ top: `${glisten.top}%`, left: `${glisten.left}%` }}
        >
          <span className="cosmic-glisten-core" />
        </span>
      )}
    </div>
  );
}
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npm test -- CosmicBackground`
Expected: PASS (all 7 cases).

- [ ] **Step 7: Run the full suite**

Run: `npm test`
Expected: all PASS.

- [ ] **Step 8: Commit**

```bash
git add src/lib/cosmicConfig.ts src/components/CosmicBackground.tsx src/components/__tests__/CosmicBackground.test.tsx src/index.css
git commit -m "feat: add randomized glisten sparkle to CosmicBackground"
```

---

## Task 15: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm test`
Expected: all tests PASS.

- [ ] **Step 2: Type-check and build**

Run: `npm run build`
Expected: succeeds with no TypeScript errors (this also validates the `offset-path` style cast compiles cleanly, and that no other stale token references — `cream`, old `ink`, `terracotta`, `sage`, `gold`, `shadow-offset` — remain anywhere in `src/`).

- [ ] **Step 3: Manual browser QA — public site**

Run: `npm run dev`, open `http://localhost:5173/`. Confirm:
- Dark background with the starfield twinkling and the ember sun top-right.
- Status hero, sidebar, and calendar views all render legibly (no invisible near-black-on-black text left over from the old theme).
- Day/Week/Month tab switching still works.
- Leave the tab open several minutes to see at least one shooting star and one glisten fire (or temporarily lower the constants in `src/lib/cosmicConfig.ts` locally to confirm behavior faster, then revert before committing anything further).

- [ ] **Step 4: Manual browser QA — admin site**

Open `http://localhost:5173/admin`. Confirm login form, then (after logging in) the admin shell, category manager, status override control, and event form all render legibly against the dark background with the same cosmic background visible behind them.

- [ ] **Step 5: Manual QA — reduced motion**

In Chrome DevTools: Cmd/Ctrl+Shift+P → "Rendering" → "Emulate CSS media feature prefers-reduced-motion: reduce". Reload both `/` and `/admin`. Confirm the starfield is static (no twinkle) and no shooting star or glisten appears over an extended wait.

- [ ] **Step 6: No commit for this task** — it's verification only. If any check fails, fix the issue in the relevant earlier task's files and re-run the full suite before proceeding.
