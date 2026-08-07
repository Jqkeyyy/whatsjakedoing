# Frontend Redesign — Design Spec

Date: 2026-08-07
Status: Approved

## Overview

Replace the current "Warm & Playful" design system (cream background,
terracotta/sage/gold accents, Calistoga display serif, hard offset
shadows) across the **entire app — public site and admin editor alike**
with a new dark, cosmic direction: a near-black canvas with a
realistically-lit ember "sun," bold tight sans-serif type, opaque
cards with real shadow depth instead of borders/glass, and a quiet
animated starfield with rare shooting stars and sparkle "glisten"
moments.

This redesign is visual/styling only. No data model, routing, auth, or
component structure changes — see
[2026-07-28-whats-jake-doing-design.md](2026-07-28-whats-jake-doing-design.md)
for those, which remain unchanged.

Direction was validated interactively via mockups (browser-based
visual brainstorming companion), iterating on: overall mood (3 initial
directions all rejected — dark editorial, soft minimal, retro
dashboard — none felt distinctive), then converging on a fintech/3D
dashboard-inspired look toned down from glassmorphism toward realistic
rendered materials, then adding and refining the space theme (starfield,
shooting star arc/fade/randomization, glisten sparkles).

## Design System

### Palette

| Token      | Value                | Use                                                   |
|------------|----------------------|--------------------------------------------------------|
| `void`     | `#08080B`            | Page background                                       |
| `surface`  | `#17171A`            | Cards, event rows, inputs — opaque, no transparency    |
| `hairline` | `rgba(255,255,255,0.06)` | Subtle dividers (e.g. sidebar border)              |
| `ink`      | `#F5F3EF`             | Primary text (headline, high-emphasis)                |
| `muted`    | `#9C9CA3`             | Secondary text (subtext, timestamps)                  |
| `faint`    | `#7A7A80`             | Tertiary text (eyebrow labels, nav links)              |
| `ember`    | `#FF8A3D`             | Primary accent — sun glow, active states, status label |
| `teal`     | `#4FD1C5`             | Seed category color                                    |
| `violet`   | `#9D8CFF`             | Seed category color                                    |

`ember`/`teal`/`violet` are a nebula-inspired trio, replacing
terracotta/sage/gold as the three seed category colors. Category colors
remain user-editable per category via the admin hex picker — these are
just new defaults for initial categories.

Removed entirely: `cream`, `ink` (old warm near-black), `terracotta`,
`sage`, `gold`, and the `shadow-offset` hard-shadow utility.

### Typography

- **Display** (status headline, page/section titles): **Inter Tight**,
  extra-bold (800), tight letter-spacing (`-0.03em`), large sizes
  (e.g. `text-4xl` → `text-5xl` responsive for the status headline).
  Replaces Calistoga.
- **Body/UI** (everything else — nav links, event text, form labels,
  buttons): **Inter**, as today. Both fonts are from the same family
  (Rasmus Andersson / Inter project) via Google Fonts, so no new font
  vendor dependency.
- Eyebrow labels (e.g. "Right now", "Elsewhere") keep the existing
  pattern: small, uppercase, wide letter-spacing, `faint` or `ember`
  color.

### Surfaces & Depth

- No borders as the primary surface delimiter (dropping the `border-2
  border-ink` pattern used everywhere today).
- Depth comes from shadow, not glass/blur: opaque `surface` background
  + `box-shadow: 0 8px 20px -8px rgba(0,0,0,0.6), inset 0 1px 0
  rgba(255,255,255,0.03)` (soft downward shadow + a faint inner top
  highlight for a subtle realistic bevel).
- Corners: `rounded-xl` (12px), consistent across cards/rows/buttons.
- The avatar and any icon-like elements get a small realistic bevel
  (linear-gradient fill + matching shadow pair) rather than a flat
  fill, echoing the "real rendered material" note from the 3D
  reference direction — not glassy, not flat.

### Background: Sun, Starfield, Shooting Stars, Glisten

A shared decorative background layer sits behind all page content, on
both the public site and the admin app, so the whole product feels
like one consistent "sky."

- **Sun**: a realistically-lit sphere via layered radial-gradient
  (`#FFD9A8` highlight → `#FF8A3D` → `#C5501A` → `#5C1E08` → fades into
  `void`), positioned top-right, partially off-canvas, with a soft
  ember glow shadow. Static — no animation.
- **Starfield**: scattered small radial-gradient dots across the full
  background, with a slow, subtle overall opacity pulse (twinkle),
  ~4s cycle.
- **Shooting star**: travels along a randomized curved arc
  (`offset-path`, generated at runtime — random start point, control
  point, and endpoint within the viewport each launch), `offset-rotate:
  auto` so its fading tail always orients along the direction of
  travel. Motion uses linear timing across evenly-spaced keyframes
  (avoids the uneven step/jitter effect of a single eased curve across
  sparse keyframes). Appears as a point, brightens, glides, then
  shrinks and fades gradually over the back half of its flight rather
  than cutting off abruptly. Fires rarely — target roughly once every
  3–10 minutes (randomized), driven by a JS timer, not a fixed CSS
  loop, so it never feels like a repeating pattern.
- **Glisten**: a small four-point cross-flare sparkle that scales up,
  spins open (~90–210°), and fades — fires occasionally on a randomly
  chosen background star, independent of and less rare than the
  shooting star (target roughly every 20–60 seconds, randomized), so
  the sky feels quietly alive without being busy.
- **Reduced motion**: all of the above motion (twinkle pulse, shooting
  star, glisten) is wrapped in `@media (prefers-reduced-motion:
  no-preference)`. Under `reduce`, the starfield renders at a fixed
  opacity with no pulse, and the shooting star / glisten timers simply
  don't run. The sun stays as-is either way (it's a static gradient,
  not motion).

## Component-Level Changes

Styling-only changes; no prop/behavior changes to any of these.

- **Sidebar**: dark `void` background, `hairline` border instead of
  `border-ink`, avatar gets the realistic bevel treatment, hub links
  become plain text (faint color, ember on hover) instead of bordered
  pills — quieter, lets the background carry visual interest.
- **StatusHero**: `surface` card with shadow depth (no border), status
  headline in Inter Tight extra-bold, eyebrow label in `ember`.
- **EventCard**: `surface` background, shadow depth, no border,
  category dot unchanged in behavior (just recolored via new palette).
- **CalendarTabs**: pill buttons keep their shape; active tab uses
  `ember` background, inactive tabs use `surface` background instead
  of white/bordered.
- **DayView / WeekView / MonthView**: same layout/grid logic, restyled
  to the new surface/text tokens (dark grid lines via `hairline`
  instead of `border-ink`).
- **Admin (LoginForm, EventForm, CategoryManager,
  StatusOverrideControl, AdminApp shell)**: same dark palette and
  surface/shadow treatment as the public site — inputs get `surface`
  backgrounds with `hairline` borders and an `ember` focus ring, save/
  delete buttons follow the same button treatment as public-site CTAs.
  The category color picker's swatch defaults update to
  ember/teal/violet.

## Implementation Notes

- `tailwind.config.js`: replace the `colors` block (drop
  cream/ink/terracotta/sage/gold, add void/surface/ink/muted/faint/
  ember/teal/violet), replace `fontFamily.display` with `['Inter
  Tight', 'sans-serif']`, drop the `shadow-offset` boxShadow utility.
- `index.css` / `index.html`: swap the Calistoga Google Fonts import
  for Inter Tight.
- New shared background component (starfield + sun + shooting-star/
  glisten timers) mounted once at the app shell level so it's shared
  between the public `App` and `AdminApp` roots, rather than
  duplicated per page.
- The shooting-star/glisten randomization logic (timers, random path
  generation) lives in plain JS/React — no new dependency needed
  (native `offset-path`/`offset-distance` CSS, driven by inline style
  updates from a small hook).

## Explicitly Out of Scope

- No light-mode toggle / theme switcher — dark is the only theme.
- No user-facing customization of the background effects (frequency,
  colors) beyond the category color picker admins already have.
- No changes to data model, routing, auth flow, or the ICS feed —
  purely visual.
- Exact shooting-star/glisten frequency constants above are starting
  points, tunable during implementation without a spec update.

## Future Ideas (not in scope now)

Captured for later — not part of this redesign's build phases:

- A floating astronaut element drifting slowly through the background
  scene, alongside the sun/starfield/shooting-star/glisten effects.

## Build Phases

1. Tailwind/token + font swap (palette, typography) applied across
   existing components — public site first, then admin — with no
   background effects yet.
2. Shared cosmic background component (sun + starfield) mounted at
   both app shells, static (no shooting star/glisten yet).
3. Shooting star: randomized arc generation, animation, timer-driven
   rare firing, reduced-motion handling.
4. Glisten sparkles: randomized star selection, animation, timer-driven
   firing, reduced-motion handling.

Pause for review after each phase before continuing to the next.
