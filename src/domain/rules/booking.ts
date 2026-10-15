// SPDX-License-Identifier: EUPL-1.2
import {
  addDays,
  daysBetween,
  minutesBetween,
  startOfWeek,
  toMinutes,
  type LocalDateTime,
} from '../time';
import type {
  BookingRules,
  Entity,
  Id,
  IsoDate,
  NoShowPolicy,
  Reservation,
  Slot,
  User,
} from '../types';
import {
  findSlotProblem,
  occupiesSlot,
  type FacilityContext,
  type SlotProblem,
} from './availability';

export type RuleViolation =
  | { code: 'facilityInactive' }
  | { code: 'past' }
  | { code: 'closed' }
  | { code: 'unavailable' }
  | { code: 'outsideOpeningHours' }
  | { code: 'misaligned'; slotMinutes: number }
  | { code: 'tooSoon'; hours: number }
  | { code: 'tooFarAhead'; days: number }
  | { code: 'tooShort'; minutes: number }
  | { code: 'tooLong'; minutes: number }
  | { code: 'weeklyLimit'; max: number }
  | { code: 'residentsOnly' }
  | { code: 'entitiesOnly' }
  | { code: 'suspended'; until: IsoDate };

export type Decision<V> = { ok: true } | { ok: false; violations: V[] };

export type BookingHolder = { kind: 'user'; user: User } | { kind: 'entity'; entity: Entity };

export interface BookingContext extends FacilityContext {
  rules: BookingRules;
  /** Every reservation of the holder in the tenant, for weekly limits and no-show suspensions. */
  holderReservations: Reservation[];
}

export function resolveRules(
  defaults: BookingRules,
  overrides: Partial<BookingRules>,
): BookingRules {
  return { ...defaults, ...overrides, noShow: { ...defaults.noShow, ...overrides.noShow } };
}

export function slotProblemToViolation(problem: SlotProblem, slotMinutes: number): RuleViolation {
  switch (problem) {
    case 'booked':
    case 'blocked':
      return { code: 'unavailable' };
    case 'misaligned':
      return { code: 'misaligned', slotMinutes };
    default:
      return { code: problem };
  }
}

/** Date until which the user cannot book (exclusive), or `null` if not suspended. */
export function suspensionEnd(
  userId: Id,
  reservations: Reservation[],
  policy: NoShowPolicy,
  now: LocalDateTime,
): IsoDate | null {
  if (policy.strikesForSuspension <= 0) return null;
  const windowStart = addDays(now.date, -policy.windowDays);
  const strikes = reservations
    .filter(
      (r) =>
        r.holder.kind === 'user' &&
        r.holder.userId === userId &&
        r.status === 'noShow' &&
        r.date > windowStart &&
        r.date <= now.date,
    )
    .map((r) => r.date)
    .sort();
  const last = strikes.at(-1);
  if (strikes.length < policy.strikesForSuspension || !last) return null;
  const until = addDays(last, policy.suspensionDays);
  return now.date < until ? until : null;
}

export function canBook(
  context: BookingContext,
  holder: BookingHolder,
  slot: Slot,
  ignoreReservationId?: Id,
): Decision<RuleViolation> {
  const { facility, rules, now, schedule } = context;
  const others = (rows: Reservation[]) => rows.filter((r) => r.id !== ignoreReservationId);
  const violations: RuleViolation[] = [];

  if (facility.status !== 'active') violations.push({ code: 'facilityInactive' });
  if (rules.eligibility === 'entities' && holder.kind !== 'entity') {
    violations.push({ code: 'entitiesOnly' });
  }
  if (rules.eligibility === 'residents' && holder.kind === 'user' && !holder.user.resident) {
    violations.push({ code: 'residentsOnly' });
  }

  const problem = findSlotProblem({ ...context, reservations: others(context.reservations) }, slot);
  if (problem) violations.push(slotProblemToViolation(problem, schedule.slotMinutes));

  if (problem !== 'past') {
    const minutesAhead = minutesBetween(now, { date: slot.date, time: slot.start });
    if (minutesAhead < rules.minAdvanceHours * 60) {
      violations.push({ code: 'tooSoon', hours: rules.minAdvanceHours });
    }
    if (daysBetween(now.date, slot.date) > rules.maxAdvanceDays) {
      violations.push({ code: 'tooFarAhead', days: rules.maxAdvanceDays });
    }
  }

  const duration = toMinutes(slot.end) - toMinutes(slot.start);
  if (duration < rules.minDurationMinutes) {
    violations.push({ code: 'tooShort', minutes: rules.minDurationMinutes });
  }
  if (duration > rules.maxDurationMinutes) {
    violations.push({ code: 'tooLong', minutes: rules.maxDurationMinutes });
  }

  if (holder.kind === 'user') {
    const own = others(context.holderReservations);
    const until = suspensionEnd(holder.user.id, own, rules.noShow, now);
    if (until) violations.push({ code: 'suspended', until });

    const week = startOfWeek(slot.date);
    const sameWeek = own.filter(
      (r) =>
        occupiesSlot(r) &&
        r.holder.kind === 'user' &&
        r.holder.userId === holder.user.id &&
        startOfWeek(r.date) === week,
    );
    if (sameWeek.length >= rules.maxBookingsPerWeek) {
      violations.push({ code: 'weeklyLimit', max: rules.maxBookingsPerWeek });
    }
  }

  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
