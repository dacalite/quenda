// SPDX-License-Identifier: EUPL-1.2
import type { Instant, IsoDate, Time } from './types';

export interface CalendarEvent {
  uid: string;
  summary: string;
  location: string;
  description: string;
  date: IsoDate;
  start: Time;
  end: Time;
  /** When the event was last changed. */
  stamp: Instant;
}

// shortcut: only the Europe/Madrid zone is described; councils in Canarias would need Atlantic/Canary.
const TIME_ZONE = 'Europe/Madrid';
const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TIME_ZONE}`,
  'BEGIN:DAYLIGHT',
  'TZOFFSETFROM:+0100',
  'TZOFFSETTO:+0200',
  'TZNAME:CEST',
  'DTSTART:19700329T020000',
  'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU',
  'END:DAYLIGHT',
  'BEGIN:STANDARD',
  'TZOFFSETFROM:+0200',
  'TZOFFSETTO:+0100',
  'TZNAME:CET',
  'DTSTART:19701025T030000',
  'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU',
  'END:STANDARD',
  'END:VTIMEZONE',
];

const escapeText = (value: string) =>
  value.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const localDateTime = (date: IsoDate, time: Time) =>
  `${date.replace(/-/g, '')}T${time.replace(':', '')}00`;

const utcStamp = (instant: Instant) => `${instant.slice(0, 19).replace(/[-:]/g, '')}Z`;

/** RFC 5545 §3.1: lines longer than 75 octets continue on the next line after a space. */
function fold(line: string) {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = '';
  for (const char of line) {
    const limit = parts.length === 0 ? 75 : 74;
    if (encoder.encode(current + char).length > limit) {
      parts.push(current);
      current = char;
    } else {
      current += char;
    }
  }
  parts.push(current);
  return parts.join('\r\n ');
}

export function toIcs(events: CalendarEvent[], calendarName: string): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Quenda//Reservas//GL',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${TIME_ZONE}`,
    ...VTIMEZONE,
    ...events.flatMap((event) => [
      'BEGIN:VEVENT',
      `UID:${event.uid}`,
      `DTSTAMP:${utcStamp(event.stamp)}`,
      `DTSTART;TZID=${TIME_ZONE}:${localDateTime(event.date, event.start)}`,
      `DTEND;TZID=${TIME_ZONE}:${localDateTime(event.date, event.end)}`,
      `SUMMARY:${escapeText(event.summary)}`,
      `LOCATION:${escapeText(event.location)}`,
      `DESCRIPTION:${escapeText(event.description)}`,
      'END:VEVENT',
    ]),
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}
