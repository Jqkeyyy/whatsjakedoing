import type { StatusResult } from '../lib/status';

interface StatusHeroProps {
  status: StatusResult;
}

export function StatusHero({ status }: StatusHeroProps) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-white p-6 shadow-offset">
      <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Right now</p>
      <p className="font-display mt-1 text-2xl text-terracotta">{status.label}</p>
      <p className="mt-1 text-sm text-stone-600">{status.isBusy ? 'Busy' : 'Free'}</p>
    </div>
  );
}
