import { describe, it, expect } from 'vitest';
import { buildIcsFeed } from '../ics';

const categories = [{ id: 'cat-1', name: 'Work' }];

describe('buildIcsFeed', () => {
  it('wraps output in a VCALENDAR with the expected header properties', () => {
    const ics = buildIcsFeed([], []);
    expect(ics).toContain('BEGIN:VCALENDAR\r\n');
    expect(ics).toContain('VERSION:2.0\r\n');
    expect(ics).toContain("X-WR-CALNAME:What's Jake Doing\r\n");
    expect(ics.trim().endsWith('END:VCALENDAR')).toBe(true);
  });

  it('emits a VEVENT with UTC-formatted dates, summary, location, and category', () => {
    const ics = buildIcsFeed(
      [
        {
          id: 'event-1',
          title: 'Gym',
          category_id: 'cat-1',
          location: 'Downtown YMCA',
          start_at: '2026-07-29T10:00:00.000Z',
          end_at: '2026-07-29T11:00:00.000Z',
          is_recurring: false,
          recurrence: null,
        },
      ],
      categories
    );

    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:event-1@whatsjakedoing.com');
    expect(ics).toContain('DTSTART:20260729T100000Z');
    expect(ics).toContain('DTEND:20260729T110000Z');
    expect(ics).toContain('SUMMARY:Gym');
    expect(ics).toContain('LOCATION:Downtown YMCA');
    expect(ics).toContain('CATEGORIES:Work');
    expect(ics).not.toContain('RRULE');
  });

  it('escapes commas, semicolons, backslashes, and newlines in text fields', () => {
    const ics = buildIcsFeed(
      [
        {
          id: 'event-1',
          title: 'Dinner, drinks; wine\\cheese\nplatter',
          category_id: 'cat-1',
          location: null,
          start_at: '2026-07-29T10:00:00.000Z',
          end_at: '2026-07-29T11:00:00.000Z',
          is_recurring: false,
          recurrence: null,
        },
      ],
      categories
    );

    expect(ics).toContain('SUMMARY:Dinner\\, drinks\\; wine\\\\cheese\\nplatter');
  });

  it('builds a daily RRULE with an UTC UNTIL from the recurrence end date', () => {
    const ics = buildIcsFeed(
      [
        {
          id: 'event-1',
          title: 'Standup',
          category_id: 'cat-1',
          location: null,
          start_at: '2026-07-29T09:00:00.000Z',
          end_at: '2026-07-29T09:15:00.000Z',
          is_recurring: true,
          recurrence: { freq: 'daily', until: '2026-12-31' },
        },
      ],
      categories
    );

    expect(ics).toContain('RRULE:FREQ=DAILY;UNTIL=20261231T235959Z');
  });

  it('builds a weekly RRULE with BYDAY mapped from daysOfWeek', () => {
    const ics = buildIcsFeed(
      [
        {
          id: 'event-1',
          title: 'Standup',
          category_id: 'cat-1',
          location: null,
          start_at: '2026-07-29T09:00:00.000Z',
          end_at: '2026-07-29T09:15:00.000Z',
          is_recurring: true,
          recurrence: { freq: 'weekly', daysOfWeek: [1, 3, 5], until: '2026-12-31' },
        },
      ],
      categories
    );

    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261231T235959Z');
  });

  it('folds lines longer than 75 octets with a leading space on continuations', () => {
    const longTitle = 'A'.repeat(100);
    const ics = buildIcsFeed(
      [
        {
          id: 'event-1',
          title: longTitle,
          category_id: 'cat-1',
          location: null,
          start_at: '2026-07-29T09:00:00.000Z',
          end_at: '2026-07-29T09:15:00.000Z',
          is_recurring: false,
          recurrence: null,
        },
      ],
      categories
    );

    const summaryLine = ics.split('\r\n').find((line) => line.startsWith('SUMMARY:'));
    expect(summaryLine?.length).toBeLessThanOrEqual(75);
    expect(ics).toContain('\r\n ');
  });
});
