// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import type { Entity, Slot } from '../types';
import { canBook, resolveRules, suspensionEnd, type BookingHolder } from './booking';
import {
  NOW,
  RULES,
  makeContext,
  makeFacility,
  makeReservation,
  makeUser,
} from './fixtures.test-utils';

const slot: Slot = {
  facilityId: 'pitch',
  subspaceId: 'half-a',
  date: '2026-10-20',
  start: '18:00',
  end: '19:00',
};
const user = makeUser();
const asUser: BookingHolder = { kind: 'user', user };
const club: Entity = {
  id: 'club',
  tenantId: 't1',
  name: 'Club',
  kind: 'club',
  registryNumber: 'R-1',
  contactName: '',
  phone: '',
  email: '',
};
const asEntity: BookingHolder = { kind: 'entity', entity: club };

const codes = (decision: ReturnType<typeof canBook>) =>
  decision.ok ? [] : decision.violations.map((v) => v.code);

describe('resolveRules', () => {
  it('lets a facility override part of the tenant defaults, including nested policies', () => {
    const rules = resolveRules(RULES, {
      maxAdvanceDays: 14,
      noShow: { ...RULES.noShow, suspensionDays: 7 },
    });
    expect(rules.maxAdvanceDays).toBe(14);
    expect(rules.minAdvanceHours).toBe(RULES.minAdvanceHours);
    expect(rules.noShow).toEqual({ ...RULES.noShow, suspensionDays: 7 });
  });
});

describe('canBook', () => {
  it('accepts a free slot that meets every rule', () => {
    expect(canBook(makeContext(), asUser, slot)).toEqual({ ok: true });
  });

  it('rejects an inactive facility', () => {
    const context = makeContext({ facility: makeFacility({ status: 'inactive' }) });
    expect(codes(canBook(context, asUser, slot))).toEqual(['facilityInactive']);
  });

  it('rejects taken, blocked, closed and past slots', () => {
    const taken = makeContext({ reservations: [makeReservation()] });
    expect(codes(canBook(taken, asUser, slot))).toEqual(['unavailable']);

    const holiday = {
      id: 'h',
      tenantId: 't1',
      date: slot.date,
      name: { gl: 'Festa', es: 'Fiesta' },
    };
    expect(codes(canBook(makeContext({ holidays: [holiday] }), asUser, slot))).toEqual(['closed']);

    const past = { ...slot, date: '2026-10-19', start: '09:00', end: '10:00' };
    expect(codes(canBook(makeContext(), asUser, past))).toEqual(['past']);
  });

  it('explains misaligned and out-of-hours requests with their parameters', () => {
    const misaligned = canBook(makeContext(), asUser, { ...slot, start: '18:30', end: '19:30' });
    expect(misaligned).toEqual({
      ok: false,
      violations: [{ code: 'misaligned', slotMinutes: 60 }],
    });

    const early = canBook(makeContext(), asUser, { ...slot, start: '07:00', end: '08:00' });
    expect(codes(early)).toEqual(['outsideOpeningHours']);
  });

  it('enforces minimum and maximum advance', () => {
    const soon = { ...slot, date: '2026-10-19', start: '11:00', end: '12:00' };
    expect(canBook(makeContext(), asUser, soon)).toEqual({
      ok: false,
      violations: [{ code: 'tooSoon', hours: 2 }],
    });

    const far = { ...slot, date: '2026-10-27' };
    expect(canBook(makeContext(), asUser, far)).toEqual({
      ok: false,
      violations: [{ code: 'tooFarAhead', days: 7 }],
    });
  });

  it('enforces minimum and maximum duration', () => {
    const rules = { ...RULES, minDurationMinutes: 120, maxDurationMinutes: 120 };
    expect(codes(canBook(makeContext({ rules }), asUser, slot))).toEqual(['tooShort']);

    const long = { ...slot, start: '16:00', end: '19:00' };
    expect(codes(canBook(makeContext(), asUser, long))).toEqual(['tooLong']);
  });

  it('applies who may book', () => {
    const residents = makeContext({ rules: { ...RULES, eligibility: 'residents' } });
    const outsider: BookingHolder = { kind: 'user', user: makeUser({ resident: false }) };
    expect(codes(canBook(residents, outsider, slot))).toEqual(['residentsOnly']);
    expect(canBook(residents, asUser, slot).ok).toBe(true);
    expect(canBook(residents, asEntity, slot).ok).toBe(true);

    const entities = makeContext({ rules: { ...RULES, eligibility: 'entities' } });
    expect(codes(canBook(entities, asUser, slot))).toEqual(['entitiesOnly']);
    expect(canBook(entities, asEntity, slot).ok).toBe(true);
  });

  it('limits active bookings per person and week, ignoring cancelled ones', () => {
    const holderReservations = [
      makeReservation({ date: '2026-10-21' }),
      makeReservation({ date: '2026-10-25', start: '10:00', end: '11:00' }),
      makeReservation({ date: '2026-10-22', status: 'cancelled' }),
      makeReservation({ date: '2026-10-22', holder: { kind: 'user', userId: 'someone-else' } }),
    ];
    expect(canBook(makeContext({ holderReservations }), asUser, slot)).toEqual({
      ok: false,
      violations: [{ code: 'weeklyLimit', max: 2 }],
    });

    const nextWeek = { ...slot, date: '2026-10-26' };
    expect(canBook(makeContext({ holderReservations }), asUser, nextWeek).ok).toBe(true);
  });

  it('does not apply personal limits to entities', () => {
    const holderReservations = [makeReservation(), makeReservation(), makeReservation()];
    expect(
      canBook(makeContext({ holderReservations }), asEntity, { ...slot, subspaceId: 'half-b' }).ok,
    ).toBe(true);
  });

  it('ignores the reservation being modified', () => {
    const own = makeReservation();
    const context = makeContext({
      reservations: [own],
      holderReservations: [own, makeReservation({ date: '2026-10-21' })],
    });
    expect(canBook(context, asUser, slot, own.id)).toEqual({ ok: true });
  });

  it('collects every broken rule at once', () => {
    const rules = { ...RULES, eligibility: 'residents' as const };
    const outsider: BookingHolder = { kind: 'user', user: makeUser({ resident: false }) };
    const context = makeContext({
      rules,
      reservations: [makeReservation({ start: '19:00', end: '20:00' })],
    });
    expect(
      codes(
        canBook(context, outsider, { ...slot, date: '2026-10-20', start: '16:00', end: '20:00' }),
      ),
    ).toEqual(['residentsOnly', 'unavailable', 'tooLong']);
  });
});

describe('suspensionEnd', () => {
  const noShow = (date: string) => makeReservation({ date, status: 'noShow' });

  it('suspends after enough no-shows inside the window', () => {
    const rows = [noShow('2026-10-05'), noShow('2026-10-12')];
    expect(suspensionEnd('u1', rows, RULES.noShow, NOW)).toBe('2026-10-26');
    expect(codes(canBook(makeContext({ holderReservations: rows }), asUser, slot))).toEqual([
      'suspended',
    ]);
  });

  it('ignores old no-shows, other people and finished suspensions', () => {
    expect(
      suspensionEnd('u1', [noShow('2026-09-01'), noShow('2026-10-12')], RULES.noShow, NOW),
    ).toBeNull();
    expect(
      suspensionEnd('u2', [noShow('2026-10-05'), noShow('2026-10-12')], RULES.noShow, NOW),
    ).toBeNull();
    const later = { date: '2026-10-27', time: '10:00' };
    expect(
      suspensionEnd('u1', [noShow('2026-10-05'), noShow('2026-10-12')], RULES.noShow, later),
    ).toBeNull();
  });

  it('can be switched off', () => {
    const policy = { ...RULES.noShow, strikesForSuspension: 0 };
    expect(
      suspensionEnd('u1', [noShow('2026-10-05'), noShow('2026-10-12')], policy, NOW),
    ).toBeNull();
  });
});
