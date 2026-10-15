// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { makeContext, makeReservation } from './fixtures.test-utils';
import { detectConflicts, expandRecurring } from './recurring';

const booking = {
  facilityId: 'pitch',
  subspaceId: 'whole',
  weekday: 2 as const,
  times: { start: '18:00', end: '20:00' },
  season: { from: '2026-09-01', to: '2027-06-30' },
  exceptions: ['2026-11-03'],
};

describe('expandRecurring', () => {
  it('lists the weekday dates inside both the season and the range, minus exceptions', () => {
    expect(expandRecurring(booking, { from: '2026-10-19', to: '2026-11-15' })).toEqual([
      '2026-10-20',
      '2026-10-27',
      '2026-11-10',
    ]);
  });

  it('clips to the season', () => {
    const dates = expandRecurring(booking, { from: '2026-08-01', to: '2026-09-10' });
    expect(dates).toEqual(['2026-09-01', '2026-09-08']);
    expect(expandRecurring(booking, { from: '2027-07-01', to: '2027-08-01' })).toEqual([]);
  });
});

describe('detectConflicts', () => {
  it('reports each date where the slot is not available, with the reason', () => {
    const reservations = [
      makeReservation({ date: '2026-10-27', subspaceId: 'half-b', start: '19:00', end: '20:00' }),
    ];
    const holidays = [
      { id: 'h', tenantId: 't1', date: '2026-11-10', name: { gl: 'Festa', es: 'Fiesta' } },
    ];
    const context = makeContext({
      reservations,
      holidays,
      now: { date: '2026-10-01', time: '09:00' },
    });
    const dates = expandRecurring(booking, { from: '2026-10-19', to: '2026-11-15' });

    expect(detectConflicts(context, booking, dates)).toEqual([
      { date: '2026-10-27', problem: 'booked' },
      { date: '2026-11-10', problem: 'closed' },
    ]);
  });
});
