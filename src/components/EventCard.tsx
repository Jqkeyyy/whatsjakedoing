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
      className={`rounded-xl bg-surface p-3 shadow-depth ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
    >
      <div className="flex items-center justify-between">
        <span className="font-display font-extrabold tracking-tight text-ink">{event.title}</span>
        <CategoryDot color={category?.color ?? '#FF8A3D'} label={category?.name} />
      </div>
      <p className="mt-1 text-sm text-muted">{formatTimeRange(event.startAt, event.endAt)}</p>
      {event.location && <p className="mt-0.5 text-xs text-faint">{event.location}</p>}
    </div>
  );
}
