import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';
import type { CalendarEvent, Category } from '../../types';

const category: Category = { id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true };
const event: CalendarEvent = {
  id: 'evt-1',
  title: 'Client work',
  categoryId: 'cat-work',
  location: 'Home office',
  startAt: '2026-07-28T09:00:00',
  endAt: '2026-07-28T12:00:00',
  isRecurring: false,
};

describe('EventCard', () => {
  it('renders the event title, category, time, and location', () => {
    render(<EventCard event={event} category={category} />);
    expect(screen.getByText('Client work')).toBeInTheDocument();
    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM – 12:00 PM')).toBeInTheDocument();
    expect(screen.getByText('Home office')).toBeInTheDocument();
  });

  it('omits the location line when the event has none', () => {
    const noLocation = { ...event, location: undefined };
    render(<EventCard event={noLocation} category={category} />);
    expect(screen.queryByText('Home office')).not.toBeInTheDocument();
  });

  it('calls onClick when clicked, if provided', async () => {
    const { default: userEvent } = await import('@testing-library/user-event');
    const onClick = vi.fn();
    render(<EventCard event={event} category={category} onClick={onClick} />);
    await userEvent.click(screen.getByText(event.title));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
