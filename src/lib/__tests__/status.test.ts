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
