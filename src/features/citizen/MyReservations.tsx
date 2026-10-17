// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import { addDays, weekdayOf, zonedNow } from '../../domain/time';
import type { Facility, IsoDate, Reservation } from '../../domain/types';
import { useSubspaceName } from '../../i18n/labels';
import { Link } from '../../ui/Link';
import { StatusBadge } from '../../ui/StatusBadge';
import { Tab, TabList, TabPanel, Tabs } from '../../ui/Tabs';
import layout from '../../ui/layout.module.css';
import { useCitizen, useMyReservations } from './queries';
import { Ticket } from './Ticket';

const STATUS_TONE = {
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'neutral',
  noShow: 'warning',
} as const;

/** Same weekday, from tomorrow on. */
const nextSameWeekday = (date: IsoDate, today: IsoDate) =>
  addDays(today, ((weekdayOf(date) - weekdayOf(today) + 6) % 7) + 1);

export function MyReservations() {
  const { t } = useTranslation(['citizen', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const reservations = useMyReservations();
  const facilities = useFacilities();
  const now = zonedNow(new Date(), tenant.timeZone);

  const all = reservations.data ?? [];
  const isUpcoming = (r: Reservation) =>
    r.status === 'confirmed' && (r.date > now.date || (r.date === now.date && r.end > now.time));
  const key = (r: Reservation) => `${r.date}${r.start}`;
  const upcoming = all.filter(isUpcoming).sort((a, b) => key(a).localeCompare(key(b)));
  const history = all.filter((r) => !isUpcoming(r)).sort((a, b) => key(b).localeCompare(key(a)));

  const list = (rows: Reservation[], empty: string, past: boolean) =>
    rows.length === 0 ? (
      <div className={layout.section}>
        <p>{empty}</p>
        <p>
          <Link href={paths.facilities()}>{t('reservations.find')}</Link>
        </p>
      </div>
    ) : (
      <ul className={layout.stack}>
        {rows.map((reservation) => {
          const facility = facilities.data?.find((f) => f.id === reservation.facilityId);
          return facility ? (
            <ReservationCard
              key={reservation.id}
              reservation={reservation}
              facility={facility}
              repeatDate={past ? nextSameWeekday(reservation.date, now.date) : undefined}
            />
          ) : null;
        })}
      </ul>
    );

  return (
    <Page title={t('reservations.title')}>
      <p>
        <Link href={paths.calendar}>{t('reservations.calendar')}</Link>
      </p>
      {!reservations.data ? (
        <Pending queries={[reservations]} size="section" />
      ) : (
        <Tabs>
          <TabList aria-label={t('reservations.tabs')}>
            <Tab id="upcoming">{`${t('reservations.upcoming')} (${String(upcoming.length)})`}</Tab>
            <Tab id="history">{`${t('reservations.history')} (${String(history.length)})`}</Tab>
          </TabList>
          <TabPanel id="upcoming">{list(upcoming, t('reservations.noUpcoming'), false)}</TabPanel>
          <TabPanel id="history">{list(history, t('reservations.noHistory'), true)}</TabPanel>
        </Tabs>
      )}
    </Page>
  );
}

function ReservationCard({
  reservation,
  facility,
  repeatDate,
}: {
  reservation: Reservation;
  facility: Facility;
  repeatDate: IsoDate | undefined;
}) {
  const { t } = useTranslation(['citizen', 'domain']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const subspaceName = useSubspaceName();
  return (
    <Ticket
      reservation={reservation}
      facilityName={`${facility.name}, ${subspaceName(facility, reservation.subspaceId)}`}
      href={paths.reservation(reservation.id)}
      headingLevel={2}
      muted={Boolean(repeatDate)}
    >
      <p className={layout.row}>
        <StatusBadge tone={STATUS_TONE[reservation.status]}>
          {t(`domain:reservationStatus.${reservation.status}`)}
        </StatusBadge>
      </p>
      {repeatDate && (
        <p>
          <Link
            href={paths.availability(facility.id, {
              date: repeatDate,
              subspaceId: reservation.subspaceId,
            })}
          >
            {t('reservations.repeat')}
          </Link>
        </p>
      )}
    </Ticket>
  );
}
