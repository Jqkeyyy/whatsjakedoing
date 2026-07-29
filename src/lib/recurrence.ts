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
