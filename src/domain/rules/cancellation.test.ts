// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import type { BookingHolder } from './booking';
import { canCancel, canModify } from './cancellation';
import { NOW, RULES, makeContext, makeReservation, makeUser } from './fixtures.test-utils';

const asUser: BookingHolder = { kind: 'user', user: makeUser() };

describe('canCancel', () => {
  it('allows free cancellation before the penalty window', () => {
    expect(canCancel(makeReservation({ date: '2026-10-21' }), RULES, NOW)).toEqual({
      ok: true,
      late: false,
    });
  });

  it('flags late cancellations inside the window', () => {
    expect(canCancel(makeReservation({ date: '2026-10-19', start: '20:00' }), RULES, NOW)).toEqual({
      ok: true,
      late: true,
    });
  });

  it('rejects reservations that already started or are not active', () => {
    expect(canCancel(makeReservation({ date: '2026-10-19', start: '10:00' }), RULES, NOW)).toEqual({
      ok: false,
      violations: [{ code: 'alreadyStarted' }],
    });
    expect(canCancel(makeReservation({ status: 'cancelled' }), RULES, NOW)).toEqual({
      ok: false,
      violations: [{ code: 'notCancellable' }],
    });
  });
});

describe('canModify', () => {
  const original = makeReservation({ date: '2026-10-21', start: '18:00', end: '19:00' });
  const context = makeContext({ reservations: [original], holderReservations: [original] });

  it('moves a reservation to another free slot, even overlapping itself', () => {
    expect(
      canModify(context, asUser, original, { ...original, start: '18:00', end: '20:00' }),
    ).toEqual({
      ok: true,
    });
  });

  it('applies booking rules to the new slot', () => {
    const taken = makeReservation({ date: '2026-10-22' });
    const busy = makeContext({ reservations: [original, taken], holderReservations: [original] });
    expect(canModify(busy, asUser, original, { ...original, date: '2026-10-22' })).toEqual({
      ok: false,
      violations: [{ code: 'unavailable' }],
    });
  });

  it('closes modifications inside the penalty window', () => {
    const soon = makeReservation({ date: '2026-10-19', start: '20:00', end: '21:00' });
    const result = canModify(makeContext({ reservations: [soon] }), asUser, soon, {
      ...soon,
      start: '21:00',
      end: '22:00',
    });
    expect(result).toEqual({
      ok: false,
      violations: [{ code: 'modificationWindowClosed', hours: 24 }],
    });
  });

  it('refuses inactive reservations', () => {
    const cancelled = makeReservation({ status: 'cancelled' });
    expect(canModify(context, asUser, cancelled, cancelled).ok).toBe(false);
  });
});
