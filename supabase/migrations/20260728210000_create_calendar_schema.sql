-- Core schema for What's Jake Doing v1, per docs/superpowers/specs/2026-07-28-whats-jake-doing-design.md

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null,
  icon text,
  is_busy boolean not null default true
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  category_id uuid not null references categories(id) on delete restrict,
  location text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  is_recurring boolean not null default false,
  recurrence jsonb
);

create table if not exists status_override (
  id uuid primary key default gen_random_uuid(),
  status_text text,
  is_busy boolean not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null
);

create index if not exists events_start_at_idx on events (start_at);
create index if not exists events_category_id_idx on events (category_id);
create index if not exists status_override_ends_at_idx on status_override (ends_at);

alter table categories enable row level security;
alter table events enable row level security;
alter table status_override enable row level security;

-- Public read access: the whole point of the app is an unlisted public view.
-- Writes are never allowed via the anon/authenticated roles — all mutations
-- go through Vercel serverless functions using the service_role key, gated
-- by the admin session cookie (see spec, "Admin writes").
create policy "categories are publicly readable"
  on categories for select
  to anon, authenticated
  using (true);

create policy "events are publicly readable"
  on events for select
  to anon, authenticated
  using (true);

create policy "status_override is publicly readable"
  on status_override for select
  to anon, authenticated
  using (true);
