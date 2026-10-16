// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { attendanceOf, canCheckIn } from './attendance';
import { makeReservation, NOW } from './fixtures.test-utils';

describe('attendanceOf', () => {
  const today = (overrides = {}) =>
    makeReservation({ date: NOW.date, start: '09:00', end: '11:00', ...overrides });

  it('follows a booking from upcoming to attended or unrecorded', () => {
    expect(attendanceOf(today(), NOW)).toBe('upcoming');
    expect(attendanceOf(today({ checkedInAt: '2026-10-19T07:05:00Z' }), NOW)).toBe('checkedIn');
    expect(attendanceOf(today({ end: '10:00' }), NOW)).toBe('unrecorded');
    expect(attendanceOf(makeReservation({ date: '2026-10-18' }), NOW)).toBe('unrecorded');
    expect(attendanceOf(makeReservation({ date: '2026-10-20' }), NOW)).toBe('upcoming');
  });

  it('respects the final status of past and cancelled bookings', () => {
    expect(attendanceOf(today({ status: 'completed' }), NOW)).toBe('checkedIn');
    expect(attendanceOf(today({ status: 'noShow' }), NOW)).toBe('noShow');
    expect(attendanceOf(today({ status: 'cancelled' }), NOW)).toBe('cancelled');
  });

  it('opens check-in only on the day and before the end', () => {
    expect(canCheckIn(today(), NOW)).toBe(true);
    expect(canCheckIn(makeReservation({ date: '2026-10-20' }), NOW)).toBe(false);
    expect(canCheckIn(today({ end: '10:00' }), NOW)).toBe(false);
    expect(canCheckIn(today({ checkedInAt: '2026-10-19T07:05:00Z' }), NOW)).toBe(false);
  });
});
