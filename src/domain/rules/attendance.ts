// SPDX-License-Identifier: EUPL-1.2
import type { LocalDateTime } from '../time';
import type { Reservation } from '../types';

export type Attendance = 'cancelled' | 'upcoming' | 'checkedIn' | 'unrecorded' | 'noShow';

/** Where a booking stands at the door: still to come, attended, or over without a check-in. */
export function attendanceOf(reservation: Reservation, now: LocalDateTime): Attendance {
  if (reservation.status === 'cancelled') return 'cancelled';
  if (reservation.status === 'noShow') return 'noShow';
  if (reservation.checkedInAt || reservation.status === 'completed') return 'checkedIn';
  const over =
    reservation.date < now.date || (reservation.date === now.date && reservation.end <= now.time);
  return over ? 'unrecorded' : 'upcoming';
}

/** Check-in is open on the day of the booking, until it ends. */
export const canCheckIn = (reservation: Reservation, now: LocalDateTime) =>
  attendanceOf(reservation, now) === 'upcoming' && reservation.date === now.date;
