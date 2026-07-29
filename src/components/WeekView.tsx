import type { CalendarEvent, Category } from '../types';
import { getWeekDays, isSameDay, formatTimeRange, formatWeekdayLabel } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
}

export function WeekView({ date, events, categories }: WeekViewProps) {
  const days = getWeekDays(date);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-7">
      {days.map((day) => {
        const dayEvents = events
          .filter((event) => isSameDay(new Date(event.startAt), day))
          .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());

        return (
          <div key={day.toISOString()} className="rounded-xl border-2 border-ink bg-white p-2">
            <p className="text-xs font-semibold uppercase text-stone-500">
              {formatWeekdayLabel(day)}
            </p>
            <div className="mt-2 flex flex-col gap-1">
              {dayEvents.map((event) => {
                const category = categories.find((c) => c.id === event.categoryId);
                return (
                  <div key={event.id} className="text-xs">
                    <CategoryDot color={category?.color ?? '#292524'} />
                    <span className="ml-1">{event.title}</span>
                    <span className="ml-1 text-stone-500">
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
