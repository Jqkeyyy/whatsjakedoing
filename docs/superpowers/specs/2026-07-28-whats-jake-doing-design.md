# What's Jake Doing — Design Spec

Date: 2026-07-28
Status: Approved

## Overview

A personal status/calendar website. Jake logs his schedule and current
activity; a public, unlisted URL lets friends/family see what he's doing
right now and whether he's free, view his calendar, and find links to his
other projects. A password-gated admin view (used from Jake's phone) is
the only way to add/edit/delete events, manage categories, and set manual
status overrides.

## Tech Stack & Architecture

- **Frontend**: React + TypeScript + Vite + Tailwind CSS, deployed to
  Vercel as a static SPA.
- **Backend/data**: Supabase Postgres.
  - Public reads happen directly from the browser via the Supabase anon
    key. RLS allows `SELECT` on `events`, `categories`, and
    `status_override` to everyone — this is what powers the public
    unlisted-URL view. No auth required to view.
  - No Supabase Auth / user accounts. Single shared admin password only.
- **Admin writes**: a small set of Vercel serverless functions
  (`/api/login`, `/api/events`, `/api/categories`, `/api/status`) using
  the Supabase **service role key** server-side. The browser never gets
  direct write access to Supabase — all mutations go through these
  functions.
- **Admin auth flow**:
  1. `/api/login` checks the submitted password against a hashed password
     stored in a Vercel env var (bcrypt).
  2. On success, sets a signed, HttpOnly session cookie with a long
     expiry (~90 days) — long-lived on purpose, since this is used from
     Jake's phone and shouldn't require frequent re-login.
  3. Every write endpoint verifies that cookie server-side before
     touching Supabase.

## Data Model

```
categories
  id            uuid, pk
  name          text
  color         text (hex)
  icon          text, nullable
  is_busy       boolean          -- whether events in this category count as "busy"

events
  id            uuid, pk
  title         text
  category_id   uuid, fk -> categories
  location      text, nullable
  start_at      timestamptz      -- stored UTC, entered in Jake's reference tz (America/Chicago)
  end_at        timestamptz
  is_recurring  boolean
  recurrence    jsonb, nullable  -- { freq: 'daily' | 'weekly', days_of_week: [0-6], until: date }

status_override
  id            uuid, pk
  status_text   text, nullable
  is_busy       boolean
  starts_at     timestamptz
  ends_at       timestamptz      -- override auto-expires; required (no open-ended overrides)
```

**Recurrence scope (v1 cut):** recurring events are expanded on the fly
from the `recurrence` rule for whatever date range is being viewed —
instances are not materialized as rows. Editing or deleting a recurring
event affects the **whole series**, not a single instance. Per-instance
exceptions ("skip just this Tuesday") are explicitly deferred to a later
version if the need actually comes up.

**"Right now" status derivation:**
1. If an active `status_override` row exists (`now` between `starts_at`
   and `ends_at`), use it.
2. Else, if an event is happening now, derive status/busy from that
   event's category (`is_busy` flag) and title.
3. Else, default to **free**.

## Timezone Handling

- Jake enters event times in his reference timezone, **America/Chicago**,
  when adding events in the admin UI. Times are converted to UTC for
  storage.
- The public and admin views both **display times converted to each
  viewer's own browser timezone** — friends/family in other timezones see
  times in their own local time, not Jake's.

## Sharing Model

- Fully public, unlisted URL (e.g. `whatsjakedoing.com`). No passphrase,
  no login required to view. Privacy relies on the URL not being shared
  publicly/indexed (add `robots.txt` disallow / `noindex` meta tag as a
  light deterrent against search engines).

## Design System

Direction: **Warm & Playful** — validated visually against 3 alternatives
(Bold & Graphic, Moody & Minimal, Editorial & Personal) and cross-checked
against a design-pattern database for a concrete, accessible palette.

- **Background:** `#FFFBEB` (cream)
- **Surface/cards:** `#FFFFFF`, `2px` warm-charcoal border + offset
  "hand-drawn" shadow
- **Text/border:** `#292524` (warm near-black)
- **Primary accent (terracotta):** `#9A3412` / `#C2410C` — status
  headline, primary buttons
- **Secondary accent (sage):** `#059669` — seed category color (e.g.
  "Free time")
- **Tertiary accent (warm gold):** `#D97706` — seed category color
- Additional category colors are user-defined per category via the
  admin UI (hex picker); the three above are just seed defaults for the
  initial categories.
- **Typography:** **Calistoga** (display serif — headlines, status card)
  + **Inter** (body/UI — calendar grid, forms). Both via Google Fonts.

## Page Structure

- **`/` — public view**: persistent sidebar (bio, avatar, hub links) +
  main area with the "right now" status hero card and Day/Week/Month
  tabs showing the calendar. Sidebar collapses to a top bar/drawer on
  mobile.
- **`/admin` — same shell, gated**: password screen if no valid session
  cookie. Once unlocked: calendar becomes editable (tap an event to
  edit/delete, floating "+" to add), a status-override control, and a
  categories manager (add/edit/delete category name/color/icon/is_busy).

## Hub Links

Portfolio, Sass Web Design, Summit Moving and Junk Removal LLC, plus
social/contact links (email, Instagram, LinkedIn, etc.). Stored as a
typed config file in the codebase, **not** a database table — these
change rarely, so a code edit + redeploy is preferable to building an
admin UI/table for it. Actual URLs to be filled in during the hub-section
build phase.

## Explicitly Out of Scope for v1

(carried over from project brief, plus decisions made during this spec)
- No multi-user support / other people's calendars
- No third-party calendar sync (Google Calendar import)
- No notifications/push
- No per-instance recurring-event exceptions
- No passphrase/access gate on the public view
- No DB-editable hub links

## Build Phases

1. Calendar UI with static/mock data — sidebar + status hero + Day/Week/
   Month views, warm & playful styling, no backend
2. Supabase integration + password-gated admin editing — real schema,
   `/admin` password gate, event CRUD, category manager, status override
3. Sharing/public view polish — public `/` route on live data,
   recurrence expansion, responsive/mobile pass
4. Links/hub section — wire up real portfolio/Sass Web Design/Summit
   Moving/social URLs
5. Deploy to Vercel — env vars, Supabase project linked, production
   deploy

Pause for review after each phase before continuing to the next.
