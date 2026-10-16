// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { toIcs, type CalendarEvent } from './ics';

const event: CalendarEvent = {
  uid: 'r1@quenda',
  summary: 'Pista de pádel, Pista 1',
  location: 'Rúa do Campo da Feira, 6; Bouzalonga',
  description: 'Código QDA-7K3M\nPresenta o QR na entrada.',
  date: '2026-10-20',
  start: '18:00',
  end: '19:00',
  stamp: '2026-10-15T08:00:00.000Z',
};

describe('toIcs', () => {
  const ics = toIcs([event], 'Reservas · Concello de Bouzalonga');
  const lines = ics.split('\r\n');

  it('produces a CRLF-delimited VCALENDAR with the time zone it uses', () => {
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toMatch(/\n/);
    expect(lines[0]).toBe('BEGIN:VCALENDAR');
    expect(lines).toContain('VERSION:2.0');
    expect(lines).toContain('TZID:Europe/Madrid');
  });

  it('writes local times with TZID and a UTC stamp', () => {
    expect(lines).toContain('DTSTART;TZID=Europe/Madrid:20261020T180000');
    expect(lines).toContain('DTEND;TZID=Europe/Madrid:20261020T190000');
    expect(lines).toContain('DTSTAMP:20261015T080000Z');
    expect(lines).toContain('UID:r1@quenda');
  });

  it('escapes commas, semicolons and line breaks in text', () => {
    expect(lines).toContain('SUMMARY:Pista de pádel\\, Pista 1');
    expect(lines).toContain('LOCATION:Rúa do Campo da Feira\\, 6\\; Bouzalonga');
    expect(ics).toContain('DESCRIPTION:Código QDA-7K3M\\nPresenta o QR na entrada.');
  });

  it('folds lines longer than 75 octets without splitting characters', () => {
    const long = toIcs([{ ...event, description: 'ñ'.repeat(100) }], 'Reservas');
    const encoder = new TextEncoder();
    for (const line of long.split('\r\n')) {
      expect(encoder.encode(line).length).toBeLessThanOrEqual(75);
    }
    expect(long.replace(/\r\n /g, '')).toContain(`DESCRIPTION:${'ñ'.repeat(100)}`);
  });

  it('can hold several events, for a calendar subscription', () => {
    const many = toIcs([event, { ...event, uid: 'r2@quenda' }], 'Reservas');
    expect(many.match(/BEGIN:VEVENT/g)).toHaveLength(2);
  });
});
