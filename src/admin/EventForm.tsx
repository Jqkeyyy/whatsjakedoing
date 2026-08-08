import { useState } from 'react';
import type { Category, CalendarEvent, RecurrenceRule } from '../types';
import { createEvent, updateEvent, deleteEvent } from '../lib/adminApi';
import { chicagoWallTimeToUtcIso, utcIsoToChicagoWallTime } from '../lib/timezone';

interface EventFormProps {
  categories: Category[];
  initialEvent?: CalendarEvent;
  onSaved: () => void;
  onClose: () => void;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function EventForm({ categories, initialEvent, onSaved, onClose }: EventFormProps) {
  const [title, setTitle] = useState(initialEvent?.title ?? '');
  const [categoryId, setCategoryId] = useState(initialEvent?.categoryId ?? categories[0]?.id ?? '');
  const [location, setLocation] = useState(initialEvent?.location ?? '');
  const [start, setStart] = useState(
    initialEvent ? utcIsoToChicagoWallTime(initialEvent.startAt) : ''
  );
  const [end, setEnd] = useState(initialEvent ? utcIsoToChicagoWallTime(initialEvent.endAt) : '');
  const [isRecurring, setIsRecurring] = useState(initialEvent?.isRecurring ?? false);
  const [freq, setFreq] = useState<RecurrenceRule['freq']>(initialEvent?.recurrence?.freq ?? 'weekly');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>(initialEvent?.recurrence?.daysOfWeek ?? []);
  const [until, setUntil] = useState(initialEvent?.recurrence?.until ?? '');
  const [error, setError] = useState<string | null>(null);

  // Editing/deleting a recurring event always applies to the whole series —
  // if this instance was expanded from a recurrence, resolve back to the
  // original event id before writing.
  const seriesId = initialEvent?.id.split('__')[0];

  function toggleDay(day: number) {
    setDaysOfWeek((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (isRecurring && freq === 'weekly' && daysOfWeek.length === 0) {
      setError('Pick at least one day of the week');
      return;
    }
    try {
      const recurrence: RecurrenceRule | undefined = isRecurring
        ? { freq, daysOfWeek: freq === 'weekly' ? daysOfWeek : undefined, until }
        : undefined;
      const input = {
        title,
        categoryId,
        location: location || undefined,
        startAt: chicagoWallTimeToUtcIso(start),
        endAt: chicagoWallTimeToUtcIso(end),
        isRecurring,
        recurrence,
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
    <div className="fixed inset-0 flex items-center justify-center bg-void/80 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-depth"
      >
        <h2 className="font-display text-lg font-extrabold tracking-tight text-ink">
          {seriesId ? 'Edit event' : 'New event'}
        </h2>

        <label htmlFor="event-title" className="mt-3 block text-sm font-semibold text-ink">
          Title
        </label>
        <input
          id="event-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label htmlFor="event-category" className="mt-3 block text-sm font-semibold text-ink">
          Category
        </label>
        <select
          id="event-category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
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
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
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
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
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
          className="mt-1 w-full rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
        />

        <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-ink">
          <input type="checkbox" checked={isRecurring} onChange={(e) => setIsRecurring(e.target.checked)} />
          Repeats
        </label>

        {isRecurring && (
          <div className="mt-2 flex flex-col gap-2 rounded-lg border border-hairline p-3">
            <label htmlFor="event-freq" className="text-sm font-semibold text-ink">
              Frequency
            </label>
            <select
              id="event-freq"
              value={freq}
              onChange={(e) => setFreq(e.target.value as RecurrenceRule['freq'])}
              className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
            </select>

            {freq === 'weekly' && (
              <div>
                <p className="text-sm font-semibold text-ink">Days</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {WEEKDAY_LABELS.map((label, day) => (
                    <label key={day} className="flex items-center gap-1 text-sm text-ink">
                      <input type="checkbox" checked={daysOfWeek.includes(day)} onChange={() => toggleDay(day)} />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <label htmlFor="event-until" className="text-sm font-semibold text-ink">
              Repeat until
            </label>
            <input
              id="event-until"
              type="date"
              value={until}
              onChange={(e) => setUntil(e.target.value)}
              required
              className="rounded-lg border border-hairline bg-void px-2 py-1 text-ink focus:border-ember focus:outline-none"
            />
          </div>
        )}

        {error && <p className="mt-2 text-sm text-red-400">{error}</p>}

        <div className="mt-4 flex justify-between">
          <button type="button" onClick={onClose} className="text-sm font-semibold text-ink">
            Cancel
          </button>
          <div className="flex gap-2">
            {seriesId && (
              <button
                type="button"
                onClick={handleDelete}
                className="rounded-full bg-surface px-3 py-1.5 text-sm font-semibold text-red-400 shadow-depth"
              >
                Delete
              </button>
            )}
            <button
              type="submit"
              className="rounded-full bg-ember px-3 py-1.5 text-sm font-semibold text-void"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
