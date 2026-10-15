// SPDX-License-Identifier: EUPL-1.2
import {
  fromMinutes,
  isInDateRange,
  minutesBetween,
  rangesOverlap,
  toMinutes,
  weekdayOf,
  type LocalDateTime,
} from '../time';
import type {
  Block,
  Facility,
  Holiday,
  Id,
  IsoDate,
  Reservation,
  Schedule,
  Slot,
  Subspace,
} from '../types';

export type SlotStatus = 'free' | 'booked' | 'blocked' | 'closed' | 'past';

export interface AvailabilitySlot extends Slot {
  status: SlotStatus;
  capacity: number;
  /** Bookings already in this subspace and time (relevant when capacity > 1). */
  taken: number;
}

export interface FacilityContext {
  facility: Facility;
  schedule: Schedule;
  holidays: Holiday[];
  blocks: Block[];
  /** Reservations of this facility; other facilities' rows are ignored. */
  reservations: Reservation[];
  now: LocalDateTime;
}

export type SlotProblem = Exclude<SlotStatus, 'free'> | 'outsideOpeningHours' | 'misaligned';

const PROBLEM_PRIORITY: SlotProblem[] = ['past', 'closed', 'blocked', 'booked'];

export const occupiesSlot = (reservation: Reservation) => reservation.status !== 'cancelled';

export function openingRanges(schedule: Schedule, holidays: Holiday[], date: IsoDate) {
  const regular = schedule.weekly[weekdayOf(date)];
  const exception = schedule.exceptions.find((e) => e.date === date);
  if (holidays.some((h) => h.date === date)) return { ranges: regular, closed: true };
  if (exception?.ranges.length === 0) return { ranges: regular, closed: true };
  return { ranges: exception?.ranges ?? regular, closed: false };
}

export function subspacesOverlap(facility: Facility, a: Id, b: Id) {
  if (a === b) return true;
  const find = (id: Id) => facility.subspaces.find((s) => s.id === id);
  return Boolean(find(a)?.contains.includes(b) || find(b)?.contains.includes(a));
}

function slotStatus(
  context: FacilityContext,
  subspace: Subspace,
  slot: Slot,
  closed: boolean,
): Pick<AvailabilitySlot, 'status' | 'taken'> {
  const { facility, blocks, reservations, now } = context;
  const sameTime = reservations.filter(
    (r) =>
      occupiesSlot(r) &&
      r.facilityId === facility.id &&
      r.date === slot.date &&
      rangesOverlap(r, slot) &&
      subspacesOverlap(facility, r.subspaceId, subspace.id),
  );
  const taken = sameTime.filter((r) => r.subspaceId === subspace.id).length;
  const booked = taken >= subspace.capacity || sameTime.some((r) => r.subspaceId !== subspace.id);
  const blocked = blocks.some(
    (b) =>
      b.facilityId === facility.id &&
      (b.subspaceId === null || subspacesOverlap(facility, b.subspaceId, subspace.id)) &&
      isInDateRange(slot.date, b.dates) &&
      rangesOverlap(b.times, slot),
  );

  if (minutesBetween(now, { date: slot.date, time: slot.start }) <= 0) {
    return { status: 'past', taken };
  }
  if (closed) return { status: 'closed', taken };
  if (blocked) return { status: 'blocked', taken };
  return { status: booked ? 'booked' : 'free', taken };
}

export function getAvailability(context: FacilityContext, date: IsoDate): AvailabilitySlot[] {
  const { facility, schedule, holidays } = context;
  const { ranges, closed } = openingRanges(schedule, holidays, date);
  const step = schedule.slotMinutes;
  const slots: AvailabilitySlot[] = [];

  for (const subspace of facility.subspaces) {
    for (const range of ranges) {
      for (let m = toMinutes(range.start); m + step <= toMinutes(range.end); m += step) {
        const slot: Slot = {
          facilityId: facility.id,
          subspaceId: subspace.id,
          date,
          start: fromMinutes(m),
          end: fromMinutes(m + step),
        };
        slots.push({
          ...slot,
          capacity: subspace.capacity,
          ...slotStatus(context, subspace, slot, closed),
        });
      }
    }
  }
  return slots;
}

/** Why a booking (possibly spanning several slots) cannot take place, or `null` if it can. */
export function findSlotProblem(context: FacilityContext, slot: Slot): SlotProblem | null {
  const start = toMinutes(slot.start);
  const end = toMinutes(slot.end);
  const grid = getAvailability(context, slot.date).filter((s) => s.subspaceId === slot.subspaceId);
  const inside = grid.filter((s) => toMinutes(s.start) >= start && toMinutes(s.end) <= end);
  const covered = inside.reduce((sum, s) => sum + toMinutes(s.end) - toMinutes(s.start), 0);

  if (end <= start || covered !== end - start) {
    return grid.some((s) => rangesOverlap(s, slot)) ? 'misaligned' : 'outsideOpeningHours';
  }
  return PROBLEM_PRIORITY.find((problem) => inside.some((s) => s.status === problem)) ?? null;
}
