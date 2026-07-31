# Phase 2: Supabase Integration + Password-Gated Admin — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the real backend for What's Jake Doing — a password-gated
`/admin` view backed by Vercel serverless functions (using the Supabase
service-role key) that can create/edit/delete events, manage categories,
and set/clear the status override, while the public `/` view keeps running
on mock data until Phase 3.

**Architecture:** The Supabase schema is already live (migration applied,
verified via REST). `/admin` reads live data directly from Supabase via the
anon key (RLS already allows public `SELECT`), matching how the eventual
public view will read. All writes go through four Vercel serverless
functions (`/api/login`, `/api/events`, `/api/categories`, `/api/status`)
that use the Supabase **service role key** server-side and are gated by a
signed, HttpOnly session cookie. `/admin` is a second SPA root selected by
`window.location.pathname` at load time (no routing library needed for two
static roots).

**Tech Stack:** `@supabase/supabase-js` (browser + server clients),
`bcryptjs` (password hashing — pure JS, no native bindings to fight on
Windows/serverless), `jsonwebtoken` (signed session cookie), Vercel
serverless functions (`@vercel/node` types) in a top-level `/api` directory.

## Global Constraints

- Data model (exact column names, from the approved spec): `categories(id,
  name, color, icon, is_busy)`; `events(id, title, category_id, location,
  start_at, end_at, is_recurring, recurrence)`; `status_override(id,
  status_text, is_busy, starts_at, ends_at)`. App-side types in
  `src/types.ts` use camelCase; DB columns use snake_case — mapping happens
  at the boundary (`src/lib/mappers.ts` for reads, inline `snake_case`
  object literals in the API handlers for writes).
- `recurrence` jsonb is stored with the **same camelCase shape as
  `RecurrenceRule`** (`{freq, daysOfWeek, until}`) since it round-trips
  opaquely through Postgres and is consumed directly by
  `src/lib/recurrence.ts` — no snake_case translation for this one nested
  blob.
- No Supabase Auth / user accounts. Single shared admin password only,
  checked against a bcrypt hash stored in the `ADMIN_PASSWORD_HASH` env var.
- Admin auth flow (verbatim from spec):
  1. `/api/login` checks the submitted password against the hashed
     password.
  2. On success, sets a signed, HttpOnly session cookie with ~90-day
     expiry (long-lived on purpose — used from Jake's phone).
  3. Every write endpoint verifies that cookie server-side before touching
     Supabase.
- The browser never gets direct write access to Supabase — all mutations
  go through the four serverless functions.
- Public reads (`categories`, `events`, `status_override` `SELECT`) happen
  directly from the browser via the anon key — already covered by RLS
  policies in the live migration.
- Jake enters event times in **America/Chicago**; they're converted to UTC
  for storage. Display (already implemented in `src/lib/datetime.ts`)
  converts to each viewer's own browser timezone — that part doesn't
  change in this phase.
- Recurring events: editing/deleting affects the **whole series**, never a
  single instance.
- "Right now" status derivation priority: active `status_override` row >
  active event > default "Free" (already implemented in
  `src/lib/status.ts` — reused as-is).
- Public `/` route stays on mock data this phase (switching it to live
  data is explicitly Phase 3 scope in the spec).

---

## File Structure

```
api/
  _lib/
    auth.ts              # sign/verify/clear session cookie, requireSession guard
    supabaseAdmin.ts      # service-role Supabase client factory
  login.ts                 # GET (session check) / POST (login) / DELETE (logout)
  categories.ts             # POST / PUT / DELETE, gated
  events.ts                 # POST / PUT / DELETE, gated
  status.ts                 # POST / DELETE, gated
  tsconfig.json              # Node-targeted TS config for the api/ dir

scripts/
  generate-admin-secrets.mjs   # one-off: hash a password, mint a session secret

src/
  lib/
    supabaseClient.ts   # browser Supabase client (anon key)
    mappers.ts             # DB row <-> app type mapping (categories/events/status_override)
    timezone.ts             # America/Chicago wall-time <-> UTC ISO conversion
    adminApi.ts             # fetch wrapper for the four /api endpoints
  hooks/
    useAdminData.ts       # live categories/events/statusOverride for the admin view
  admin/
    LoginForm.tsx
    CategoryManager.tsx
    EventForm.tsx
    StatusOverrideControl.tsx
    AdminApp.tsx            # assembles the gated admin shell
  components/
    EventCard.tsx (modify)  # + optional onClick
    DayView.tsx (modify)     # + optional onEventClick
    WeekView.tsx (modify)    # + optional onEventClick
    CalendarTabs.tsx (modify) # + optional onEventClick threaded through
  main.tsx (modify)          # path-based split between App and AdminApp

vercel.json                 # SPA rewrite so /admin works on hard navigation
package.json (modify)        # + @supabase/supabase-js, bcryptjs, jsonwebtoken, @vercel/node, @types/node, @types/jsonwebtoken
vite.config.ts (modify)       # envPrefix includes NEXT_PUBLIC_ so the Supabase vars reach the browser
```

**Scoping note on tap-to-edit:** Day and Week views show event titles and
are reasonable tap targets, so they get `onEventClick`. Month view only
renders small category dots with no per-event label — making those
individually tappable would be a poor tap target for little benefit, so
Month view stays view-only; Day/Week are where admin editing happens. This
matches how most calendar apps scope "edit from the grid" to their
denser-detail views.

---

### Task 1: Dependencies and Vite env prefix

**Files:**
- Modify: `package.json`
- Modify: `vite.config.ts`

**Interfaces:**
- Produces: `import.meta.env.NEXT_PUBLIC_SUPABASE_URL` and
  `import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` become readable from
  browser code (they already exist in `.env.local` and on Vercel, but Vite
  only exposes `VITE_`-prefixed vars by default).

- [ ] **Step 1: Install runtime and dev dependencies**

```bash
npm install @supabase/supabase-js bcryptjs jsonwebtoken
npm install -D @vercel/node @types/node @types/jsonwebtoken @types/bcryptjs
```

- [ ] **Step 2: Extend Vite's env prefix**

Edit `vite.config.ts`:

```ts
/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  envPrefix: ['VITE_', 'NEXT_PUBLIC_'],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
```

- [ ] **Step 3: Verify the existing test suite still passes**

Run: `npm test`
Expected: all 35 existing tests still pass (this step only adds deps/config, no behavior change yet).

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vite.config.ts
git commit -m "chore: add Supabase/auth deps, expose NEXT_PUBLIC_ env vars to Vite"
```

---

### Task 2: Local admin credentials and session secret

This task sets up two new server-only secrets — `ADMIN_PASSWORD_HASH` and
`SESSION_SECRET` — without ever putting the plaintext password in this
conversation or in any command output.

**Files:**
- Create: `scripts/generate-admin-secrets.mjs`
- Modify: `.env.local` (gitignored — not committed)

**Interfaces:**
- Produces: `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` env vars, consumed
  by `api/login.ts` and `api/_lib/auth.ts` in later tasks.

- [ ] **Step 1: Write the secret-generation script**

```js
// scripts/generate-admin-secrets.mjs
// Usage: add a line `ADMIN_PASSWORD=<your chosen password>` to .env.local
// yourself (in your editor, not via chat), then run this script. It reads
// that value, replaces it with a bcrypt hash, mints a random session
// secret, and never prints the plaintext password anywhere.
import { readFileSync, writeFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const path = '.env.local';
const lines = readFileSync(path, 'utf8').split('\n');

const passwordLineIndex = lines.findIndex((l) => l.startsWith('ADMIN_PASSWORD='));
if (passwordLineIndex === -1) {
  console.error('Add a line `ADMIN_PASSWORD=<your password>` to .env.local first, then re-run.');
  process.exit(1);
}

const password = lines[passwordLineIndex].slice('ADMIN_PASSWORD='.length);
if (!password) {
  console.error('ADMIN_PASSWORD is empty.');
  process.exit(1);
}

const hash = bcrypt.hashSync(password, 10);
const sessionSecret = randomBytes(32).toString('hex');

const filtered = lines.filter(
  (l) => !l.startsWith('ADMIN_PASSWORD=') && !l.startsWith('ADMIN_PASSWORD_HASH=') && !l.startsWith('SESSION_SECRET=')
);
filtered.push(`ADMIN_PASSWORD_HASH=${hash}`, `SESSION_SECRET=${sessionSecret}`);

writeFileSync(path, filtered.filter((l) => l !== '').join('\n') + '\n');
console.log('Done. ADMIN_PASSWORD_HASH and SESSION_SECRET written to .env.local; plaintext password removed.');
```

- [ ] **Step 2: User adds their chosen password (outside of chat)**

Ask the user to open `.env.local` in their own editor and add a line:
`ADMIN_PASSWORD=<whatever they want to log into /admin with>` — this
should never be typed into the chat or a command the assistant runs, since
it would then be sitting in plaintext in conversation history.

- [ ] **Step 3: Run the script**

```bash
node scripts/generate-admin-secrets.mjs
```

Expected output: `Done. ADMIN_PASSWORD_HASH and SESSION_SECRET written to .env.local; plaintext password removed.`

- [ ] **Step 4: Verify the plaintext is gone and the hash exists**

```bash
grep -c "^ADMIN_PASSWORD=" .env.local
grep -c "^ADMIN_PASSWORD_HASH=" .env.local
grep -c "^SESSION_SECRET=" .env.local
```

Expected: first command prints `0` (or errors with no match), the other two print `1`.

- [ ] **Step 5: Add the same two vars to Vercel**

Tell the user: add `ADMIN_PASSWORD_HASH` and `SESSION_SECRET` to the
Vercel dashboard (Project Settings → Environment Variables) for
Production, Preview, and Development, using the exact values now sitting
in `.env.local` (same manual-copy approach already used for the Supabase
keys). Mark them Sensitive.

- [ ] **Step 6: Commit the script only**

```bash
git add scripts/generate-admin-secrets.mjs
git commit -m "chore: add script to generate admin password hash and session secret"
```

---

### Task 3: America/Chicago wall-time conversion

**Files:**
- Create: `src/lib/timezone.ts`
- Test: `src/lib/__tests__/timezone.test.ts`

**Interfaces:**
- Produces: `chicagoWallTimeToUtcIso(dateTimeLocal: string): string` and
  `utcIsoToChicagoWallTime(iso: string): string`, consumed by
  `src/admin/EventForm.tsx` in Task 15.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/timezone.test.ts
import { describe, it, expect } from 'vitest';
import { chicagoWallTimeToUtcIso, utcIsoToChicagoWallTime } from '../timezone';

describe('chicagoWallTimeToUtcIso', () => {
  it('converts a winter (CST, UTC-6) wall time to UTC', () => {
    // Jan 15 2026, 09:00 America/Chicago == 15:00 UTC
    expect(chicagoWallTimeToUtcIso('2026-01-15T09:00')).toBe('2026-01-15T15:00:00.000Z');
  });

  it('converts a summer (CDT, UTC-5) wall time to UTC', () => {
    // Jul 15 2026, 09:00 America/Chicago == 14:00 UTC
    expect(chicagoWallTimeToUtcIso('2026-07-15T09:00')).toBe('2026-07-15T14:00:00.000Z');
  });
});

describe('utcIsoToChicagoWallTime', () => {
  it('converts a winter UTC instant back to Chicago wall time', () => {
    expect(utcIsoToChicagoWallTime('2026-01-15T15:00:00.000Z')).toBe('2026-01-15T09:00');
  });

  it('converts a summer UTC instant back to Chicago wall time', () => {
    expect(utcIsoToChicagoWallTime('2026-07-15T14:00:00.000Z')).toBe('2026-07-15T09:00');
  });

  it('round-trips through both conversions', () => {
    const original = '2026-03-10T18:30';
    const roundTripped = utcIsoToChicagoWallTime(chicagoWallTimeToUtcIso(original));
    expect(roundTripped).toBe(original);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- timezone`
Expected: FAIL with "Failed to resolve import '../timezone'".

- [ ] **Step 3: Implement**

```ts
// src/lib/timezone.ts
const CHICAGO_TZ = 'America/Chicago';

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

/** dateTimeLocal is "YYYY-MM-DDTHH:mm", interpreted as America/Chicago wall time. */
export function chicagoWallTimeToUtcIso(dateTimeLocal: string): string {
  const [datePart, timePart] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  let guessUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  // One correction pass handles DST-boundary edge cases.
  const offset1 = getTimeZoneOffsetMinutes(CHICAGO_TZ, new Date(guessUtcMs));
  guessUtcMs -= offset1 * 60_000;
  const offset2 = getTimeZoneOffsetMinutes(CHICAGO_TZ, new Date(guessUtcMs));
  const finalUtcMs = Date.UTC(year, month - 1, day, hour, minute) - offset2 * 60_000;

  return new Date(finalUtcMs).toISOString();
}

/** Returns "YYYY-MM-DDTHH:mm" — the wall-clock time in America/Chicago for this UTC instant. */
export function utcIsoToChicagoWallTime(iso: string): string {
  const date = new Date(iso);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- timezone`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/timezone.ts src/lib/__tests__/timezone.test.ts
git commit -m "feat: add America/Chicago wall-time <-> UTC conversion helpers"
```

---

### Task 4: Browser Supabase client and row mappers

**Files:**
- Create: `src/lib/supabaseClient.ts`
- Create: `src/lib/mappers.ts`
- Test: `src/lib/__tests__/mappers.test.ts`

**Interfaces:**
- Produces: `supabase` (Supabase client instance), `mapCategoryRow`,
  `mapEventRow`, `mapStatusOverrideRow` — consumed by
  `src/hooks/useAdminData.ts` in Task 13.

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/mappers.test.ts
import { describe, it, expect } from 'vitest';
import { mapCategoryRow, mapEventRow, mapStatusOverrideRow } from '../mappers';

describe('mapCategoryRow', () => {
  it('maps snake_case DB columns to the app Category shape', () => {
    const row = { id: '1', name: 'Work', color: '#000', icon: null, is_busy: true };
    expect(mapCategoryRow(row)).toEqual({
      id: '1',
      name: 'Work',
      color: '#000',
      icon: undefined,
      isBusy: true,
    });
  });
});

describe('mapEventRow', () => {
  it('maps a non-recurring event row', () => {
    const row = {
      id: '1',
      title: 'Gym',
      category_id: 'cat-1',
      location: null,
      start_at: '2026-07-29T10:00:00.000Z',
      end_at: '2026-07-29T11:00:00.000Z',
      is_recurring: false,
      recurrence: null,
    };
    expect(mapEventRow(row)).toEqual({
      id: '1',
      title: 'Gym',
      categoryId: 'cat-1',
      location: undefined,
      startAt: '2026-07-29T10:00:00.000Z',
      endAt: '2026-07-29T11:00:00.000Z',
      isRecurring: false,
      recurrence: undefined,
    });
  });

  it('maps a recurring event row, preserving the recurrence object', () => {
    const row = {
      id: '2',
      title: 'Standup',
      category_id: 'cat-2',
      location: 'Office',
      start_at: '2026-07-29T09:00:00.000Z',
      end_at: '2026-07-29T09:15:00.000Z',
      is_recurring: true,
      recurrence: { freq: 'weekly', daysOfWeek: [1, 2, 3, 4, 5], until: '2026-12-31' },
    };
    expect(mapEventRow(row).recurrence).toEqual({
      freq: 'weekly',
      daysOfWeek: [1, 2, 3, 4, 5],
      until: '2026-12-31',
    });
  });
});

describe('mapStatusOverrideRow', () => {
  it('maps snake_case DB columns to the app StatusOverride shape', () => {
    const row = {
      id: '1',
      status_text: 'Napping',
      is_busy: true,
      starts_at: '2026-07-29T14:00:00.000Z',
      ends_at: '2026-07-29T15:00:00.000Z',
    };
    expect(mapStatusOverrideRow(row)).toEqual({
      id: '1',
      statusText: 'Napping',
      isBusy: true,
      startsAt: '2026-07-29T14:00:00.000Z',
      endsAt: '2026-07-29T15:00:00.000Z',
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- mappers`
Expected: FAIL with "Failed to resolve import '../mappers'".

- [ ] **Step 3: Implement the mappers**

```ts
// src/lib/mappers.ts
import type { Category, CalendarEvent, StatusOverride, RecurrenceRule } from '../types';

export interface CategoryRow {
  id: string;
  name: string;
  color: string;
  icon: string | null;
  is_busy: boolean;
}

export interface EventRow {
  id: string;
  title: string;
  category_id: string;
  location: string | null;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  recurrence: RecurrenceRule | null;
}

export interface StatusOverrideRow {
  id: string;
  status_text: string | null;
  is_busy: boolean;
  starts_at: string;
  ends_at: string;
}

export function mapCategoryRow(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon ?? undefined,
    isBusy: row.is_busy,
  };
}

export function mapEventRow(row: EventRow): CalendarEvent {
  return {
    id: row.id,
    title: row.title,
    categoryId: row.category_id,
    location: row.location ?? undefined,
    startAt: row.start_at,
    endAt: row.end_at,
    isRecurring: row.is_recurring,
    recurrence: row.recurrence ?? undefined,
  };
}

export function mapStatusOverrideRow(row: StatusOverrideRow): StatusOverride {
  return {
    id: row.id,
    statusText: row.status_text ?? undefined,
    isBusy: row.is_busy,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
  };
}
```

- [ ] **Step 4: Create the browser Supabase client**

```ts
// src/lib/supabaseClient.ts
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.NEXT_PUBLIC_SUPABASE_URL as string;
const anonKey = import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

export const supabase = createClient(url, anonKey);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- mappers`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabaseClient.ts src/lib/mappers.ts src/lib/__tests__/mappers.test.ts
git commit -m "feat: add browser Supabase client and DB row mappers"
```

---

### Task 5: Server-side auth and Supabase admin client

**Files:**
- Create: `api/_lib/auth.ts`
- Create: `api/_lib/supabaseAdmin.ts`
- Create: `api/tsconfig.json`
- Test: `api/_lib/__tests__/auth.test.ts`

**Interfaces:**
- Produces: `createSessionCookie(secure: boolean): string`,
  `clearSessionCookie(secure: boolean): string`, `hasValidSession(req):
  boolean`, `requireSession(req, res): boolean`, `getSupabaseAdmin()` —
  consumed by `api/login.ts`, `api/categories.ts`, `api/events.ts`,
  `api/status.ts` in Tasks 6–9.

- [ ] **Step 1: Add a Node-targeted tsconfig for the api/ directory**

```json
// api/tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "moduleResolution": "node",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["**/*.ts"]
}
```

- [ ] **Step 2: Write the failing tests**

```ts
// api/_lib/__tests__/auth.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import jwt from 'jsonwebtoken';
import {
  createSessionCookie,
  clearSessionCookie,
  hasValidSession,
  requireSession,
} from '../auth';

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe('session cookie helpers', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('createSessionCookie includes HttpOnly, SameSite=Lax, and a 90-day Max-Age', () => {
    const cookie = createSessionCookie(true);
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain(`Max-Age=${60 * 60 * 24 * 90}`);
  });

  it('createSessionCookie omits Secure when secure=false (local http dev)', () => {
    const cookie = createSessionCookie(false);
    expect(cookie).not.toContain('Secure');
  });

  it('clearSessionCookie sets Max-Age=0', () => {
    expect(clearSessionCookie(true)).toContain('Max-Age=0');
  });

  it('hasValidSession returns true for a token signed with the current secret', () => {
    const token = jwt.sign({ role: 'admin' }, 'test-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(true);
  });

  it('hasValidSession returns false when there is no cookie', () => {
    const req = { cookies: {} } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });

  it('hasValidSession returns false for a token signed with a different secret', () => {
    const token = jwt.sign({ role: 'admin' }, 'wrong-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    expect(hasValidSession(req)).toBe(false);
  });
});

describe('requireSession', () => {
  beforeEach(() => {
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('returns true and does not touch res when the session is valid', () => {
    const token = jwt.sign({ role: 'admin' }, 'test-secret');
    const req = { cookies: { session: token } } as unknown as VercelRequest;
    const res = mockRes();
    expect(requireSession(req, res)).toBe(true);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('returns false and writes a 401 when the session is missing', () => {
    const req = { cookies: {} } as unknown as VercelRequest;
    const res = mockRes();
    expect(requireSession(req, res)).toBe(false);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Unauthorized' });
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npm test -- api/_lib/__tests__/auth.test.ts`
Expected: FAIL with "Failed to resolve import '../auth'".

- [ ] **Step 4: Implement `api/_lib/auth.ts`**

```ts
// api/_lib/auth.ts
import jwt from 'jsonwebtoken';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const COOKIE_NAME = 'session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 90;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export function createSessionCookie(secure: boolean): string {
  const secret = requireEnv('SESSION_SECRET');
  const token = jwt.sign({ role: 'admin' }, secret, { expiresIn: SESSION_MAX_AGE_SECONDS });
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=${token}; HttpOnly${secureAttr}; SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(secure: boolean): string {
  const secureAttr = secure ? '; Secure' : '';
  return `${COOKIE_NAME}=; HttpOnly${secureAttr}; SameSite=Lax; Path=/; Max-Age=0`;
}

export function hasValidSession(req: VercelRequest): boolean {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return false;
  try {
    jwt.verify(token, requireEnv('SESSION_SECRET'));
    return true;
  } catch {
    return false;
  }
}

export function requireSession(req: VercelRequest, res: VercelResponse): boolean {
  if (!hasValidSession(req)) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}
```

- [ ] **Step 5: Implement `api/_lib/supabaseAdmin.ts`**

```ts
// api/_lib/supabaseAdmin.ts
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }
  return createClient(url, key, { auth: { persistSession: false } });
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `npm test -- api/_lib/__tests__/auth.test.ts`
Expected: PASS (8 tests).

- [ ] **Step 7: Commit**

```bash
git add api/tsconfig.json api/_lib/auth.ts api/_lib/supabaseAdmin.ts api/_lib/__tests__/auth.test.ts
git commit -m "feat: add signed session cookie helpers and service-role Supabase client"
```

---

### Task 6: `/api/login`

**Files:**
- Create: `api/login.ts`
- Test: `api/__tests__/login.test.ts`

**Interfaces:**
- Consumes: `createSessionCookie`, `clearSessionCookie`, `hasValidSession`
  from `api/_lib/auth.ts` (Task 5).
- Produces: `GET /api/login` (200/401 session check), `POST /api/login`
  `{password}` (200 + Set-Cookie / 401), `DELETE /api/login` (200 +
  cookie-clearing Set-Cookie) — consumed by `src/lib/adminApi.ts` (Task
  12).

- [ ] **Step 1: Write the failing tests**

```ts
// api/__tests__/login.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import handler from '../login';
import * as auth from '../_lib/auth';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'GET', cookies: {}, body: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

describe('GET /api/login', () => {
  it('returns 200 when the session is valid', async () => {
    vi.spyOn(auth, 'hasValidSession').mockReturnValue(true);
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it('returns 401 when there is no valid session', async () => {
    vi.spyOn(auth, 'hasValidSession').mockReturnValue(false);
    const req = mockReq({ method: 'GET' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
  });
});

describe('POST /api/login', () => {
  beforeEach(() => {
    process.env.ADMIN_PASSWORD_HASH = bcrypt.hashSync('correct-password', 10);
    process.env.SESSION_SECRET = 'test-secret';
  });

  it('sets a session cookie and returns 200 for the correct password', async () => {
    const req = mockReq({ method: 'POST', body: { password: 'correct-password' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith('Set-Cookie', expect.stringContaining('session='));
  });

  it('returns 401 for the wrong password', async () => {
    const req = mockReq({ method: 'POST', body: { password: 'wrong' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.setHeader).not.toHaveBeenCalled();
  });

  it('returns 400 when no password is provided', async () => {
    const req = mockReq({ method: 'POST', body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('DELETE /api/login', () => {
  it('clears the session cookie and returns 200', async () => {
    const req = mockReq({ method: 'DELETE' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.setHeader).toHaveBeenCalledWith(
      'Set-Cookie',
      expect.stringContaining('Max-Age=0')
    );
  });
});

describe('unsupported method', () => {
  it('returns 405', async () => {
    const req = mockReq({ method: 'PATCH' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- api/__tests__/login.test.ts`
Expected: FAIL with "Failed to resolve import '../login'".

- [ ] **Step 3: Implement**

```ts
// api/login.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { createSessionCookie, clearSessionCookie, hasValidSession } from './_lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const secure = process.env.VERCEL_ENV !== 'development';

  if (req.method === 'GET') {
    const authenticated = hasValidSession(req);
    return res.status(authenticated ? 200 : 401).json({ authenticated });
  }

  if (req.method === 'POST') {
    const { password } = req.body ?? {};
    const hash = process.env.ADMIN_PASSWORD_HASH;
    if (!password || !hash) {
      return res.status(400).json({ error: 'Missing password' });
    }
    const valid = await bcrypt.compare(password, hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    res.setHeader('Set-Cookie', createSessionCookie(secure));
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', clearSessionCookie(secure));
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- api/__tests__/login.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Commit**

```bash
git add api/login.ts api/__tests__/login.test.ts
git commit -m "feat: add /api/login (session check, login, logout)"
```

---

### Task 7: `/api/categories`

**Files:**
- Create: `api/categories.ts`
- Test: `api/__tests__/categories.test.ts`

**Interfaces:**
- Consumes: `requireSession` (Task 5), `getSupabaseAdmin` (Task 5).
- Produces: `POST /api/categories` (201 + row), `PUT /api/categories`
  `{id, ...}` (200 + row), `DELETE /api/categories` `{id}` (204) — consumed
  by `src/lib/adminApi.ts` (Task 12).

- [ ] **Step 1: Write the failing tests**

```ts
// api/__tests__/categories.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../categories';
import * as auth from '../_lib/auth';
import * as supabaseAdmin from '../_lib/supabaseAdmin';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, cookies: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

function mockSupabaseChain(result: { data: unknown; error: unknown }) {
  const chain: Record<string, unknown> = {};
  chain.insert = vi.fn().mockReturnValue(chain);
  chain.update = vi.fn().mockReturnValue(chain);
  chain.delete = vi.fn().mockReturnValue(chain);
  chain.eq = vi.fn().mockReturnValue(chain);
  chain.select = vi.fn().mockReturnValue(chain);
  chain.single = vi.fn().mockResolvedValue(result);
  // delete() resolves directly (no .single()) in the handler
  chain.then = undefined;
  return chain;
}

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/categories', () => {
  it('creates a category and returns 201', async () => {
    const row = { id: '1', name: 'Work', color: '#000', icon: null, is_busy: true };
    const chain = mockSupabaseChain({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'POST', body: { name: 'Work', color: '#000', isBusy: true } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(row);
  });

  it('returns 400 when required fields are missing', async () => {
    const req = mockReq({ method: 'POST', body: { name: 'Work' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('returns 401 when the session is invalid', async () => {
    vi.spyOn(auth, 'requireSession').mockReturnValue(false);
    const req = mockReq({ method: 'POST', body: { name: 'Work', color: '#000', isBusy: true } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).not.toHaveBeenCalledWith(201);
  });
});

describe('DELETE /api/categories', () => {
  it('deletes a category and returns 204', async () => {
    const chain = mockSupabaseChain({ data: null, error: null });
    chain.eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue(chain),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: '1' } });
    const res = mockRes();
    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
  });

  it('returns 400 when id is missing', async () => {
    const req = mockReq({ method: 'DELETE', body: {} });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('unsupported method', () => {
  it('returns 405', async () => {
    const req = mockReq({ method: 'PATCH' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- api/__tests__/categories.test.ts`
Expected: FAIL with "Failed to resolve import '../categories'".

- [ ] **Step 3: Implement**

```ts
// api/categories.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { name, color, icon, isBusy } = req.body ?? {};
    if (!name || !color || typeof isBusy !== 'boolean') {
      return res.status(400).json({ error: 'name, color, and isBusy are required' });
    }
    const { data, error } = await supabase
      .from('categories')
      .insert({ name, color, icon: icon ?? null, is_busy: isBusy })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, name, color, icon, isBusy } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { data, error } = await supabase
      .from('categories')
      .update({ name, color, icon, is_busy: isBusy })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- api/__tests__/categories.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add api/categories.ts api/__tests__/categories.test.ts
git commit -m "feat: add /api/categories (create, update, delete)"
```

---

### Task 8: `/api/events`

**Files:**
- Create: `api/events.ts`
- Test: `api/__tests__/events.test.ts`

**Interfaces:**
- Consumes: `requireSession`, `getSupabaseAdmin` (Task 5).
- Produces: `POST /api/events` (201 + row), `PUT /api/events` `{id, ...}`
  (200 + row), `DELETE /api/events` `{id}` (204) — consumed by
  `src/lib/adminApi.ts` (Task 12). Whole-series edits only, per spec — the
  handler always writes the row identified by `id`, never a synthesized
  recurrence-instance id.

- [ ] **Step 1: Write the failing tests**

```ts
// api/__tests__/events.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../events';
import * as auth from '../_lib/auth';
import * as supabaseAdmin from '../_lib/supabaseAdmin';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, cookies: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/events', () => {
  it('creates a non-recurring event and returns 201', async () => {
    const row = {
      id: '1',
      title: 'Gym',
      category_id: 'cat-1',
      location: null,
      start_at: '2026-07-29T10:00:00.000Z',
      end_at: '2026-07-29T11:00:00.000Z',
      is_recurring: false,
      recurrence: null,
    };
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ insert, select, single }),
    } as never);

    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Gym',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
        isRecurring: false,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Gym', category_id: 'cat-1', is_recurring: false, recurrence: null })
    );
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('stores the recurrence object as-is (camelCase) when isRecurring is true', async () => {
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ insert, select, single }),
    } as never);

    const recurrence = { freq: 'weekly', daysOfWeek: [1, 3, 5], until: '2026-12-31' };
    const req = mockReq({
      method: 'POST',
      body: {
        title: 'Standup',
        categoryId: 'cat-1',
        startAt: '2026-07-29T09:00:00.000Z',
        endAt: '2026-07-29T09:15:00.000Z',
        isRecurring: true,
        recurrence,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(insert).toHaveBeenCalledWith(expect.objectContaining({ recurrence }));
  });

  it('returns 400 when required fields are missing', async () => {
    const req = mockReq({ method: 'POST', body: { title: 'Gym' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('PUT /api/events', () => {
  it('updates the event identified by id (whole series, never an instance id)', async () => {
    const update = vi.fn().mockReturnThis();
    const eq = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: {}, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ update, eq, select, single }),
    } as never);

    const req = mockReq({
      method: 'PUT',
      body: {
        id: 'event-1',
        title: 'Gym (updated)',
        categoryId: 'cat-1',
        startAt: '2026-07-29T10:00:00.000Z',
        endAt: '2026-07-29T11:00:00.000Z',
        isRecurring: false,
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(eq).toHaveBeenCalledWith('id', 'event-1');
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe('DELETE /api/events', () => {
  it('deletes the event and returns 204', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnThis(), eq }),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: 'event-1' } });
    const res = mockRes();
    await handler(req, res);

    expect(eq).toHaveBeenCalledWith('id', 'event-1');
    expect(res.status).toHaveBeenCalledWith(204);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- api/__tests__/events.test.ts`
Expected: FAIL with "Failed to resolve import '../events'".

- [ ] **Step 3: Implement**

```ts
// api/events.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { title, categoryId, location, startAt, endAt, isRecurring, recurrence } = req.body ?? {};
    if (!title || !categoryId || !startAt || !endAt) {
      return res.status(400).json({ error: 'title, categoryId, startAt, and endAt are required' });
    }
    const { data, error } = await supabase
      .from('events')
      .insert({
        title,
        category_id: categoryId,
        location: location ?? null,
        start_at: startAt,
        end_at: endAt,
        is_recurring: Boolean(isRecurring),
        recurrence: isRecurring ? recurrence ?? null : null,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'PUT') {
    const { id, title, categoryId, location, startAt, endAt, isRecurring, recurrence } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { data, error } = await supabase
      .from('events')
      .update({
        title,
        category_id: categoryId,
        location: location ?? null,
        start_at: startAt,
        end_at: endAt,
        is_recurring: Boolean(isRecurring),
        recurrence: isRecurring ? recurrence ?? null : null,
      })
      .eq('id', id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- api/__tests__/events.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add api/events.ts api/__tests__/events.test.ts
git commit -m "feat: add /api/events (create, update, delete)"
```

---

### Task 9: `/api/status`

**Files:**
- Create: `api/status.ts`
- Test: `api/__tests__/status.test.ts`

**Interfaces:**
- Consumes: `requireSession`, `getSupabaseAdmin` (Task 5).
- Produces: `POST /api/status` `{statusText?, isBusy, startsAt, endsAt}`
  (201 + row), `DELETE /api/status` `{id}` (204) — consumed by
  `src/lib/adminApi.ts` (Task 12).

- [ ] **Step 1: Write the failing tests**

```ts
// api/__tests__/status.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from '../status';
import * as auth from '../_lib/auth';
import * as supabaseAdmin from '../_lib/supabaseAdmin';

function mockReq(overrides: Partial<VercelRequest> = {}): VercelRequest {
  return { method: 'POST', body: {}, cookies: {}, ...overrides } as VercelRequest;
}

function mockRes(): VercelResponse {
  const res: Partial<VercelResponse> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.end = vi.fn().mockReturnValue(res);
  return res as VercelResponse;
}

beforeEach(() => {
  vi.spyOn(auth, 'requireSession').mockReturnValue(true);
});

describe('POST /api/status', () => {
  it('creates a status override and returns 201', async () => {
    const row = {
      id: '1',
      status_text: 'Napping',
      is_busy: true,
      starts_at: '2026-07-29T14:00:00.000Z',
      ends_at: '2026-07-29T15:00:00.000Z',
    };
    const insert = vi.fn().mockReturnThis();
    const select = vi.fn().mockReturnThis();
    const single = vi.fn().mockResolvedValue({ data: row, error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ insert, select, single }),
    } as never);

    const req = mockReq({
      method: 'POST',
      body: {
        statusText: 'Napping',
        isBusy: true,
        startsAt: '2026-07-29T14:00:00.000Z',
        endsAt: '2026-07-29T15:00:00.000Z',
      },
    });
    const res = mockRes();
    await handler(req, res);

    expect(insert).toHaveBeenCalledWith({
      status_text: 'Napping',
      is_busy: true,
      starts_at: '2026-07-29T14:00:00.000Z',
      ends_at: '2026-07-29T15:00:00.000Z',
    });
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('returns 400 when isBusy, startsAt, or endsAt are missing', async () => {
    const req = mockReq({ method: 'POST', body: { statusText: 'Napping' } });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
  });
});

describe('DELETE /api/status', () => {
  it('deletes the override and returns 204', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    vi.spyOn(supabaseAdmin, 'getSupabaseAdmin').mockReturnValue({
      from: vi.fn().mockReturnValue({ delete: vi.fn().mockReturnThis(), eq }),
    } as never);

    const req = mockReq({ method: 'DELETE', body: { id: '1' } });
    const res = mockRes();
    await handler(req, res);

    expect(eq).toHaveBeenCalledWith('id', '1');
    expect(res.status).toHaveBeenCalledWith(204);
  });
});

describe('unsupported method', () => {
  it('returns 405', async () => {
    const req = mockReq({ method: 'PATCH' });
    const res = mockRes();
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- api/__tests__/status.test.ts`
Expected: FAIL with "Failed to resolve import '../status'".

- [ ] **Step 3: Implement**

```ts
// api/status.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireSession } from './_lib/auth';
import { getSupabaseAdmin } from './_lib/supabaseAdmin';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!requireSession(req, res)) return;
  const supabase = getSupabaseAdmin();

  if (req.method === 'POST') {
    const { statusText, isBusy, startsAt, endsAt } = req.body ?? {};
    if (typeof isBusy !== 'boolean' || !startsAt || !endsAt) {
      return res.status(400).json({ error: 'isBusy, startsAt, and endsAt are required' });
    }
    const { data, error } = await supabase
      .from('status_override')
      .insert({
        status_text: statusText ?? null,
        is_busy: isBusy,
        starts_at: startsAt,
        ends_at: endsAt,
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    return res.status(201).json(data);
  }

  if (req.method === 'DELETE') {
    const { id } = req.body ?? {};
    if (!id) return res.status(400).json({ error: 'id is required' });
    const { error } = await supabase.from('status_override').delete().eq('id', id);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(204).end();
  }

  res.setHeader('Allow', 'POST, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- api/__tests__/status.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add api/status.ts api/__tests__/status.test.ts
git commit -m "feat: add /api/status (set and clear status override)"
```

---

### Task 10: SPA rewrite for `/admin`

**Files:**
- Create: `vercel.json`

**Interfaces:**
- None (deploy config only).

- [ ] **Step 1: Add the rewrite**

```json
{
  "rewrites": [
    { "source": "/admin", "destination": "/index.html" },
    { "source": "/admin/(.*)", "destination": "/index.html" }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add vercel.json
git commit -m "chore: add SPA rewrite so /admin resolves on a hard navigation"
```

(No automated test — this is Vercel routing config, verified in Task 21's
manual end-to-end pass.)

---

### Task 11: Calendar tap-to-edit threading

**Files:**
- Modify: `src/components/EventCard.tsx`
- Modify: `src/components/DayView.tsx`
- Modify: `src/components/WeekView.tsx`
- Modify: `src/components/CalendarTabs.tsx`
- Test: `src/components/__tests__/EventCard.test.tsx` (extend)
- Test: `src/components/__tests__/DayView.test.tsx` (extend)
- Test: `src/components/__tests__/WeekView.test.tsx` (extend)

**Interfaces:**
- Produces: optional `onEventClick?: (event: CalendarEvent) => void` on
  `CalendarTabs`, `DayView`, `WeekView`; optional `onClick?: () => void` on
  `EventCard` — consumed by `src/admin/AdminApp.tsx` (Task 19). All props
  are optional and default to `undefined`, so the public view (which
  doesn't pass them) is unaffected.

- [ ] **Step 1: Write the failing tests**

Append to `src/components/__tests__/EventCard.test.tsx`:

```tsx
it('calls onClick when clicked, if provided', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const onClick = vi.fn();
  render(<EventCard event={sampleEvent} category={sampleCategory} onClick={onClick} />);
  await userEvent.click(screen.getByText(sampleEvent.title));
  expect(onClick).toHaveBeenCalledTimes(1);
});
```

(Adjust `sampleEvent`/`sampleCategory` to whatever fixtures the existing
file already defines — check the top of the file before writing this so
names match exactly.)

Append to `src/components/__tests__/DayView.test.tsx`:

```tsx
it('forwards onEventClick to each EventCard', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const onEventClick = vi.fn();
  render(<DayView date={testDate} events={testEvents} categories={testCategories} onEventClick={onEventClick} />);
  await userEvent.click(screen.getByText(testEvents[0].title));
  expect(onEventClick).toHaveBeenCalledWith(testEvents[0]);
});
```

Append to `src/components/__tests__/WeekView.test.tsx`:

```tsx
it('forwards onEventClick when an event row is clicked', async () => {
  const { default: userEvent } = await import('@testing-library/user-event');
  const onEventClick = vi.fn();
  render(<WeekView date={testDate} events={testEvents} categories={testCategories} onEventClick={onEventClick} />);
  await userEvent.click(screen.getByText(testEvents[0].title));
  expect(onEventClick).toHaveBeenCalledWith(testEvents[0]);
});
```

(Match each file's actual existing fixture variable names — read the file
first, since Phase 1's tests may name these `mockEvents`/`sampleDate`/etc.
rather than the placeholders above.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- EventCard DayView WeekView`
Expected: FAIL — `onClick`/`onEventClick` props don't exist yet, or clicking does nothing.

- [ ] **Step 3: Add `@testing-library/user-event` if not already present**

```bash
npm ls @testing-library/user-event || npm install -D @testing-library/user-event
```

- [ ] **Step 4: Update `EventCard.tsx`**

```tsx
// src/components/EventCard.tsx
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
      className={`rounded-xl border-2 border-ink bg-white p-3 shadow-offset ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
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

- [ ] **Step 5: Update `DayView.tsx`**

```tsx
// src/components/DayView.tsx
import type { CalendarEvent, Category } from '../types';
import { EventCard } from './EventCard';
import { formatDayHeading } from '../lib/datetime';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayView({ date, events, categories, onEventClick }: DayViewProps) {
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
            onClick={onEventClick ? () => onEventClick(event) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Update `WeekView.tsx`**

```tsx
// src/components/WeekView.tsx
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
          <div key={day.toISOString()} className="rounded-xl border-2 border-ink bg-white p-2">
            <p className="text-xs font-semibold uppercase text-stone-500">
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

- [ ] **Step 7: Thread `onEventClick` through `CalendarTabs.tsx`**

Modify `src/components/CalendarTabs.tsx`: add `onEventClick?: (event:
CalendarEvent) => void` to `CalendarTabsProps`, and pass it to `<DayView
... onEventClick={onEventClick} />` and `<WeekView ... onEventClick=
{onEventClick} />` (Month view stays as-is per the scoping note above).

- [ ] **Step 8: Run tests to verify they pass**

Run: `npm test`
Expected: PASS (all existing + new click tests, ~38+ tests total).

- [ ] **Step 9: Commit**

```bash
git add src/components/EventCard.tsx src/components/DayView.tsx src/components/WeekView.tsx src/components/CalendarTabs.tsx src/components/__tests__/EventCard.test.tsx src/components/__tests__/DayView.test.tsx src/components/__tests__/WeekView.test.tsx package.json package-lock.json
git commit -m "feat: thread optional onEventClick through Day/Week views for admin tap-to-edit"
```

---

### Task 12: Admin API client (`src/lib/adminApi.ts`)

**Files:**
- Create: `src/lib/adminApi.ts`
- Test: `src/lib/__tests__/adminApi.test.ts`

**Interfaces:**
- Consumes: `Category`, `CalendarEvent`, `StatusOverride` from
  `src/types.ts`.
- Produces: `checkSession()`, `login(password)`, `logout()`,
  `createCategory(input)`, `updateCategory(id, input)`,
  `deleteCategory(id)`, `createEvent(input)`, `updateEvent(id, input)`,
  `deleteEvent(id)`, `setStatusOverride(input)`, `clearStatusOverride(id)`
  — consumed by `src/admin/*.tsx` (Tasks 15–19).

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/__tests__/adminApi.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  checkSession,
  login,
  logout,
  createCategory,
  deleteEvent,
  setStatusOverride,
} from '../adminApi';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

describe('checkSession', () => {
  it('returns true when /api/login GET responds ok', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true });
    expect(await checkSession()).toBe(true);
  });

  it('returns false when /api/login GET responds 401', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: false });
    expect(await checkSession()).toBe(false);
  });
});

describe('login', () => {
  it('posts the password and resolves on success', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    await expect(login('hunter2')).resolves.toBeUndefined();
    expect(fetch).toHaveBeenCalledWith(
      '/api/login',
      expect.objectContaining({ method: 'POST', credentials: 'include' })
    );
  });

  it('throws with the server error message on failure', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid password' }),
    });
    await expect(login('wrong')).rejects.toThrow('Invalid password');
  });
});

describe('logout', () => {
  it('sends a DELETE to /api/login', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    });
    await logout();
    expect(fetch).toHaveBeenCalledWith('/api/login', expect.objectContaining({ method: 'DELETE' }));
  });
});

describe('createCategory', () => {
  it('posts to /api/categories and returns the created row', async () => {
    const created = { id: '1', name: 'Work', color: '#000', isBusy: true };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    });
    const result = await createCategory({ name: 'Work', color: '#000', isBusy: true });
    expect(result).toEqual(created);
    expect(fetch).toHaveBeenCalledWith('/api/categories', expect.objectContaining({ method: 'POST' }));
  });
});

describe('deleteEvent', () => {
  it('sends a DELETE with the event id in the body', async () => {
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, status: 204 });
    await deleteEvent('event-1');
    const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(options.method).toBe('DELETE');
    expect(JSON.parse(options.body)).toEqual({ id: 'event-1' });
  });
});

describe('setStatusOverride', () => {
  it('posts to /api/status', async () => {
    const created = { id: '1', isBusy: true, startsAt: 'a', endsAt: 'b' };
    (fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => created,
    });
    const result = await setStatusOverride({ isBusy: true, startsAt: 'a', endsAt: 'b' });
    expect(result).toEqual(created);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- adminApi`
Expected: FAIL with "Failed to resolve import '../adminApi'".

- [ ] **Step 3: Implement**

```ts
// src/lib/adminApi.ts
import type { Category, CalendarEvent, StatusOverride } from '../types';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(options.headers ?? {}) },
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `Request failed with status ${res.status}`);
  return body as T;
}

export async function checkSession(): Promise<boolean> {
  const res = await fetch('/api/login', { method: 'GET', credentials: 'include' });
  return res.ok;
}

export function login(password: string): Promise<void> {
  return request('/api/login', { method: 'POST', body: JSON.stringify({ password }) });
}

export function logout(): Promise<void> {
  return request('/api/login', { method: 'DELETE' });
}

export function createCategory(input: Omit<Category, 'id'>): Promise<Category> {
  return request('/api/categories', { method: 'POST', body: JSON.stringify(input) });
}

export function updateCategory(id: string, input: Omit<Category, 'id'>): Promise<Category> {
  return request('/api/categories', { method: 'PUT', body: JSON.stringify({ id, ...input }) });
}

export function deleteCategory(id: string): Promise<void> {
  return request('/api/categories', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export function createEvent(input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  return request('/api/events', { method: 'POST', body: JSON.stringify(input) });
}

export function updateEvent(id: string, input: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
  return request('/api/events', { method: 'PUT', body: JSON.stringify({ id, ...input }) });
}

export function deleteEvent(id: string): Promise<void> {
  return request('/api/events', { method: 'DELETE', body: JSON.stringify({ id }) });
}

export function setStatusOverride(input: Omit<StatusOverride, 'id'>): Promise<StatusOverride> {
  return request('/api/status', { method: 'POST', body: JSON.stringify(input) });
}

export function clearStatusOverride(id: string): Promise<void> {
  return request('/api/status', { method: 'DELETE', body: JSON.stringify({ id }) });
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- adminApi`
Expected: PASS (9 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/adminApi.ts src/lib/__tests__/adminApi.test.ts
git commit -m "feat: add admin API client wrapping the four serverless endpoints"
```

---

### Task 13: Live admin data hook (`src/hooks/useAdminData.ts`)

**Files:**
- Create: `src/hooks/useAdminData.ts`
- Test: `src/hooks/__tests__/useAdminData.test.ts`

**Interfaces:**
- Consumes: `supabase` (Task 4), `mapCategoryRow`, `mapEventRow`,
  `mapStatusOverrideRow` (Task 4).
- Produces: `useAdminData(): {categories, events, statusOverride, loading,
  error, refetch}` — consumed by `src/admin/AdminApp.tsx` (Task 19).

- [ ] **Step 1: Write the failing test**

```ts
// src/hooks/__tests__/useAdminData.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAdminData } from '../useAdminData';
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

describe('useAdminData', () => {
  it('loads categories, events, and the active status override', async () => {
    const { result } = renderHook(() => useAdminData());
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

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- useAdminData`
Expected: FAIL with "Failed to resolve import '../useAdminData'".

- [ ] **Step 3: Implement**

```ts
// src/hooks/useAdminData.ts
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { mapCategoryRow, mapEventRow, mapStatusOverrideRow } from '../lib/mappers';
import type { Category, CalendarEvent, StatusOverride } from '../types';

interface AdminData {
  categories: Category[];
  events: CalendarEvent[];
  statusOverride: StatusOverride | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminData(): AdminData {
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

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- useAdminData`
Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add src/hooks/useAdminData.ts src/hooks/__tests__/useAdminData.test.ts
git commit -m "feat: add useAdminData hook for live categories/events/status override"
```

---

### Task 14: `LoginForm.tsx`

**Files:**
- Create: `src/admin/LoginForm.tsx`
- Test: `src/admin/__tests__/LoginForm.test.tsx`

**Interfaces:**
- Consumes: `login` from `src/lib/adminApi.ts` (Task 12).
- Produces: `<LoginForm onSuccess={() => void} />` — consumed by
  `src/admin/AdminApp.tsx` (Task 19).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/admin/__tests__/LoginForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from '../LoginForm';
import * as adminApi from '../../lib/adminApi';

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('LoginForm', () => {
  it('calls onSuccess after a successful login', async () => {
    vi.spyOn(adminApi, 'login').mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/password/i), 'hunter2');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(adminApi.login).toHaveBeenCalledWith('hunter2');
    expect(onSuccess).toHaveBeenCalled();
  });

  it('shows an error message and does not call onSuccess on failure', async () => {
    vi.spyOn(adminApi, 'login').mockRejectedValue(new Error('Invalid password'));
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: /log in/i }));

    expect(await screen.findByText('Invalid password')).toBeInTheDocument();
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- LoginForm`
Expected: FAIL with "Failed to resolve import '../LoginForm'".

- [ ] **Step 3: Implement**

```tsx
// src/admin/LoginForm.tsx
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
    <div className="flex min-h-screen items-center justify-center bg-cream">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border-2 border-ink bg-white p-6 shadow-offset"
      >
        <h1 className="font-display text-xl text-ink">Admin login</h1>
        <label htmlFor="admin-password" className="mt-4 block text-sm font-semibold text-ink">
          Password
        </label>
        <input
          id="admin-password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-3 py-2"
        />
        {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="mt-4 w-full rounded-full border-2 border-ink bg-terracotta px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          Log in
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- LoginForm`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/LoginForm.tsx src/admin/__tests__/LoginForm.test.tsx
git commit -m "feat: add admin LoginForm"
```

---

### Task 15: `CategoryManager.tsx`

**Files:**
- Create: `src/admin/CategoryManager.tsx`
- Test: `src/admin/__tests__/CategoryManager.test.tsx`

**Interfaces:**
- Consumes: `createCategory`, `updateCategory`, `deleteCategory` from
  `src/lib/adminApi.ts` (Task 12).
- Produces: `<CategoryManager categories={Category[]} onChange={() =>
  void} />` — consumed by `src/admin/AdminApp.tsx` (Task 19).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/admin/__tests__/CategoryManager.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CategoryManager } from '../CategoryManager';
import * as adminApi from '../../lib/adminApi';
import type { Category } from '../../types';

const categories: Category[] = [
  { id: 'c1', name: 'Work', color: '#9A3412', isBusy: true },
];

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('CategoryManager', () => {
  it('lists existing categories', () => {
    render(<CategoryManager categories={categories} onChange={vi.fn()} />);
    expect(screen.getByText('Work')).toBeInTheDocument();
  });

  it('creates a new category and calls onChange', async () => {
    vi.spyOn(adminApi, 'createCategory').mockResolvedValue({
      id: 'c2',
      name: 'Free time',
      color: '#059669',
      isBusy: false,
    });
    const onChange = vi.fn();
    render(<CategoryManager categories={categories} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/name/i), 'Free time');
    await userEvent.type(screen.getByLabelText(/color/i), '#059669');
    await userEvent.click(screen.getByRole('button', { name: /add category/i }));

    expect(adminApi.createCategory).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Free time', color: '#059669' })
    );
    expect(onChange).toHaveBeenCalled();
  });

  it('deletes a category and calls onChange', async () => {
    vi.spyOn(adminApi, 'deleteCategory').mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<CategoryManager categories={categories} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /delete work/i }));

    expect(adminApi.deleteCategory).toHaveBeenCalledWith('c1');
    expect(onChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- CategoryManager`
Expected: FAIL with "Failed to resolve import '../CategoryManager'".

- [ ] **Step 3: Implement**

```tsx
// src/admin/CategoryManager.tsx
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
    <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-offset">
      <h2 className="font-display text-lg text-ink">Categories</h2>
      <ul className="mt-3 flex flex-col gap-2">
        {categories.map((category) => (
          <li key={category.id} className="flex items-center justify-between">
            <CategoryDot color={category.color} label={category.name} />
            <button
              type="button"
              onClick={() => handleDelete(category.id)}
              aria-label={`Delete ${category.name}`}
              className="text-xs font-semibold text-terracotta"
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
          className="rounded-lg border-2 border-ink px-2 py-1"
        />
        <label htmlFor="category-color" className="text-sm font-semibold text-ink">
          Color
        </label>
        <input
          id="category-color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="rounded-lg border-2 border-ink px-2 py-1"
        />
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)} />
          Counts as busy
        </label>
        {error && <p className="text-sm text-terracotta">{error}</p>}
        <button
          type="submit"
          className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 font-semibold text-white"
        >
          Add category
        </button>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- CategoryManager`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/CategoryManager.tsx src/admin/__tests__/CategoryManager.test.tsx
git commit -m "feat: add admin CategoryManager"
```

---

### Task 16: `EventForm.tsx`

**Files:**
- Create: `src/admin/EventForm.tsx`
- Test: `src/admin/__tests__/EventForm.test.tsx`

**Interfaces:**
- Consumes: `createEvent`, `updateEvent`, `deleteEvent` (Task 12),
  `chicagoWallTimeToUtcIso`, `utcIsoToChicagoWallTime` (Task 3).
- Produces: `<EventForm categories={Category[]} initialEvent={CalendarEvent
  | undefined} onSaved={() => void} onClose={() => void} />` — consumed by
  `src/admin/AdminApp.tsx` (Task 19).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/admin/__tests__/EventForm.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import * as adminApi from '../../lib/adminApi';
import type { Category, CalendarEvent } from '../../types';

const categories: Category[] = [{ id: 'c1', name: 'Work', color: '#9A3412', isBusy: true }];

beforeEach(() => {
  vi.restoreAllMocks();
});

// datetime-local inputs don't reliably support userEvent.type() keystroke
// simulation in jsdom — set the value directly via fireEvent.change instead.

describe('EventForm — create mode', () => {
  it('creates a new event with the Chicago-interpreted start/end times', async () => {
    vi.spyOn(adminApi, 'createEvent').mockResolvedValue({
      id: 'e1',
      title: 'Gym',
      categoryId: 'c1',
      startAt: '2026-07-29T15:00:00.000Z',
      endAt: '2026-07-29T16:00:00.000Z',
      isRecurring: false,
    });
    const onSaved = vi.fn();
    render(<EventForm categories={categories} onSaved={onSaved} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Gym');
    fireEvent.change(screen.getByLabelText(/^start/i), { target: { value: '2026-07-29T10:00' } });
    fireEvent.change(screen.getByLabelText(/^end/i), { target: { value: '2026-07-29T11:00' } });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(adminApi.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Gym',
        categoryId: 'c1',
        startAt: '2026-07-29T15:00:00.000Z',
        endAt: '2026-07-29T16:00:00.000Z',
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('EventForm — edit mode', () => {
  const existing: CalendarEvent = {
    id: 'e1',
    title: 'Gym',
    categoryId: 'c1',
    startAt: '2026-07-29T15:00:00.000Z',
    endAt: '2026-07-29T16:00:00.000Z',
    isRecurring: false,
  };

  it('pre-fills the form and updates on save', async () => {
    vi.spyOn(adminApi, 'updateEvent').mockResolvedValue(existing);
    const onSaved = vi.fn();
    render(<EventForm categories={categories} initialEvent={existing} onSaved={onSaved} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('Gym');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(adminApi.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ title: 'Gym' }));
    expect(onSaved).toHaveBeenCalled();
  });

  it('deletes the event when Delete is clicked', async () => {
    vi.spyOn(adminApi, 'deleteEvent').mockResolvedValue(undefined);
    const onSaved = vi.fn();
    render(<EventForm categories={categories} initialEvent={existing} onSaved={onSaved} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(adminApi.deleteEvent).toHaveBeenCalledWith('e1');
    expect(onSaved).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- EventForm`
Expected: FAIL with "Failed to resolve import '../EventForm'".

- [ ] **Step 3: Implement**

```tsx
// src/admin/EventForm.tsx
import { useState } from 'react';
import type { Category, CalendarEvent } from '../types';
import { createEvent, updateEvent, deleteEvent } from '../lib/adminApi';
import { chicagoWallTimeToUtcIso, utcIsoToChicagoWallTime } from '../lib/timezone';

interface EventFormProps {
  categories: Category[];
  initialEvent?: CalendarEvent;
  onSaved: () => void;
  onClose: () => void;
}

export function EventForm({ categories, initialEvent, onSaved, onClose }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [categoryId, setCategoryId] = useState(initialEvent?.categoryId ?? categories[0]?.id ?? '');
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [start, setStart] = useState(
    initialEvent ? utcIsoToChicagoWallTime(initialEvent.startAt) : ''
  );
  const [end, setEnd] = useState(initialEvent ? utcIsoToChicagoWallTime(initialEvent.endAt) : '');
  const [error, setError] = useState<string | null>(null);

  // Editing/deleting a recurring event always applies to the whole series —
  // if this instance was expanded from a recurrence, resolve back to the
  // original event id before writing.
  const seriesId = initialEvent?.id.split('__')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = {
        title,
        categoryId,
        location: location || undefined,
        startAt: chicagoWallTimeToUtcIso(start),
        endAt: chicagoWallTimeToUtcIso(end),
        isRecurring: initialEvent?.isRecurring ?? false,
        recurrence: initialEvent?.recurrence,
      };
      if (seriesId) {
        await updateEvent(seriesId, input);
      } else {
        await createEvent(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    }
  }

  async function handleDelete() {
    if (!seriesId) return;
    setError(null);
    try {
      await deleteEvent(seriesId);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border-2 border-ink bg-white p-6 shadow-offset"
      >
        <h2 className="font-display text-lg text-ink">{seriesId ? 'Edit event' : 'New event'}</h2>

        <label htmlFor="event-title" className="mt-3 block text-sm font-semibold text-ink">
          Title
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-category" className="mt-3 block text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id="event-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
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
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-start" className="mt-3 block text-sm font-semibold text-ink">
          Start (Central time)
        </label>
        <input
          id="event-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-end" className="mt-3 block text-sm font-semibold text-ink">
          End (Central time)
        </label>
        <input
          id="event-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink">
            Cancel
          </button>
          <div className="flex gap-2">
            {seriesId && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-terracotta"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- EventForm`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/EventForm.tsx src/admin/__tests__/EventForm.test.tsx
git commit -m "feat: add admin EventForm (create/edit/delete, Chicago time entry)"
```

---

### Task 17: `StatusOverrideControl.tsx`

**Files:**
- Create: `src/admin/StatusOverrideControl.tsx`
- Test: `src/admin/__tests__/StatusOverrideControl.test.tsx`

**Interfaces:**
- Consumes: `setStatusOverride`, `clearStatusOverride` (Task 12),
  `chicagoWallTimeToUtcIso` (Task 3).
- Produces: `<StatusOverrideControl current={StatusOverride | null}
  onChange={() => void} />` — consumed by `src/admin/AdminApp.tsx` (Task
  19).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/admin/__tests__/StatusOverrideControl.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StatusOverrideControl } from '../StatusOverrideControl';
import * as adminApi from '../../lib/adminApi';
import type { StatusOverride } from '../../types';

beforeEach(() => {
  vi.restoreAllMocks();
});

// datetime-local inputs don't reliably support userEvent.type() keystroke
// simulation in jsdom — set the value directly via fireEvent.change instead.

describe('StatusOverrideControl — no active override', () => {
  it('sets a new override on submit', async () => {
    vi.spyOn(adminApi, 'setStatusOverride').mockResolvedValue({
      id: 'o1',
      isBusy: true,
      startsAt: '2026-07-29T15:00:00.000Z',
      endsAt: '2026-07-29T16:00:00.000Z',
    });
    const onChange = vi.fn();
    render(<StatusOverrideControl current={null} onChange={onChange} />);

    await userEvent.type(screen.getByLabelText(/status text/i), 'Napping');
    fireEvent.change(screen.getByLabelText(/^until/i), { target: { value: '2026-07-29T11:00' } });
    await userEvent.click(screen.getByRole('button', { name: /set status/i }));

    expect(adminApi.setStatusOverride).toHaveBeenCalledWith(
      expect.objectContaining({ statusText: 'Napping', isBusy: true })
    );
    expect(onChange).toHaveBeenCalled();
  });
});

describe('StatusOverrideControl — active override', () => {
  const current: StatusOverride = {
    id: 'o1',
    statusText: 'Napping',
    isBusy: true,
    startsAt: '2026-07-29T15:00:00.000Z',
    endsAt: '2026-07-29T16:00:00.000Z',
  };

  it('shows a Clear button that removes the override', async () => {
    vi.spyOn(adminApi, 'clearStatusOverride').mockResolvedValue(undefined);
    const onChange = vi.fn();
    render(<StatusOverrideControl current={current} onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /clear/i }));

    expect(adminApi.clearStatusOverride).toHaveBeenCalledWith('o1');
    expect(onChange).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- StatusOverrideControl`
Expected: FAIL with "Failed to resolve import '../StatusOverrideControl'".

- [ ] **Step 3: Implement**

```tsx
// src/admin/StatusOverrideControl.tsx
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
    <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-offset">
      <h2 className="font-display text-lg text-ink">Status override</h2>

      {current ? (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink">
            {current.statusText ?? (current.isBusy ? 'Busy' : 'Free')} until{' '}
            {new Date(current.endsAt).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-terracotta"
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
            className="rounded-lg border-2 border-ink px-2 py-1"
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
            className="rounded-lg border-2 border-ink px-2 py-1"
          />
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button
            type="submit"
            className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
          >
            Set status
          </button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- StatusOverrideControl`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/StatusOverrideControl.tsx src/admin/__tests__/StatusOverrideControl.test.tsx
git commit -m "feat: add admin StatusOverrideControl"
```

---

### Task 18: `AdminApp.tsx`

**Files:**
- Create: `src/admin/AdminApp.tsx`
- Test: `src/admin/__tests__/AdminApp.test.tsx`

**Interfaces:**
- Consumes: `checkSession`, `logout` (Task 12), `useAdminData` (Task 13),
  `LoginForm` (Task 14), `CategoryManager` (Task 15), `EventForm` (Task
  16), `StatusOverrideControl` (Task 17), `Sidebar`, `StatusHero`,
  `CalendarTabs` (existing Phase 1 components), `deriveStatus` (existing).
- Produces: `<AdminApp />` — consumed by `src/main.tsx` (Task 19).

- [ ] **Step 1: Write the failing tests**

```tsx
// src/admin/__tests__/AdminApp.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AdminApp } from '../AdminApp';
import * as adminApi from '../../lib/adminApi';
import * as useAdminDataModule from '../../hooks/useAdminData';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(useAdminDataModule, 'useAdminData').mockReturnValue({
    categories: [],
    events: [],
    statusOverride: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('AdminApp', () => {
  it('shows the login form when there is no valid session', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(false);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows the admin shell when the session is valid', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.getByText('Right now')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- AdminApp`
Expected: FAIL with "Failed to resolve import '../AdminApp'".

- [ ] **Step 3: Implement**

```tsx
// src/admin/AdminApp.tsx
import { useEffect, useState } from 'react';
import { checkSession, logout } from '../lib/adminApi';
import { useAdminData } from '../hooks/useAdminData';
import { deriveStatus } from '../lib/status';
import { StatusHero } from '../components/StatusHero';
import { CalendarTabs } from '../components/CalendarTabs';
import { LoginForm } from './LoginForm';
import { CategoryManager } from './CategoryManager';
import { EventForm } from './EventForm';
import { StatusOverrideControl } from './StatusOverrideControl';
import type { CalendarEvent } from '../types';

export function AdminApp() {
  const [checking, setChecking] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  const { categories, events, statusOverride, loading, error, refetch } = useAdminData();

  useEffect(() => {
    checkSession()
      .then(setAuthenticated)
      .finally(() => setChecking(false));
  }, []);

  if (checking) return null;

  if (!authenticated) {
    return <LoginForm onSuccess={() => setAuthenticated(true)} />;
  }

  const status = deriveStatus(events, categories, statusOverride, new Date());

  return (
    <div className="min-h-screen bg-cream p-4 sm:p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl text-ink">Admin</h1>
        <button
          type="button"
          onClick={() => logout().then(() => setAuthenticated(false))}
          className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-ink"
        >
          Log out
        </button>
      </div>

      {loading && <p className="mt-4 text-sm text-stone-500">Loading…</p>}
      {error && <p className="mt-4 text-sm text-terracotta">{error}</p>}

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
              className="fixed bottom-6 right-6 flex h-14 w-14 items-center justify-center rounded-full border-2 border-ink bg-terracotta text-2xl text-white shadow-offset"
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
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- AdminApp`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/admin/AdminApp.tsx src/admin/__tests__/AdminApp.test.tsx
git commit -m "feat: assemble gated AdminApp shell"
```

---

### Task 19: Wire up `/admin` routing in `main.tsx`

**Files:**
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `AdminApp` (Task 18), existing `App` (Phase 1).

- [ ] **Step 1: Update `main.tsx`**

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { AdminApp } from './admin/AdminApp';
import './index.css';

const isAdmin = window.location.pathname.startsWith('/admin');

createRoot(document.getElementById('root')!).render(
  <StrictMode>{isAdmin ? <AdminApp /> : <App />}</StrictMode>
);
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS (all tests, existing + new).

- [ ] **Step 3: Commit**

```bash
git add src/main.tsx
git commit -m "feat: route /admin to AdminApp, everything else to the public App"
```

---

### Task 20: Manual end-to-end verification

Not TDD — this is the live-system check, same as the Phase 1 browser pass.

**Prerequisites:**
- Task 2's `ADMIN_PASSWORD_HASH` / `SESSION_SECRET` are set in
  `.env.local` and (for later deploys) in the Vercel dashboard.
- `SUPABASE_SERVICE_ROLE_KEY` is already present in `.env.local` (verified
  earlier this session).

- [ ] **Step 1: Run the full automated suite one more time**

Run: `npm test`
Expected: PASS (everything green).

- [ ] **Step 2: Start the local Vercel dev server**

`vite dev` alone does not execute `/api` functions — use Vercel's dev
server instead, which runs both the Vite app and the serverless functions
together:

```bash
vercel dev
```

- [ ] **Step 3: Verify the login gate**

Open `http://localhost:3000/admin` (port may vary — check the `vercel dev`
output). Confirm the login form appears, a wrong password shows an error,
and the correct password (the one chosen in Task 2) unlocks the admin
shell.

- [ ] **Step 4: Verify category CRUD**

Add a category, confirm it appears in the list and (after a page reload)
persists. Delete it and confirm it's gone.

- [ ] **Step 5: Verify event CRUD and tap-to-edit**

Use the floating "+" to create an event; confirm it shows up in Day and
Week views. Tap it to edit, change the title, save, and confirm the
change persists. Delete it via the edit form's Delete button.

- [ ] **Step 6: Verify the status override control**

Set a status override with a short "until" time; confirm the status hero
reflects it immediately. Clear it and confirm the hero falls back to the
event/default status.

- [ ] **Step 7: Verify session persistence and logout**

Reload `/admin` — confirm it stays logged in (no login form). Click "Log
out", confirm the login form reappears, and confirm a reload of `/admin`
still requires login again.

- [ ] **Step 8: Confirm the public `/` route is unaffected**

Open `/` and confirm it still renders the Phase 1 mock-data view exactly
as before — Phase 2 changes are additive and shouldn't touch it.

- [ ] **Step 9: Report results**

Summarize pass/fail for each of the checks above. Fix and re-verify any
failures before considering Phase 2 complete.

---

## Self-Review Notes

- **Spec coverage:** admin auth flow (Tasks 5–6, 14, 18), event CRUD
  (Tasks 8, 16), category manager (Tasks 7, 15), status override (Tasks 9,
  17), service-role-only writes (Task 5's `getSupabaseAdmin`, used only
  inside `/api/*` handlers), HttpOnly signed cookie with ~90-day expiry
  (Task 5), Chicago-timezone entry (Task 3, used in Tasks 16–17),
  whole-series-only recurring edits (Task 16's `seriesId` resolution).
  Public `/` on mock data is intentionally untouched (Phase 3 scope).
- **Placeholder scan:** no TBD/TODO markers; every step has runnable code.
- **Type consistency:** `Category`/`CalendarEvent`/`StatusOverride` field
  names match `src/types.ts` throughout; API request bodies use the same
  camelCase names the client sends (`categoryId`, `startAt`, `isBusy`,
  etc.) mapped to snake_case only at the Supabase call site.
