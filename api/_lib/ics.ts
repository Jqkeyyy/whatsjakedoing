interface CategoryRow {
  id: string;
  name: string;
}

interface RecurrenceRule {
  freq: 'daily' | 'weekly';
  daysOfWeek?: number[];
  until: string;
}

interface EventRow {
  id: string;
  title: string;
  category_id: string;
  location: string | null;
  start_at: string;
  end_at: string;
  is_recurring: boolean;
  recurrence: RecurrenceRule | null;
}

const ICS_DAY_BY_INDEX = ['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'];

function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function formatIcsDateUtc(iso: string): string {
  return new Date(iso)
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
}

// RFC 5545 line folding: continuation lines start with a single space.
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  let folded = line.slice(0, 75);
  let rest = line.slice(75);
  while (rest.length > 0) {
    folded += '\r\n ' + rest.slice(0, 74);
    rest = rest.slice(74);
  }
  return folded;
}

function buildRRule(recurrence: RecurrenceRule): string {
  const until = formatIcsDateUtc(`${recurrence.until}T23:59:59.000Z`);
  if (recurrence.freq === 'daily') {
    return `FREQ=DAILY;UNTIL=${until}`;
  }
  const byDay = (recurrence.daysOfWeek ?? []).map((day) => ICS_DAY_BY_INDEX[day]).join(',');
  return `FREQ=WEEKLY;BYDAY=${byDay};UNTIL=${until}`;
}

function buildVEvent(event: EventRow, categoryName: string | undefined, dtStamp: string): string {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${event.id}@whatsjakedoing.com`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${formatIcsDateUtc(event.start_at)}`,
    `DTEND:${formatIcsDateUtc(event.end_at)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
  ];
  if (event.location) lines.push(`LOCATION:${escapeIcsText(event.location)}`);
  if (categoryName) lines.push(`CATEGORIES:${escapeIcsText(categoryName)}`);
  if (event.is_recurring && event.recurrence) lines.push(`RRULE:${buildRRule(event.recurrence)}`);
  lines.push('END:VEVENT');
  return lines.map(foldLine).join('\r\n');
}

export function buildIcsFeed(events: EventRow[], categories: CategoryRow[]): string {
  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const dtStamp = formatIcsDateUtc(new Date().toISOString());
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    "PRODID:-//What's Jake Doing//Calendar Feed//EN",
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    "X-WR-CALNAME:What's Jake Doing",
    ...events.map((event) => buildVEvent(event, categoryNameById.get(event.category_id), dtStamp)),
    'END:VCALENDAR',
  ];
  return lines.join('\r\n') + '\r\n';
}
