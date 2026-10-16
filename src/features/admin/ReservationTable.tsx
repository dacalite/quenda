// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { adminPaths } from '../../app/routes/paths';
import { zonedNow } from '../../domain/time';
import type { Facility, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName } from '../../i18n/labels';
import { DataTable } from '../../ui/DataTable';
import { Link } from '../../ui/Link';
import { AttendanceBadge } from './labels';
import { useHolderName, useStaff } from './queries';

/** Bookings with their time, place, holder and attendance, each linking to its record. */
export function ReservationTable({
  caption,
  reservations,
  facilities,
  showDate = false,
}: {
  caption: string;
  reservations: Reservation[];
  facilities: Facility[];
  showDate?: boolean;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const holderName = useHolderName();
  const subspaceName = useSubspaceName();
  const now = zonedNow(new Date(), tenant.timeZone);
  const facilityOf = (r: Reservation) => facilities.find((f) => f.id === r.facilityId);

  return (
    <DataTable
      caption={caption}
      rows={reservations}
      rowKey={(r) => r.id}
      columns={[
        {
          key: 'time',
          header: t('table.time'),
          isRowHeader: true,
          render: (r) =>
            showDate
              ? `${format.shortDate(r.date)}, ${format.timeRange(r.start, r.end)}`
              : format.timeRange(r.start, r.end),
        },
        {
          key: 'place',
          header: t('table.place'),
          render: (r) => {
            const facility = facilityOf(r);
            return facility ? `${facility.name} · ${subspaceName(facility, r.subspaceId)}` : '';
          },
        },
        { key: 'holder', header: t('table.holder'), render: (r) => holderName(r.holder) },
        {
          key: 'attendance',
          header: t('table.attendance'),
          render: (r) => <AttendanceBadge reservation={r} now={now} />,
        },
        {
          key: 'code',
          header: t('table.code'),
          render: (r) => (
            <Link href={paths.reservation(r.id)} aria-label={t('table.open', { code: r.code })}>
              {r.code}
            </Link>
          ),
        },
      ]}
    />
  );
}
