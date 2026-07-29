import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CalendarTabs } from '../CalendarTabs';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

const events: CalendarEvent[] = [
  {
    id: 'evt-1',
    title: 'Client work',
    categoryId: 'cat-work',
    startAt: '2026-07-28T09:00:00',
    endAt: '2026-07-28T11:00:00',
    isRecurring: false,
  },
];

describe('CalendarTabs', () => {
  it('defaults to the Day view', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    expect(screen.getByText('Client work')).toBeInTheDocument();
  });

  it('switches to Week view when the Week tab is clicked', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'week' }));
    expect(screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/).length).toBeGreaterThan(0);
  });

  it('switches to Month view when the Month tab is clicked', () => {
    render(
      <CalendarTabs events={events} categories={categories} initialDate={new Date('2026-07-28T12:00:00')} />
    );
    fireEvent.click(screen.getByRole('button', { name: 'month' }));
    expect(screen.queryByText('Client work')).not.toBeInTheDocument();
  });

  it('includes a late-day recurring instance on the last day of the visible week', () => {
    // 2026-07-28 is a Tuesday; its week runs Sun 2026-07-26 to Sat 2026-08-01.
    const recurringEvents: CalendarEvent[] = [
      {
        id: 'evt-sleep',
        title: 'Sleep',
        categoryId: 'cat-work',
        startAt: '2026-07-01T23:00:00',
        endAt: '2026-07-02T07:00:00',
        isRecurring: true,
        recurrence: { freq: 'daily', until: '2026-12-31' },
      },
    ];
    render(
      <CalendarTabs
        events={recurringEvents}
        categories={categories}
        initialDate={new Date('2026-07-28T12:00:00')}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'week' }));
    expect(screen.getAllByText('Sleep')).toHaveLength(7);
  });
});
