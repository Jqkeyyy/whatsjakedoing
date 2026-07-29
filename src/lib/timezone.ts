const CHICAGO_TZ = 'America/Chicago';

function getTimeZoneOffsetMinutes(timeZone: string, date: Date): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;

  const asUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second)
  );
  return (asUtc - date.getTime()) / 60_000;
}

/** dateTimeLocal is "YYYY-MM-DDTHH:mm", interpreted as America/Chicago wall time. */
export function chicagoWallTimeToUtcIso(dateTimeLocal: string): string {
  const [datePart, timePart] = dateTimeLocal.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);

  let guessUtcMs = Date.UTC(year, month - 1, day, hour, minute);
  // One correction pass handles DST-boundary edge cases.
  const offset1 = getTimeZoneOffsetMinutes(CHICAGO_TZ, new Date(guessUtcMs));
  guessUtcMs -= offset1 * 60_000;
  const offset2 = getTimeZoneOffsetMinutes(CHICAGO_TZ, new Date(guessUtcMs));
  const finalUtcMs = Date.UTC(year, month - 1, day, hour, minute) - offset2 * 60_000;

  return new Date(finalUtcMs).toISOString();
}

/** Returns "YYYY-MM-DDTHH:mm" — the wall-clock time in America/Chicago for this UTC instant. */
export function utcIsoToChicagoWallTime(iso: string): string {
  const date = new Date(iso);
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: CHICAGO_TZ,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) map[part.type] = part.value;
  return `${map.year}-${map.month}-${map.day}T${map.hour}:${map.minute}`;
}
