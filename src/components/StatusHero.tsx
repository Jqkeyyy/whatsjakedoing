import type { StatusResult } from '../lib/status';

interface StatusHeroProps {
  status: StatusResult;
}

export function StatusHero({ status }: StatusHeroProps) {
  return (
    <div className="rounded-2xl bg-surface p-6 shadow-depth">
      <p className="text-xs font-semibold uppercase tracking-wide text-ember">Right now</p>
      <p className="font-display mt-1 text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {status.label}
      </p>
      <p className="mt-1 text-sm text-muted">{status.isBusy ? 'Busy' : 'Free'}</p>
    </div>
  );
}
