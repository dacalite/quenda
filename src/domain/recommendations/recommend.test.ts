// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { getAvailability } from '../rules/availability';
import { makeContext, makeFacility, makeReservation } from '../rules/fixtures.test-utils';
import { addDays } from '../time';
import { occupancyByStart, recommendSlots } from './recommend';

const TUESDAY = '2026-10-20';
const facility = makeFacility({
  subspaces: [{ id: 'court', name: { gl: 'Pista', es: 'Pista' }, capacity: 1, contains: [] }],
});
const booked = (weeksAgo: number, start: string, subspaceId = 'court') =>
  makeReservation({
    subspaceId,
    date: addDays(TUESDAY, -7 * weeksAgo),
    start,
    end: `${String(Number(start.slice(0, 2)) + 1).padStart(2, '0')}:00`,
  });

// 18:00 booked every week, 19:00 half the weeks, 10:00 once.
const history = [
  ...[1, 2, 3, 4, 5, 6, 7, 8].map((w) => booked(w, '18:00')),
  ...[1, 3, 5, 7].map((w) => booked(w, '19:00')),
  booked(2, '10:00'),
];

describe('occupancyByStart', () => {
  it('averages bookings on the same weekday over eight weeks', () => {
    const occupancy = occupancyByStart(makeContext({ facility, reservations: history }), TUESDAY);
    expect(occupancy.get('18:00')).toBe(1);
    expect(occupancy.get('19:00')).toBe(0.5);
    expect(occupancy.get('10:00')).toBe(0.125);
    expect(occupancy.get('09:00')).toBe(0);
  });

  it('ignores closed days so holidays do not look quiet', () => {
    const holidays = [
      { id: 'h', tenantId: 't1', date: addDays(TUESDAY, -7), name: { gl: 'F', es: 'F' } },
    ];
    const occupancy = occupancyByStart(
      makeContext({ facility, reservations: history, holidays }),
      TUESDAY,
    );
    expect(occupancy.get('19:00')).toBeCloseTo(3 / 7);
  });

  it('counts shared spaces by the places taken', () => {
    const gym = makeFacility({
      subspaces: [{ id: 'gym', name: { gl: 'X', es: 'G' }, capacity: 4, contains: [] }],
    });
    const rows = [1, 2, 3, 4, 5, 6, 7, 8].map((w) => booked(w, '18:00', 'gym'));
    const occupancy = occupancyByStart(makeContext({ facility: gym, reservations: rows }), TUESDAY);
    expect(occupancy.get('18:00')).toBe(0.25);
  });
});

describe('recommendSlots', () => {
  it('suggests the quietest free slots, below 40 % occupancy, quietest first', () => {
    const today = makeReservation({
      subspaceId: 'court',
      date: TUESDAY,
      start: '09:00',
      end: '10:00',
    });
    const context = makeContext({ facility, reservations: [...history, today] });
    const recommendations = recommendSlots(
      getAvailability(context, TUESDAY),
      occupancyByStart(context, TUESDAY),
      3,
    );
    expect(recommendations.map((r) => r.start)).toEqual(['11:00', '12:00', '13:00']);
    expect(recommendations[0]).toEqual({ start: '11:00', end: '12:00', expectedOccupancy: 0 });
  });

  it('never recommends a busy time, and returns each time once', () => {
    const context = makeContext({
      facility: makeFacility(),
      reservations: history.map((r) => ({ ...r, subspaceId: 'half-a' })),
    });
    const result = recommendSlots(
      getAvailability(context, TUESDAY),
      occupancyByStart(context, TUESDAY),
      20,
    );
    expect(result.map((r) => r.start)).not.toContain('18:00');
    expect(new Set(result.map((r) => r.start)).size).toBe(result.length);
  });
});
