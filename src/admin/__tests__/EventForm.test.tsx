import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EventForm } from '../EventForm';
import * as adminApi from '../../lib/adminApi';
import type { Category, CalendarEvent } from '../../types';

const categories: Category[] = [{ id: 'c1', name: 'Work', color: '#9A3412', isBusy: true }];

beforeEach(() => {
  vi.restoreAllMocks();
});

// datetime-local inputs don't reliably support userEvent.type() keystroke
// simulation in jsdom — set the value directly via fireEvent.change instead.

describe('EventForm — create mode', () => {
  it('creates a new event with the Chicago-interpreted start/end times', async () => {
    vi.spyOn(adminApi, 'createEvent').mockResolvedValue({
      id: 'e1',
      title: 'Gym',
      categoryId: 'c1',
      startAt: '2026-07-29T15:00:00.000Z',
      endAt: '2026-07-29T16:00:00.000Z',
      isRecurring: false,
    });
    const onSaved = vi.fn();
    render(<EventForm categories={categories} onSaved={onSaved} onClose={vi.fn()} />);

    await userEvent.type(screen.getByLabelText(/title/i), 'Gym');
    fireEvent.change(screen.getByLabelText(/^start/i), { target: { value: '2026-07-29T10:00' } });
    fireEvent.change(screen.getByLabelText(/^end/i), { target: { value: '2026-07-29T11:00' } });
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(adminApi.createEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Gym',
        categoryId: 'c1',
        startAt: '2026-07-29T15:00:00.000Z',
        endAt: '2026-07-29T16:00:00.000Z',
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });
});

describe('EventForm — edit mode', () => {
  const existing: CalendarEvent = {
    id: 'e1',
    title: 'Gym',
    categoryId: 'c1',
    startAt: '2026-07-29T15:00:00.000Z',
    endAt: '2026-07-29T16:00:00.000Z',
    isRecurring: false,
  };

  it('pre-fills the form and updates on save', async () => {
    vi.spyOn(adminApi, 'updateEvent').mockResolvedValue(existing);
    const onSaved = vi.fn();
    render(<EventForm categories={categories} initialEvent={existing} onSaved={onSaved} onClose={vi.fn()} />);

    expect(screen.getByLabelText(/title/i)).toHaveValue('Gym');
    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    expect(adminApi.updateEvent).toHaveBeenCalledWith('e1', expect.objectContaining({ title: 'Gym' }));
    expect(onSaved).toHaveBeenCalled();
  });

  it('deletes the event when Delete is clicked', async () => {
    vi.spyOn(adminApi, 'deleteEvent').mockResolvedValue(undefined);
    const onSaved = vi.fn();
    render(<EventForm categories={categories} initialEvent={existing} onSaved={onSaved} onClose={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /delete/i }));

    expect(adminApi.deleteEvent).toHaveBeenCalledWith('e1');
    expect(onSaved).toHaveBeenCalled();
  });
});
