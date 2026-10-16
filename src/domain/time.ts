// SPDX-License-Identifier: EUPL-1.2
import type { DateRange, IsoDate, Time, TimeRange, Weekday } from './types';

const DAY_MS = 86_400_000;
const MINUTES_PER_DAY = 1440;

export interface LocalDateTime {
  date: IsoDate;
  time: Time;
}

const pad = (value: number) => String(value).padStart(2, '0');
const utcMidnight = (date: IsoDate) => Date.parse(`${date}T00:00:00Z`);

export const toMinutes = (time: Time) => Number(time.slice(0, 2)) * 60 + Number(time.slice(3, 5));

export const fromMinutes = (minutes: number): Time =>
  `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const addDays = (date: IsoDate, days: number): IsoDate =>
  new Date(utcMidnight(date) + days * DAY_MS).toISOString().slice(0, 10);

export const daysBetween = (from: IsoDate, to: IsoDate) =>
  Math.round((utcMidnight(to) - utcMidnight(from)) / DAY_MS);

export const weekdayOf = (date: IsoDate) =>
  (((new Date(utcMidnight(date)).getUTCDay() + 6) % 7) + 1) as Weekday;

export const startOfWeek = (date: IsoDate) => addDays(date, 1 - weekdayOf(date));

export const isInDateRange = (date: IsoDate, range: DateRange) =>
  date >= range.from && date <= range.to;

export const rangesOverlap = (a: TimeRange, b: TimeRange) =>
  toMinutes(a.start) < toMinutes(b.end) && toMinutes(b.start) < toMinutes(a.end);

// shortcut: wall-clock difference ignores DST jumps (±1 h twice a year); use a tz library if exact limits on those nights matter.
export const minutesBetween = (from: LocalDateTime, to: LocalDateTime) =>
  daysBetween(from.date, to.date) * MINUTES_PER_DAY + toMinutes(to.time) - toMinutes(from.time);

/** Chronological order for anything with a date and a start time. */
export const byDateAndStart = (
  a: { date: IsoDate; start: Time },
  b: { date: IsoDate; start: Time },
) => a.date.localeCompare(b.date) || a.start.localeCompare(b.start);

export type Daypart = 'morning' | 'afternoon' | 'evening';

/** Groups slots the way people talk about them: mañá, tarde, noite. */
export const daypart = (time: Time): Daypart =>
  time < '14:00' ? 'morning' : time < '20:00' ? 'afternoon' : 'evening';

export function zonedNow(now: Date, timeZone: string): LocalDateTime {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return {
    date: `${String(parts.year)}-${String(parts.month)}-${String(parts.day)}`,
    time: `${String(parts.hour)}:${String(parts.minute)}`,
  };
}
