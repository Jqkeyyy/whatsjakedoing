import { useState } from 'react';
import type { Category, CalendarEvent } from '../types';
import { createEvent, updateEvent, deleteEvent } from '../lib/adminApi';
import { chicagoWallTimeToUtcIso, utcIsoToChicagoWallTime } from '../lib/timezone';

interface EventFormProps {
  categories: Category[];
  initialEvent?: CalendarEvent;
  onSaved: () => void;
  onClose: () => void;
}

export function EventForm({ categories, initialEvent, onSaved, onClose }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [categoryId, setCategoryId] = useState(initialEvent?.categoryId ?? categories[0]?.id ?? '');
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [start, setStart] = useState(
    initialEvent ? utcIsoToChicagoWallTime(initialEvent.startAt) : ''
  );
  const [end, setEnd] = useState(initialEvent ? utcIsoToChicagoWallTime(initialEvent.endAt) : '');
  const [error, setError] = useState<string | null>(null);

  // Editing/deleting a recurring event always applies to the whole series —
  // if this instance was expanded from a recurrence, resolve back to the
  // original event id before writing.
  const seriesId = initialEvent?.id.split('__')[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const input = {
        title,
        categoryId,
        location: location || undefined,
        startAt: chicagoWallTimeToUtcIso(start),
        endAt: chicagoWallTimeToUtcIso(end),
        isRecurring: initialEvent?.isRecurring ?? false,
        recurrence: initialEvent?.recurrence,
      };
      if (seriesId) {
        await updateEvent(seriesId, input);
      } else {
        await createEvent(input);
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save event');
    }
  }

  async function handleDelete() {
    if (!seriesId) return;
    setError(null);
    try {
      await deleteEvent(seriesId);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete event');
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-ink/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border-2 border-ink bg-white p-6 shadow-offset"
      >
        <h2 className="font-display text-lg text-ink">{seriesId ? 'Edit event' : 'New event'}</h2>

        <label htmlFor="event-title" className="mt-3 block text-sm font-semibold text-ink">
          Title
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-category" className="mt-3 block text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id="event-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <label htmlFor="event-location" className="mt-3 block text-sm font-semibold text-ink">
          Location
        </label>
        <input
          id="event-location"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-start" className="mt-3 block text-sm font-semibold text-ink">
          Start (Central time)
        </label>
        <input
          id="event-start"
          type="datetime-local"
          value={start}
          onChange={(e) => setStart(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        <label htmlFor="event-end" className="mt-3 block text-sm font-semibold text-ink">
          End (Central time)
        </label>
        <input
          id="event-end"
          type="datetime-local"
          value={end}
          onChange={(e) => setEnd(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border-2 border-ink px-2 py-1"
        />

        {error && <p className="mt-2 text-sm text-terracotta">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink">
            Cancel
          </button>
          <div className="flex gap-2">
            {seriesId && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-terracotta"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
