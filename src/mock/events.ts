import type { CalendarEvent } from '../types';

function isoAtHour(daysFromToday: number, hour: number, minute = 0): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + daysFromToday);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function isoDateOnly(daysFromToday: number): string {
  return isoAtHour(daysFromToday, 0).slice(0, 10);
}

export const mockEvents: CalendarEvent[] = [
  {
    id: 'evt-work-today',
    title: 'Client work',
    categoryId: 'cat-work',
    startAt: isoAtHour(0, 9),
    endAt: isoAtHour(0, 12),
    isRecurring: false,
  },
  {
    id: 'evt-sass-today',
    title: 'Sass Web Design',
    categoryId: 'cat-sass',
    location: 'Home office',
    startAt: isoAtHour(0, 14),
    endAt: isoAtHour(0, 17),
    isRecurring: false,
  },
  {
    id: 'evt-summit-tomorrow',
    title: 'Moving job',
    categoryId: 'cat-summit',
    location: 'Denver, CO',
    startAt: isoAtHour(1, 8),
    endAt: isoAtHour(1, 13),
    isRecurring: false,
  },
  {
    id: 'evt-sleep-nightly',
    title: 'Sleep',
    categoryId: 'cat-sleep',
    startAt: isoAtHour(0, 23),
    endAt: isoAtHour(1, 7),
    isRecurring: true,
    recurrence: {
      freq: 'daily',
      until: isoDateOnly(60),
    },
  },
  {
    id: 'evt-school-weekly',
    title: 'Class',
    categoryId: 'cat-school',
    startAt: isoAtHour(0, 18),
    endAt: isoAtHour(0, 20),
    isRecurring: true,
    recurrence: {
      freq: 'weekly',
      daysOfWeek: [1, 3],
      until: isoDateOnly(60),
    },
  },
];
