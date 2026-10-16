// SPDX-License-Identifier: EUPL-1.2
import {
  getAvailability,
  type AvailabilitySlot,
  type FacilityContext,
} from '../rules/availability';
import { addDays } from '../time';
import type { IsoDate, Time } from '../types';

export interface Recommendation {
  start: Time;
  end: Time;
  /** Average share of the facility booked at this time on the same weekday, 0 to 1. */
  expectedOccupancy: number;
}

const HISTORY_WEEKS = 8;
const MAX_OCCUPANCY = 0.4;

/**
 * Average occupancy per start time on the same weekday over the previous weeks.
 * Closed days do not count, so a holiday does not make a time look quiet.
 */
export function occupancyByStart(context: FacilityContext, date: IsoDate, weeks = HISTORY_WEEKS) {
  const totals = new Map<Time, { used: number; capacity: number }>();
  const longAgo = { date: '1970-01-01', time: '00:00' };
  for (let week = 1; week <= weeks; week++) {
    const slots = getAvailability({ ...context, now: longAgo }, addDays(date, -7 * week));
    if (slots.every((slot) => slot.status === 'closed')) continue;
    for (const slot of slots) {
      const total = totals.get(slot.start) ?? { used: 0, capacity: 0 };
      const used = slot.status === 'booked' ? slot.capacity : Math.min(slot.taken, slot.capacity);
      totals.set(slot.start, {
        used: total.used + used,
        capacity: total.capacity + slot.capacity,
      });
    }
  }
  return new Map([...totals].map(([start, { used, capacity }]) => [start, used / capacity]));
}

/** Free slots that are usually quiet, quietest first. Simple and explainable on purpose. */
export function recommendSlots(
  availability: AvailabilitySlot[],
  occupancy: Map<Time, number>,
  limit = 3,
): Recommendation[] {
  const seen = new Set<Time>();
  return availability
    .filter((slot) => slot.status === 'free' && occupancy.has(slot.start))
    .map((slot) => ({
      start: slot.start,
      end: slot.end,
      expectedOccupancy: occupancy.get(slot.start) ?? 0,
    }))
    .filter((r) => r.expectedOccupancy <= MAX_OCCUPANCY)
    .sort((a, b) => a.expectedOccupancy - b.expectedOccupancy || a.start.localeCompare(b.start))
    .filter((r) => !seen.has(r.start) && Boolean(seen.add(r.start)))
    .slice(0, limit);
}
