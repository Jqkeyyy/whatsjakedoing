import { useState } from 'react';
import type { StatusOverride } from '../types';
import { setStatusOverride, clearStatusOverride } from '../lib/adminApi';
import { chicagoWallTimeToUtcIso } from '../lib/timezone';

interface StatusOverrideControlProps {
  current: StatusOverride | null;
  onChange: () => void;
}

export function StatusOverrideControl({ current, onChange }: StatusOverrideControlProps) {
  const [statusText, setStatusText] = useState('');
  const [isBusy, setIsBusy] = useState(true);
  const [until, setUntil] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function handleSet(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await setStatusOverride({
        statusText: statusText || undefined,
        isBusy,
        startsAt: new Date().toISOString(),
        endsAt: chicagoWallTimeToUtcIso(until),
      });
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set status');
    }
  }

  async function handleClear() {
    if (!current) return;
    setError(null);
    try {
      await clearStatusOverride(current.id);
      onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear status');
    }
  }

  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-4 shadow-offset">
      <h2 className="font-display text-lg text-ink">Status override</h2>

      {current ? (
        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm text-ink">
            {current.statusText ?? (current.isBusy ? 'Busy' : 'Free')} until{' '}
            {new Date(current.endsAt).toLocaleString()}
          </p>
          <button
            type="button"
            onClick={handleClear}
            className="rounded-full border-2 border-ink px-3 py-1.5 text-sm font-semibold text-terracotta"
          >
            Clear
          </button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="mt-2 flex flex-col gap-2">
          <label htmlFor="override-text" className="text-sm font-semibold text-ink">
            Status text
          </label>
          <input
            id="override-text"
            value={statusText}
            onChange={(e) => setStatusText(e.target.value)}
            className="rounded-lg border-2 border-ink px-2 py-1"
          />
          <label className="flex items-center gap-2 text-sm text-ink">
            <input type="checkbox" checked={isBusy} onChange={(e) => setIsBusy(e.target.checked)} />
            Busy
          </label>
          <label htmlFor="override-until" className="text-sm font-semibold text-ink">
            Until (Central time)
          </label>
          <input
            id="override-until"
            type="datetime-local"
            value={until}
            onChange={(e) => setUntil(e.target.value)}
            className="rounded-lg border-2 border-ink px-2 py-1"
          />
          {error && <p className="text-sm text-terracotta">{error}</p>}
          <button
            type="submit"
            className="rounded-full border-2 border-ink bg-terracotta px-3 py-1.5 text-sm font-semibold text-white"
          >
            Set status
          </button>
        </form>
      )}
    </div>
  );
}
