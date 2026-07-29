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
