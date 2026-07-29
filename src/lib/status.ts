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
