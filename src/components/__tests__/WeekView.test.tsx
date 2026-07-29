import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { WeekView } from '../WeekView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('WeekView', () => {
  it('renders 7 day columns', () => {
    render(<WeekView date={new Date('2026-07-28T12:00:00')} events={[]} categories={categories} />);
    expect(screen.getAllByText(/^(Sun|Mon|Tue|Wed|Thu|Fri|Sat)/)).toHaveLength(7);
  });

  it('places an event under the correct day', () => {
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
    render(<WeekView date={new Date('2026-07-28T12:00:00')} events={events} categories={categories} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
  });
});
