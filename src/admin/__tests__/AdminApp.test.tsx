// src/admin/__tests__/AdminApp.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminApp } from '../AdminApp';
import * as adminApi from '../../lib/adminApi';
import * as useCalendarDataModule from '../../hooks/useCalendarData';
import type { Category, CalendarEvent } from '../../types';

const category: Category = {
  id: 'cat-1',
  name: 'Work',
  color: '#292524',
  isBusy: true,
};

const event: CalendarEvent = {
  id: 'event-1',
  title: 'Standup meeting',
  categoryId: 'cat-1',
  startAt: '2026-07-30T14:00:00.000Z',
  endAt: '2026-07-30T14:30:00.000Z',
  isRecurring: false,
};

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
    categories: [],
    events: [],
    statusOverride: null,
    loading: false,
    error: null,
    refetch: vi.fn(),
  });
});

describe('AdminApp', () => {
  it('shows the login form when there is no valid session', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(false);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  it('shows the admin shell when the session is valid', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    render(<AdminApp />);
    expect(await screen.findByRole('button', { name: /log out/i })).toBeInTheDocument();
    expect(screen.getByText('Right now')).toBeInTheDocument();
  });

  it('shows an error and stays authenticated when logout fails', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    vi.spyOn(adminApi, 'logout').mockRejectedValue(new Error('Logout failed'));
    const user = userEvent.setup();

    render(<AdminApp />);
    const logoutButton = await screen.findByRole('button', { name: /log out/i });
    await user.click(logoutButton);

    expect(await screen.findByText('Logout failed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('opens EventForm pre-filled when a calendar event is clicked', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [category],
      events: [event],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();

    render(<AdminApp />);
    const eventButton = await screen.findByRole('button', { name: /standup meeting/i });
    await user.click(eventButton);

    const titleInput = (await screen.findByLabelText(/title/i)) as HTMLInputElement;
    expect(titleInput.value).toBe('Standup meeting');
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('opens EventForm empty in create mode when the Add event FAB is clicked', async () => {
    vi.spyOn(adminApi, 'checkSession').mockResolvedValue(true);
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [category],
      events: [event],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });
    const user = userEvent.setup();

    render(<AdminApp />);
    const addButton = await screen.findByRole('button', { name: /add event/i });
    await user.click(addButton);

    const titleInput = (await screen.findByLabelText(/title/i)) as HTMLInputElement;
    expect(titleInput.value).toBe('');
    expect(screen.queryByRole('button', { name: 'Delete' })).not.toBeInTheDocument();
  });
});
