// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import {
  makeBlock,
  makeFacility,
  makeReservation,
  makeSchedule,
} from '../rules/fixtures.test-utils';
import { busiestTime, computeIndicators, quietestTimes } from './indicators';

const TUESDAY = '2026-10-20';
const entity = { kind: 'entity', entityId: 'club' } as const;

// Tuesday has 11 one-hour slots and two halves of the pitch: 22 places, minus the blocked hour.
const source = {
  facilities: [{ facility: makeFacility(), schedule: makeSchedule() }],
  holidays: [],
  blocks: [makeBlock({ times: { start: '13:00', end: '14:00' } })],
  reservations: [
    makeReservation({ start: '18:00', end: '19:00' }),
    makeReservation({
      subspaceId: 'whole',
      start: '10:00',
      end: '11:00',
      channel: 'phone',
      holder: entity,
    }),
    makeReservation({ subspaceId: 'half-b', start: '12:00', end: '13:00', status: 'cancelled' }),
    makeReservation({ start: '09:00', end: '10:00', status: 'noShow', channel: 'inPerson' }),
    makeReservation({ subspaceId: 'half-b', start: '09:00', end: '10:00', status: 'completed' }),
    makeReservation({ date: '2026-10-21' }),
  ],
};

describe('computeIndicators', () => {
  const indicators = computeIndicators(source, { from: TUESDAY, to: TUESDAY });

  it('counts bookings, cancellations and no-shows in the range', () => {
    expect(indicators).toMatchObject({
      bookings: 4,
      cancellations: 1,
      cancellationRate: 0.2,
      noShows: 1,
      noShowRate: 0.5,
      byChannel: { web: 2, phone: 1, inPerson: 1 },
      byHolder: { user: 3, entity: 1 },
    });
  });

  it('measures occupancy on the smallest spaces, leaving closed and blocked hours out', () => {
    expect(indicators.occupancy).toBe(5 / 20);
    const [pitch] = indicators.facilities;
    expect(pitch).toMatchObject({ facilityId: 'pitch', bookings: 4, occupancy: 5 / 20 });
    const cell = (start: string) => pitch?.heatmap.find((c) => c.start === start);
    expect(cell('10:00')).toEqual({ weekday: 2, start: '10:00', occupancy: 1 });
    expect(cell('18:00')?.occupancy).toBe(0.5);
    expect(cell('13:00')).toBeUndefined();
  });

  it('points out the quietest and the busiest times', () => {
    const heatmap = indicators.facilities[0]?.heatmap ?? [];
    expect(quietestTimes(heatmap, 2).map((c) => c.start)).toEqual(['11:00', '12:00']);
    expect(busiestTime(heatmap)?.start).toBe('09:00');
    expect(busiestTime([])).toBeUndefined();
  });

  it('returns zero rates when there is nothing to measure', () => {
    const empty = computeIndicators(
      { ...source, reservations: [] },
      { from: '2026-10-25', to: '2026-10-25' },
    );
    expect(empty).toMatchObject({ bookings: 0, cancellationRate: 0, noShowRate: 0, occupancy: 0 });
  });
});
