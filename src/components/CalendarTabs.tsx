import { useMemo, useState } from 'react';
import type { CalendarEvent, Category } from '../types';
import { expandAllEvents } from '../lib/recurrence';
import { getWeekDays, getMonthGrid } from '../lib/datetime';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';

type ViewMode = 'day' | 'week' | 'month';

interface CalendarTabsProps {
  events: CalendarEvent[];
  categories: Category[];
  initialDate?: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export function CalendarTabs({
  events,
  categories,
  initialDate = new Date(),
  onEventClick,
}: CalendarTabsProps) {
  const [view, setView] = useState<ViewMode>('day');
  const [date] = useState(initialDate);

  const rangeStart = useMemo(() => {
    if (view === 'day') return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    if (view === 'week') return getWeekDays(date)[0];
    return getMonthGrid(date)[0][0];
  }, [view, date]);

  const rangeEnd = useMemo(() => {
    const endOfDay = (d: Date) =>
      new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    if (view === 'day') return endOfDay(date);
    if (view === 'week') return endOfDay(getWeekDays(date)[6]);
    const grid = getMonthGrid(date);
    return endOfDay(grid[grid.length - 1][6]);
  }, [view, date]);

  const visibleEvents = useMemo(
    () => expandAllEvents(events, rangeStart, rangeEnd),
    [events, rangeStart, rangeEnd]
  );

  return (
    <div>
      <div className="flex gap-2">
        {(['day', 'week', 'month'] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setView(mode)}
            className={`rounded-full border-2 border-ink px-3 py-1 text-sm font-semibold capitalize ${
              view === mode ? 'bg-terracotta text-white' : 'bg-white text-ink'
            }`}
          >
            {mode}
          </button>
        ))}
      </div>
      <div className="mt-4">
        {view === 'day' && (
          <DayView date={date} events={visibleEvents} categories={categories} onEventClick={onEventClick} />
        )}
        {view === 'week' && (
          <WeekView date={date} events={visibleEvents} categories={categories} onEventClick={onEventClick} />
        )}
        {view === 'month' && <MonthView date={date} events={visibleEvents} categories={categories} />}
      </div>
    </div>
  );
}
