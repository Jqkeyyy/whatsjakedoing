import { describe, it, expect, vi } from 'vitest';
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

  it('forwards onEventClick when an event row is clicked', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
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
    const onEventClick = vi.fn();
    render(
      <WeekView
        date={new Date('2026-07-28T12:00:00')}
        events={events}
        categories={categories}
        onEventClick={onEventClick}
      />
    );
    await userEvent.click(screen.getByText(events[0].title));
    expect(onEventClick).toHaveBeenCalledWith(events[0]);
  });
});
