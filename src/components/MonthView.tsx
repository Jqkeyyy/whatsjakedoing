import type { CalendarEvent, Category } from '../types';
import { getMonthGrid, isSameDay } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
}

export function MonthView({ date, events, categories }: MonthViewProps) {
  const weeks = getMonthGrid(date);

  return (
    <div className="flex flex-col gap-1">
      {weeks.map((week, weekIndex) => (
        <div key={weekIndex} className="grid grid-cols-7 gap-1">
          {week.map((day) => {
            const dayEvents = events.filter((event) => isSameDay(new Date(event.startAt), day));
            const inMonth = day.getMonth() === date.getMonth();

            return (
              <div
                key={day.toISOString()}
                className={`min-h-[64px] rounded-lg p-1 ${
                  inMonth ? 'bg-surface text-ink' : 'bg-void text-faint'
                }`}
              >
                <p className="text-xs">{day.getDate()}</p>
                <div className="mt-1 flex flex-wrap gap-0.5">
                  {dayEvents.map((event) => {
                    const category = categories.find((c) => c.id === event.categoryId);
                    return <CategoryDot key={event.id} color={category?.color ?? '#FF8A3D'} />;
                  })}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
