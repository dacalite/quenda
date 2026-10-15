// SPDX-License-Identifier: EUPL-1.2
import { addDays, weekdayOf } from '../time';
import type { DateRange, IsoDate, RecurringBooking } from '../types';
import { findSlotProblem, type FacilityContext, type SlotProblem } from './availability';

export interface RecurringConflict {
  date: IsoDate;
  problem: SlotProblem;
}

type RecurringPattern = Pick<
  RecurringBooking,
  'facilityId' | 'subspaceId' | 'weekday' | 'times' | 'season' | 'exceptions'
>;

/** Dates of the season inside `range` that fall on the booking's weekday, minus its exceptions. */
export function expandRecurring(booking: RecurringPattern, range: DateRange): IsoDate[] {
  const from = booking.season.from > range.from ? booking.season.from : range.from;
  const to = booking.season.to < range.to ? booking.season.to : range.to;
  const dates: IsoDate[] = [];
  for (
    let date = addDays(from, (booking.weekday - weekdayOf(from) + 7) % 7);
    date <= to;
    date = addDays(date, 7)
  ) {
    if (!booking.exceptions.includes(date)) dates.push(date);
  }
  return dates;
}

export function detectConflicts(
  context: FacilityContext,
  booking: RecurringPattern,
  dates: IsoDate[],
): RecurringConflict[] {
  return dates.flatMap((date) => {
    const problem = findSlotProblem(context, {
      facilityId: booking.facilityId,
      subspaceId: booking.subspaceId,
      date,
      ...booking.times,
    });
    return problem ? [{ date, problem }] : [];
  });
}
