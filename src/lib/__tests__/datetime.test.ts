import { describe, it, expect } from 'vitest';
import {
  isSameDay,
  formatTimeRange,
  formatDayHeading,
  formatWeekdayLabel,
  getWeekDays,
  getMonthGrid,
} from '../datetime';

describe('isSameDay', () => {
  it('returns true for the same calendar day', () => {
    expect(isSameDay(new Date('2026-07-28T01:00:00'), new Date('2026-07-28T23:00:00'))).toBe(true);
  });

  it('returns false for different days', () => {
    expect(isSameDay(new Date('2026-07-28T23:59:00'), new Date('2026-07-29T00:01:00'))).toBe(false);
  });
});

describe('formatTimeRange', () => {
  it('formats a start and end time as a readable range', () => {
    const result = formatTimeRange('2026-07-28T09:00:00', '2026-07-28T12:30:00');
    expect(result).toBe('9:00 AM – 12:30 PM');
  });
});

describe('formatDayHeading', () => {
  it('formats a full weekday, month, and day', () => {
    expect(formatDayHeading(new Date('2026-07-28T00:00:00'))).toBe('Tuesday, July 28');
  });
});

describe('formatWeekdayLabel', () => {
  it('formats a short weekday abbreviation with the day number', () => {
    expect(formatWeekdayLabel(new Date('2026-07-28T00:00:00'))).toBe('Tue 28');
  });
});

describe('getWeekDays', () => {
  it('returns 7 days starting on Sunday and containing the given date', () => {
    const week = getWeekDays(new Date('2026-07-28T00:00:00'));
    expect(week).toHaveLength(7);
    expect(week[0].getDay()).toBe(0);
    expect(week[6].getDay()).toBe(6);
    expect(week.some((d) => isSameDay(d, new Date('2026-07-28T00:00:00')))).toBe(true);
  });
});

describe('getMonthGrid', () => {
  it('returns full 7-day weeks covering the entire month', () => {
    const grid = getMonthGrid(new Date('2026-07-15T00:00:00'));
    const allDays = grid.flat();
    expect(allDays.length % 7).toBe(0);
    expect(allDays.some((d) => isSameDay(d, new Date('2026-07-01T00:00:00')))).toBe(true);
    expect(allDays.some((d) => isSameDay(d, new Date('2026-07-31T00:00:00')))).toBe(true);
    grid.forEach((week) => expect(week).toHaveLength(7));
  });
});
