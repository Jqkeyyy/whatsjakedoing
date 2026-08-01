// src/__tests__/App.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from '../App';
import * as useCalendarDataModule from '../hooks/useCalendarData';
import type { Category, CalendarEvent } from '../types';

const category: Category = {
  id: 'cat-1',
  name: 'Work',
  color: '#292524',
  isBusy: true,
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('renders the status hero and hub links with no events scheduled', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Right now')).toBeInTheDocument();
    expect(screen.getByText('Nothing scheduled.')).toBeInTheDocument();
    expect(screen.getByText('Portfolio')).toBeInTheDocument();
  });

  it('renders a live event from Supabase data', () => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 1, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 2, 0);
    const event: CalendarEvent = {
      id: 'event-1',
      title: 'Standup meeting',
      categoryId: 'cat-1',
      startAt: start.toISOString(),
      endAt: end.toISOString(),
      isRecurring: false,
    };
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [category],
      events: [event],
      statusOverride: null,
      loading: false,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Standup meeting')).toBeInTheDocument();
  });

  it('shows a loading state while data is being fetched', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: true,
      error: null,
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('shows an error message when the fetch fails', () => {
    vi.spyOn(useCalendarDataModule, 'useCalendarData').mockReturnValue({
      categories: [],
      events: [],
      statusOverride: null,
      loading: false,
      error: 'Failed to load',
      refetch: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Failed to load')).toBeInTheDocument();
  });
});
