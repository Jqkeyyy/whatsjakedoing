import type { CalendarEvent, Category } from '../types';
import { formatTimeRange } from '../lib/datetime';
import { CategoryDot } from './CategoryDot';

interface EventCardProps {
  event: CalendarEvent;
  category: Category | undefined;
  onClick?: () => void;
}

export function EventCard({ event, category, onClick }: EventCardProps) {
  return (
    <div
      className={`rounded-xl border-2 border-ink bg-white p-3 shadow-offset ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-display text-ink">{event.title}</span>
        <CategoryDot color={category?.color ?? '#292524'} label={category?.name} />
      </div>
      <p className="mt-1 text-sm text-stone-600">{formatTimeRange(event.startAt, event.endAt)}</p>
      {event.location && <p className="mt-0.5 text-xs text-stone-500">{event.location}</p>}
    </div>
  );
}
