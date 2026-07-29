import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MonthView } from '../MonthView';
import type { CalendarEvent, Category } from '../../types';

const categories: Category[] = [{ id: 'cat-work', name: 'Work', color: '#9A3412', isBusy: true }];

describe('MonthView', () => {
  it('renders full weeks of 7 days each', () => {
    const { container } = render(
      <MonthView date={new Date('2026-07-15')} events={[]} categories={categories} />
    );
    const dayCells = container.querySelectorAll('.grid > div');
    expect(dayCells.length % 7).toBe(0);
    expect(dayCells.length).toBeGreaterThan(0);
  });

  it('renders a category dot on the day an event occurs', () => {
    const events: CalendarEvent[] = [
      {
        id: 'evt-1',
        title: 'Client work',
        categoryId: 'cat-work',
        startAt: '2026-07-15T09:00:00',
        endAt: '2026-07-15T11:00:00',
        isRecurring: false,
      },
    ];
    const { container } = render(
      <MonthView date={new Date('2026-07-15')} events={events} categories={categories} />
    );
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);
  });
});
