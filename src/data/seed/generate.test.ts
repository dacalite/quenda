// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { findSlotProblem } from '../../domain/rules/availability';
import { resolveRules } from '../../domain/rules/booking';
import { startOfWeek } from '../../domain/time';
import type { Reservation } from '../../domain/types';
import { generateSeed, personaUserId } from './generate';

const TODAY = '2026-10-15';
const db = generateSeed(TODAY);

describe('generateSeed', () => {
  it('is deterministic for a given day', () => {
    expect(JSON.stringify(generateSeed(TODAY))).toBe(JSON.stringify(db));
  });

  it('fits comfortably in localStorage', () => {
    expect(JSON.stringify(db).length).toBeLessThan(2_500_000);
  });

  it('creates two councils grouped in one deputación', () => {
    expect(db.tenants.map((t) => t.slug)).toEqual(['bouzalonga', 'ribasmeiras']);
    expect(db.tenants.every((t) => t.deputacionId === db.deputacions[0]?.id)).toBe(true);
  });

  it('never links rows across tenants', () => {
    const tenantOf = new Map<string, string>();
    for (const row of [...db.facilities, ...db.users, ...db.entities]) {
      tenantOf.set(row.id, row.tenantId);
    }
    for (const r of db.reservations) {
      expect(tenantOf.get(r.facilityId)).toBe(r.tenantId);
      const holderId = r.holder.kind === 'user' ? r.holder.userId : r.holder.entityId;
      expect(tenantOf.get(holderId)).toBe(r.tenantId);
    }
    for (const row of [...db.schedules, ...db.blocks, ...db.recurringBookings]) {
      expect(tenantOf.get(row.facilityId)).toBe(row.tenantId);
    }
  });

  it('only contains bookings the rules engine considers possible', () => {
    const byFacilityDay = new Map<string, Reservation[]>();
    for (const r of db.reservations) {
      const key = `${r.facilityId}|${r.date}`;
      byFacilityDay.set(key, [...(byFacilityDay.get(key) ?? []), r]);
    }
    const longAgo = { date: '2000-01-01', time: '00:00' };
    const problems = db.reservations
      .filter((r) => r.status !== 'cancelled')
      .flatMap((r) => {
        const facility = db.facilities.find((f) => f.id === r.facilityId);
        const schedule = db.schedules.find((s) => s.facilityId === r.facilityId);
        if (!facility || !schedule) return [`${r.id}: missing facility`];
        const others = (byFacilityDay.get(`${r.facilityId}|${r.date}`) ?? []).filter(
          (o) => o.id !== r.id,
        );
        const problem = findSlotProblem(
          {
            facility,
            schedule,
            holidays: db.holidays.filter((h) => h.tenantId === r.tenantId),
            blocks: db.blocks.filter((b) => b.facilityId === r.facilityId),
            reservations: others,
            now: longAgo,
          },
          r,
        );
        return problem ? [`${r.id} ${r.date} ${r.start}: ${problem}`] : [];
      });
    expect(problems).toEqual([]);
  });

  it('builds a believable history: busy evenings, some no-shows and cancellations', () => {
    const past = db.reservations.filter((r) => r.date < TODAY);
    const evening = past.filter((r) => r.start >= '18:00' && r.start < '22:00').length;
    const morning = past.filter((r) => r.start < '14:00').length;
    expect(past.length).toBeGreaterThan(1000);
    expect(evening).toBeGreaterThan(morning);
    expect(past.some((r) => r.status === 'noShow')).toBe(true);
    expect(past.some((r) => r.status === 'cancelled')).toBe(true);
    expect(db.reservations.some((r) => r.date >= TODAY && r.status === 'confirmed')).toBe(true);
    expect(db.reservations.some((r) => r.recurringBookingId)).toBe(true);
  });

  it('gives every citizen persona a history and room to book this week', () => {
    for (const tenant of db.tenants) {
      for (const persona of ['uxia', 'manuel', 'brais'] as const) {
        const own = db.reservations.filter(
          (r) => r.holder.kind === 'user' && r.holder.userId === personaUserId(tenant.id, persona),
        );
        expect(own.some((r) => r.date < TODAY)).toBe(true);
        expect(own.some((r) => r.date > TODAY && r.status === 'confirmed')).toBe(true);
        const thisWeek = own.filter((r) => startOfWeek(r.date) === startOfWeek(TODAY));
        expect(thisWeek.length).toBeLessThan(
          resolveRules(tenant.defaultRules, {}).maxBookingsPerWeek,
        );
      }
    }
  });

  it('marks Manuel as the screen reader persona with large text', () => {
    const manuel = db.users.find((u) => u.id === personaUserId('bouzalonga', 'manuel'));
    expect(manuel?.preferences.accessibility.textSize).toBe('large');
    expect(manuel?.concessions).toContain('senior');
  });
});
