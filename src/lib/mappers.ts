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
