import { describe, it, expect } from 'vitest';
import { mapCategoryRow, mapEventRow, mapStatusOverrideRow, type CategoryRow, type EventRow, type StatusOverrideRow } from '../mappers';

describe('mapCategoryRow', () => {
  it('maps snake_case DB columns to the app Category shape', () => {
    const row: CategoryRow = { id: '1', name: 'Work', color: '#000', icon: null, is_busy: true };
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
    const row: EventRow = {
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
    const row: EventRow = {
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
    const row: StatusOverrideRow = {
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
