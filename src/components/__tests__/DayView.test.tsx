import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DayView } from '../DayView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('DayView', () => {
  it('shows an empty state when there are no events', () => {
    render(<DayView date={new Date('2026-07-28T12:00:00')} events={[]} categories={categories} />);
    expect(screen.getByText('Nothing scheduled.')).toBeInTheDocument();
  });

  it('renders events sorted by start time', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-2',
        title: 'Afternoon block',
        categoryId: 'cat-work',
        startAt: '2026-07-28T14:00:00',
        endAt: '2026-07-28T16:00:00',
        isRecurring: false,
      },
      {
        id: 'evt-1',
        title: 'Morning block',
        categoryId: 'cat-work',
        startAt: '2026-07-28T09:00:00',
        endAt: '2026-07-28T11:00:00',
        isRecurring: false,
      },
    ];
    render(<DayView date={new Date('2026-07-28T12:00:00')} events={events} categories={categories} />);
    const titles = screen.getAllByText(/block/).map((el) => el.textContent);
    expect(titles).toEqual(['Morning block', 'Afternoon block']);
  });
});
