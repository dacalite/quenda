// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { affectedByBlock } from './blocks';
import { makeBlock, makeFacility, makeReservation, NOW } from './fixtures.test-utils';

describe('affectedByBlock', () => {
  const facility = makeFacility();
  const at = (start: string, end: string, overrides = {}) =>
    makeReservation({ start, end, ...overrides });

  it('finds confirmed bookings that overlap the block in time and space', () => {
    const inside = at('09:00', '10:00');
    const whole = at('10:00', '11:00', { subspaceId: 'whole' });
    const rows = [
      inside,
      whole,
      at('11:00', '12:00'),
      at('09:00', '10:00', { status: 'cancelled' }),
      at('09:00', '10:00', { date: '2026-10-21' }),
      at('09:00', '10:00', { facilityId: 'pool' }),
    ];
    expect(affectedByBlock(facility, makeBlock(), rows, NOW)).toEqual([inside, whole]);
  });

  it('only touches the blocked subspace and the spaces that contain it', () => {
    const halfA = at('09:00', '10:00', { subspaceId: 'half-a' });
    const halfB = at('09:00', '10:00', { subspaceId: 'half-b' });
    const whole = at('10:00', '11:00', { subspaceId: 'whole' });
    const block = makeBlock({ subspaceId: 'half-a' });
    expect(affectedByBlock(facility, block, [halfA, halfB, whole], NOW)).toEqual([halfA, whole]);
  });

  it('leaves bookings that have already started alone', () => {
    const today = makeBlock({ dates: { from: NOW.date, to: NOW.date } });
    const started = at('09:00', '11:00', { date: NOW.date });
    const later = at('10:30', '11:00', { date: NOW.date });
    expect(affectedByBlock(facility, today, [started, later], NOW)).toEqual([later]);
  });
});
