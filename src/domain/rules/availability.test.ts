// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import type { Block } from '../types';
import {
  findSlotProblem,
  getAvailability,
  openingRanges,
  subspacesOverlap,
  type AvailabilitySlot,
} from './availability';
import { makeContext, makeFacility, makeReservation, makeSchedule } from './fixtures.test-utils';

const TUESDAY = '2026-10-20';
const holiday = (date: string) => ({
  id: 'h',
  tenantId: 't1',
  date,
  name: { gl: 'Festa', es: 'Fiesta' },
});

const block = (overrides: Partial<Block> = {}): Block => ({
  id: 'b1',
  tenantId: 't1',
  facilityId: 'pitch',
  subspaceId: null,
  dates: { from: TUESDAY, to: TUESDAY },
  times: { start: '09:00', end: '11:00' },
  reason: 'maintenance',
  note: '',
  createdAt: '2026-10-01T10:00:00.000Z',
  createdBy: 'admin',
  ...overrides,
});

const statusOf = (slots: AvailabilitySlot[], subspaceId: string, start: string) =>
  slots.find((s) => s.subspaceId === subspaceId && s.start === start)?.status;

describe('openingRanges', () => {
  const schedule = makeSchedule({
    exceptions: [
      { date: '2026-10-21', ranges: [], reason: 'Limpeza' },
      {
        date: '2026-10-22',
        ranges: [{ start: '10:00', end: '12:00' }],
        reason: 'Horario reducido',
      },
    ],
  });
  const holidays = [holiday('2026-10-23')];

  it('uses the weekly schedule on regular days', () => {
    expect(openingRanges(schedule, holidays, TUESDAY)).toEqual({
      ranges: schedule.weekly[2],
      closed: false,
    });
  });

  it('marks holidays and full-day exceptions as closed', () => {
    expect(openingRanges(schedule, holidays, '2026-10-23').closed).toBe(true);
    expect(openingRanges(schedule, holidays, '2026-10-21').closed).toBe(true);
  });

  it('replaces the hours on partial exceptions', () => {
    expect(openingRanges(schedule, holidays, '2026-10-22')).toEqual({
      ranges: [{ start: '10:00', end: '12:00' }],
      closed: false,
    });
  });
});

describe('subspacesOverlap', () => {
  const facility = makeFacility();

  it('treats a whole space as overlapping its parts, but not the parts with each other', () => {
    expect(subspacesOverlap(facility, 'whole', 'half-a')).toBe(true);
    expect(subspacesOverlap(facility, 'half-b', 'whole')).toBe(true);
    expect(subspacesOverlap(facility, 'half-a', 'half-b')).toBe(false);
    expect(subspacesOverlap(facility, 'half-a', 'half-a')).toBe(true);
  });
});

describe('getAvailability', () => {
  it('lists every slot of every subspace within opening hours', () => {
    const slots = getAvailability(makeContext(), TUESDAY);
    expect(slots).toHaveLength(3 * 11);
    expect(slots[0]).toMatchObject({ subspaceId: 'half-a', start: '09:00', end: '10:00' });
    expect(slots.every((s) => s.status === 'free')).toBe(true);
  });

  it('marks booked and blocked slots, including overlapping subspaces', () => {
    const reservations = [makeReservation({ subspaceId: 'half-a', start: '18:00', end: '20:00' })];
    const blocks = [block({ subspaceId: 'half-b' })];
    const slots = getAvailability(makeContext({ reservations, blocks }), TUESDAY);

    expect(statusOf(slots, 'half-a', '19:00')).toBe('booked');
    expect(statusOf(slots, 'whole', '18:00')).toBe('booked');
    expect(statusOf(slots, 'half-b', '18:00')).toBe('free');
    expect(statusOf(slots, 'half-b', '10:00')).toBe('blocked');
    expect(statusOf(slots, 'whole', '10:00')).toBe('blocked');
    expect(statusOf(slots, 'half-a', '10:00')).toBe('free');
  });

  it('marks past slots and closed days', () => {
    const today = getAvailability(makeContext(), '2026-10-19');
    expect(statusOf(today, 'half-a', '10:00')).toBe('past');
    expect(statusOf(today, 'half-a', '11:00')).toBe('free');

    const closed = getAvailability(makeContext({ holidays: [holiday(TUESDAY)] }), TUESDAY);
    expect(closed.every((s) => s.status === 'closed')).toBe(true);
  });

  it('ignores cancelled reservations, other facilities and blocks elsewhere', () => {
    const reservations = [
      makeReservation({ status: 'cancelled' }),
      makeReservation({ facilityId: 'pool' }),
    ];
    const blocks = [
      block({ facilityId: 'pool' }),
      block({ dates: { from: '2026-10-21', to: '2026-10-22' } }),
    ];
    const slots = getAvailability(makeContext({ reservations, blocks }), TUESDAY);
    expect(slots.every((s) => s.status === 'free')).toBe(true);
  });

  it('keeps a shared space free until its capacity is reached', () => {
    const facility = makeFacility({
      subspaces: [{ id: 'gym', name: 'Ximnasio', capacity: 2, contains: [] }],
    });
    const one = [makeReservation({ subspaceId: 'gym' })];
    const two = [...one, makeReservation({ subspaceId: 'gym' })];

    const withOne = getAvailability(makeContext({ facility, reservations: one }), TUESDAY);
    expect(withOne.find((s) => s.start === '18:00')).toMatchObject({
      status: 'free',
      taken: 1,
      capacity: 2,
    });

    const withTwo = getAvailability(makeContext({ facility, reservations: two }), TUESDAY);
    expect(withTwo.find((s) => s.start === '18:00')?.status).toBe('booked');
  });

  it('returns nothing on days without opening hours', () => {
    expect(getAvailability(makeContext(), '2026-10-25')).toEqual([]);
  });
});

describe('findSlotProblem', () => {
  const at = (start: string, end: string) => ({
    facilityId: 'pitch',
    subspaceId: 'half-a',
    date: TUESDAY,
    start,
    end,
  });

  it('accepts free single and multi-slot bookings', () => {
    expect(findSlotProblem(makeContext(), at('18:00', '19:00'))).toBeNull();
    expect(findSlotProblem(makeContext(), at('18:00', '20:00'))).toBeNull();
  });

  it('detects times off the grid or outside opening hours', () => {
    expect(findSlotProblem(makeContext(), at('18:30', '19:30'))).toBe('misaligned');
    expect(findSlotProblem(makeContext(), at('13:00', '15:00'))).toBe('misaligned');
    expect(findSlotProblem(makeContext(), at('07:00', '08:00'))).toBe('outsideOpeningHours');
    expect(findSlotProblem(makeContext(), at('19:00', '18:00'))).toBe('outsideOpeningHours');
  });

  it('reports the most relevant problem when several slots are affected', () => {
    const reservations = [makeReservation({ start: '19:00', end: '20:00' })];
    const blocks = [block({ times: { start: '18:00', end: '19:00' } })];
    expect(findSlotProblem(makeContext({ reservations, blocks }), at('18:00', '20:00'))).toBe(
      'blocked',
    );
    expect(findSlotProblem(makeContext({ reservations }), at('18:00', '20:00'))).toBe('booked');
  });
});
