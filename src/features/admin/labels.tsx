// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { attendanceOf, type Attendance } from '../../domain/rules/attendance';
import type { LocalDateTime } from '../../domain/time';
import type { Reservation } from '../../domain/types';
import { StatusBadge } from '../../ui/StatusBadge';
import type { Tone } from '../../ui/tones';

const ATTENDANCE_TONE: Record<Attendance, Tone> = {
  upcoming: 'info',
  checkedIn: 'success',
  unrecorded: 'warning',
  noShow: 'danger',
  cancelled: 'neutral',
};

export function AttendanceBadge({
  reservation,
  now,
}: {
  reservation: Reservation;
  now: LocalDateTime;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const attendance = attendanceOf(reservation, now);
  return (
    <StatusBadge tone={ATTENDANCE_TONE[attendance]}>{t(`attendance.${attendance}`)}</StatusBadge>
  );
}
