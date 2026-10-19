// SPDX-License-Identifier: EUPL-1.2
import { TIME_ZONE, type CalendarEvent } from './ics';
import { zonedNow } from './time';
import type { IsoDate, Time } from './types';

// Links the person opens themselves: nothing is sent to Google or Microsoft until they choose to.

const compact = (date: IsoDate, time: Time) =>
  `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

/** The UTC instant of a wall-clock time in a zone, with that day's offset (summer time included). */
export function zonedToUtc(date: IsoDate, time: Time, timeZone: string): string {
  const wall = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
    Number(time.slice(0, 2)),
    Number(time.slice(3, 5)),
  );
  const seen = zonedNow(new Date(wall), timeZone);
  const offset =
    Date.UTC(
      Number(seen.date.slice(0, 4)),
      Number(seen.date.slice(5, 7)) - 1,
      Number(seen.date.slice(8, 10)),
      Number(seen.time.slice(0, 2)),
      Number(seen.time.slice(3, 5)),
    ) - wall;
  return new Date(wall - offset).toISOString().replace('.000Z', 'Z');
}

export function googleCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.summary,
    dates: `${compact(event.date, event.start)}/${compact(event.date, event.end)}`,
    ctz: TIME_ZONE,
    location: event.location,
    details: event.description,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function outlookCalendarUrl(event: CalendarEvent): string {
  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    subject: event.summary,
    startdt: zonedToUtc(event.date, event.start, TIME_ZONE),
    enddt: zonedToUtc(event.date, event.end, TIME_ZONE),
    location: event.location,
    body: event.description,
  });
  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}
