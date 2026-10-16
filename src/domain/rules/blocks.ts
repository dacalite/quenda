// SPDX-License-Identifier: EUPL-1.2
import { isInDateRange, minutesBetween, rangesOverlap, type LocalDateTime } from '../time';
import type { Block, Facility, Reservation } from '../types';
import { subspacesOverlap } from './availability';

export type BlockArea = Pick<Block, 'facilityId' | 'subspaceId' | 'dates' | 'times'>;

/** Upcoming confirmed bookings that a block would make impossible. */
export function affectedByBlock(
  facility: Facility,
  block: BlockArea,
  reservations: Reservation[],
  now: LocalDateTime,
): Reservation[] {
  return reservations.filter(
    (r) =>
      r.status === 'confirmed' &&
      r.facilityId === block.facilityId &&
      isInDateRange(r.date, block.dates) &&
      rangesOverlap(r, block.times) &&
      (block.subspaceId === null || subspacesOverlap(facility, block.subspaceId, r.subspaceId)) &&
      minutesBetween(now, { date: r.date, time: r.start }) > 0,
  );
}
