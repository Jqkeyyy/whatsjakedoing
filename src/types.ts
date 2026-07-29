export interface Category {
  id: string;
  name: string;
  color: string; // hex
  icon?: string;
  isBusy: boolean;
}

export interface RecurrenceRule {
  freq: 'daily' | 'weekly';
  daysOfWeek?: number[]; // 0=Sunday..6=Saturday, required when freq is 'weekly'
  until: string; // ISO date (YYYY-MM-DD), inclusive end of recurrence
}

export interface CalendarEvent {
  id: string;
  title: string;
  categoryId: string;
  location?: string;
  startAt: string; // ISO datetime
  endAt: string; // ISO datetime
  isRecurring: boolean;
  recurrence?: RecurrenceRule;
}

export interface StatusOverride {
  id: string;
  statusText?: string;
  isBusy: boolean;
  startsAt: string; // ISO datetime
  endsAt: string; // ISO datetime
}

export interface HubLink {
  id: string;
  label: string;
  url: string;
}
