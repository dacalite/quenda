// SPDX-License-Identifier: EUPL-1.2
import { getAvailability, occupiesSlot } from '../rules/availability';
import { addDays, isInDateRange, weekdayOf } from '../time';
import type {
  Block,
  Channel,
  DateRange,
  Facility,
  Holder,
  Holiday,
  Id,
  IsoDate,
  Reservation,
  Schedule,
  Time,
  Weekday,
} from '../types';

export interface HeatCell {
  weekday: Weekday;
  start: Time;
  /** Share of the bookable places taken, 0 to 1. */
  occupancy: number;
}

export interface FacilityIndicators {
  facilityId: Id;
  bookings: number;
  occupancy: number;
  heatmap: HeatCell[];
}

export interface Indicators {
  range: DateRange;
  /** Bookings that were not cancelled. */
  bookings: number;
  cancellations: number;
  cancellationRate: number;
  noShows: number;
  /** No-shows among the bookings that have already taken place. */
  noShowRate: number;
  occupancy: number;
  byChannel: Record<Channel, number>;
  byHolder: Record<Holder['kind'], number>;
  facilities: FacilityIndicators[];
}

export interface IndicatorSource {
  facilities: { facility: Facility; schedule: Schedule }[];
  holidays: Holiday[];
  blocks: Block[];
  reservations: Reservation[];
}

const LONG_AGO = { date: '1970-01-01', time: '00:00' };

export const ratio = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

function datesIn(range: DateRange): IsoDate[] {
  const dates: IsoDate[] = [];
  for (let date = range.from; date <= range.to; date = addDays(date, 1)) dates.push(date);
  return dates;
}

function countBy<K extends string>(keys: readonly K[], values: K[]): Record<K, number> {
  const counts = Object.fromEntries(keys.map((key) => [key, 0])) as Record<K, number>;
  for (const value of values) counts[value] += 1;
  return counts;
}

/**
 * Occupancy counts the smallest bookable spaces only (each half of a pitch, each lane), so
 * booking the whole pitch fills both halves instead of being counted three times.
 * Closed and blocked times are not bookable, so they do not lower the figure.
 */
function facilityUsage(
  source: IndicatorSource,
  facility: Facility,
  schedule: Schedule,
  dates: IsoDate[],
) {
  const leaves = new Set(
    facility.subspaces.filter((s) => s.contains.length === 0).map((s) => s.id),
  );
  const blocks = source.blocks.filter((b) => b.facilityId === facility.id);
  const byDate = new Map<IsoDate, Reservation[]>();
  for (const r of source.reservations) {
    if (r.facilityId === facility.id && occupiesSlot(r)) {
      byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
    }
  }
  const cells = new Map<string, { weekday: Weekday; start: Time; used: number; places: number }>();
  let used = 0;
  let places = 0;

  for (const date of dates) {
    const context = {
      facility,
      schedule,
      holidays: source.holidays,
      blocks,
      reservations: byDate.get(date) ?? [],
      now: LONG_AGO,
    };
    for (const slot of getAvailability(context, date)) {
      if (!leaves.has(slot.subspaceId) || slot.status === 'closed' || slot.status === 'blocked') {
        continue;
      }
      const taken = slot.status === 'booked' ? slot.capacity : Math.min(slot.taken, slot.capacity);
      const weekday = weekdayOf(date);
      const key = `${String(weekday)} ${slot.start}`;
      const cell = cells.get(key) ?? { weekday, start: slot.start, used: 0, places: 0 };
      cell.used += taken;
      cell.places += slot.capacity;
      cells.set(key, cell);
      used += taken;
      places += slot.capacity;
    }
  }

  const heatmap = [...cells.values()]
    .map((cell) => ({
      weekday: cell.weekday,
      start: cell.start,
      occupancy: ratio(cell.used, cell.places),
    }))
    .sort((a, b) => a.weekday - b.weekday || a.start.localeCompare(b.start));
  return { used, places, heatmap };
}

export function computeIndicators(source: IndicatorSource, range: DateRange): Indicators {
  const inRange = source.reservations.filter((r) => isInDateRange(r.date, range));
  const active = inRange.filter(occupiesSlot);
  const noShows = inRange.filter((r) => r.status === 'noShow').length;
  const happened = inRange.filter((r) => r.status === 'completed' || r.status === 'noShow').length;
  const dates = datesIn(range);

  let used = 0;
  let places = 0;
  const facilities = source.facilities.map(({ facility, schedule }) => {
    const usage = facilityUsage(source, facility, schedule, dates);
    used += usage.used;
    places += usage.places;
    return {
      facilityId: facility.id,
      bookings: active.filter((r) => r.facilityId === facility.id).length,
      occupancy: ratio(usage.used, usage.places),
      heatmap: usage.heatmap,
    };
  });

  return {
    range,
    bookings: active.length,
    cancellations: inRange.length - active.length,
    cancellationRate: ratio(inRange.length - active.length, inRange.length),
    noShows,
    noShowRate: ratio(noShows, happened),
    occupancy: ratio(used, places),
    byChannel: countBy(
      ['web', 'phone', 'inPerson'],
      active.map((r) => r.channel),
    ),
    byHolder: countBy(
      ['user', 'entity'],
      active.map((r) => r.holder.kind),
    ),
    facilities,
  };
}

/** The times with the least demand, quietest first. */
export const quietestTimes = (heatmap: HeatCell[], limit = 5) =>
  heatmap
    .toSorted(
      (a, b) =>
        a.occupancy - b.occupancy || a.weekday - b.weekday || a.start.localeCompare(b.start),
    )
    .slice(0, limit);

/** The busiest time, for the text summary that goes with every chart. */
export const busiestTime = (heatmap: HeatCell[]): HeatCell | undefined =>
  heatmap.reduce<HeatCell | undefined>(
    (top, cell) => (!top || cell.occupancy > top.occupancy ? cell : top),
    undefined,
  );
