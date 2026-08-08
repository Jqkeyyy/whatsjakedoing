import type { CalendarEvent, Category } from '../types';
import { getWeekDays, isSameDay, formatTimeRange, formatWeekdayLabel } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function WeekView({ date, events, categories, onEventClick }: WeekViewProps) {
  const days = getWeekDays(date);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((event) => isSameDay(new Date(event.startAt), day))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
          <div key={day.toISOString()} className="rounded-xl bg-surface p-2 shadow-depth">
            <p className="text-xs font-semibold uppercase text-faint">
              {formatWeekdayLabel(day)}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {dayEvents.map((event) => {
                const category = categories.find((c) => c.id === event.categoryId);
                return (
                  <div
                    key={event.id}
                    className={`text-xs ${onEventClick ? 'cursor-pointer' : ''}`}
                    onClick={onEventClick ? () => onEventClick(event) : undefined}
                    role={onEventClick ? 'button' : undefined}
                  >
                    <CategoryDot color={category?.color ?? '#FF8A3D'} />
                    <span className="ml-1 text-ink">{event.title}</span>
                    <span className="ml-1 text-faint">
                      {formatTimeRange(event.startAt, event.endAt)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
