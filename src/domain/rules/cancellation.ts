// SPDX-License-Identifier: EUPL-1.2
import { minutesBetween, type LocalDateTime } from '../time';
import type { BookingRules, Reservation, Slot } from '../types';
import { canBook, type BookingContext, type BookingHolder, type RuleViolation } from './booking';

export type CancelViolation = { code: 'notCancellable' } | { code: 'alreadyStarted' };

// `late`: inside the penalty window, so no refund.
export type CancelDecision =
  { ok: true; late: boolean } | { ok: false; violations: CancelViolation[] };

export type ModifyViolation =
  CancelViolation | RuleViolation | { code: 'modificationWindowClosed'; hours: number };

export function canCancel(
  reservation: Reservation,
  rules: BookingRules,
  now: LocalDateTime,
): CancelDecision {
  if (reservation.status !== 'confirmed') {
    return { ok: false, violations: [{ code: 'notCancellable' }] };
  }
  const minutesAhead = minutesBetween(now, { date: reservation.date, time: reservation.start });
  if (minutesAhead <= 0) return { ok: false, violations: [{ code: 'alreadyStarted' }] };
  return { ok: true, late: minutesAhead < rules.freeCancellationHours * 60 };
}

export function canModify(
  context: BookingContext,
  holder: BookingHolder,
  reservation: Reservation,
  slot: Slot,
): { ok: true } | { ok: false; violations: ModifyViolation[] } {
  const cancel = canCancel(reservation, context.rules, context.now);
  if (!cancel.ok) return cancel;

  const violations: ModifyViolation[] = [];
  if (cancel.late) {
    violations.push({
      code: 'modificationWindowClosed',
      hours: context.rules.freeCancellationHours,
    });
  }
  const booking = canBook(context, holder, slot, reservation.id);
  if (!booking.ok) violations.push(...booking.violations);

  return violations.length === 0 ? { ok: true } : { ok: false, violations };
}
