// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { googleCalendarUrl, outlookCalendarUrl, zonedToUtc } from './calendarLinks';
import type { CalendarEvent } from './ics';

const event: CalendarEvent = {
  uid: 'r1@quenda',
  summary: 'Pista de pádel, Pista 1',
  location: 'Rúa do Campo da Feira, 6, Bouzalonga',
  description: 'Código de reserva: QDA-7K3M',
  date: '2026-10-20',
  start: '18:00',
  end: '19:00',
  stamp: '2026-10-15T08:00:00.000Z',
};

describe('zonedToUtc', () => {
  it('uses summer time before the last Sunday of October and winter time after it', () => {
    expect(zonedToUtc('2026-10-20', '18:00', 'Europe/Madrid')).toBe('2026-10-20T16:00:00Z');
    expect(zonedToUtc('2026-11-20', '18:00', 'Europe/Madrid')).toBe('2026-11-20T17:00:00Z');
  });
});

describe('googleCalendarUrl', () => {
  it('fills in a new event with local times in the council’s zone', () => {
    const url = new URL(googleCalendarUrl(event));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('Pista de pádel, Pista 1');
    expect(url.searchParams.get('dates')).toBe('20261020T180000/20261020T190000');
    expect(url.searchParams.get('ctz')).toBe('Europe/Madrid');
    expect(url.searchParams.get('location')).toBe(event.location);
    expect(url.searchParams.get('details')).toBe(event.description);
  });
});

describe('outlookCalendarUrl', () => {
  it('fills in a new event with UTC times', () => {
    const url = new URL(outlookCalendarUrl(event));
    expect(url.hostname).toBe('outlook.live.com');
    expect(url.searchParams.get('subject')).toBe('Pista de pádel, Pista 1');
    expect(url.searchParams.get('startdt')).toBe('2026-10-20T16:00:00Z');
    expect(url.searchParams.get('enddt')).toBe('2026-10-20T17:00:00Z');
    expect(url.searchParams.get('location')).toBe(event.location);
  });
});
