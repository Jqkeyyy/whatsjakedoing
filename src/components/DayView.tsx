import type { CalendarEvent, Category } from '../types';
import { EventCard } from './EventCard';
import { formatDayHeading } from '../lib/datetime';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  categories: Category[];
  onEventClick?: (event: CalendarEvent) => void;
}

export function DayView({ date, events, categories, onEventClick }: DayViewProps) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()
  );

  return (
    <div>
      <h2 className="font-display text-lg text-ink">{formatDayHeading(date)}</h2>
      <div className="mt-3 flex flex-col gap-2">
        {sorted.length === 0 && <p className="text-sm text-stone-500">Nothing scheduled.</p>}
        {sorted.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            category={categories.find((c) => c.id === event.categoryId)}
            onClick={onEventClick ? () => onEventClick(event) : undefined}
          />
        ))}
      </div>
    </div>
  );
}
