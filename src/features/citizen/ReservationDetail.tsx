// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { useParams, useSearchParams } from 'react-router';
import { Page } from '../../app/Page';
import { useFacility } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import type { Facility, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName } from '../../i18n/labels';
import { Link } from '../../ui/Link';
import { StatusBadge } from '../../ui/StatusBadge';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import { AddToCalendar } from './AddToCalendar';
import { RESERVATION_TONE } from './labels';
import { useCitizen, useReservation } from './queries';
import { ReservationActions } from './ReservationActions';
import { ReservationQr } from './ReservationQr';

export function ReservationDetail() {
  const { t } = useTranslation('citizen');
  const { reservationId = '' } = useParams();
  const { tenant } = useCitizen();
  const reservation = useReservation(reservationId);
  const facility = useFacility(reservation.data?.facilityId ?? '');

  if (reservation.isError) {
    return (
      <Page title={t('reservation.notFound')}>
        <p>
          <Link href={citizenPaths(tenant.slug).reservations}>{t('reservations.title')}</Link>
        </p>
      </Page>
    );
  }
  if (!reservation.data || !facility.data) return null;
  return <Detail reservation={reservation.data} facility={facility.data} />;
}

function Detail({ reservation, facility }: { reservation: Reservation; facility: Facility }) {
  const { t } = useTranslation(['citizen', 'domain']);
  const [params] = useSearchParams();
  const format = useFormat();
  const subspaceName = useSubspaceName();
  const isNew = params.has('nova');
  const changed = params.has('cambiada');
  const title = isNew
    ? t('reservation.confirmedTitle')
    : changed
      ? t('reservation.changedTitle')
      : t('reservation.title', { code: reservation.code });
  const active = reservation.status === 'confirmed';

  return (
    <Page
      title={title}
      {...(isNew || changed
        ? { announcement: t('reservation.confirmedAnnouncement', { code: reservation.code }) }
        : {})}
    >
      <div className={layout.split}>
        <section className={[styles.pass, 'on-navy'].join(' ')} aria-labelledby="reservation-code">
          <h2 id="reservation-code">{t('reservation.code')}</h2>
          <p className={styles.code}>{reservation.code}</p>
          {active && (
            <>
              <div className={styles.qrTile}>
                <ReservationQr
                  code={reservation.code}
                  alt={t('reservation.qrAlt', { code: reservation.code })}
                />
              </div>
              <p className={styles.passHelp}>
                {t('reservation.qrHelp', { code: reservation.code })}
              </p>
            </>
          )}
        </section>

        <section className={layout.section} aria-labelledby="reservation-details">
          <h2 id="reservation-details">{t('reservation.details')}</h2>
          <dl className={layout.details}>
            <dt>{t('booking.facility')}</dt>
            <dd>{facility.name}</dd>
            <dt>{t('booking.space')}</dt>
            <dd>{subspaceName(facility, reservation.subspaceId)}</dd>
            <dt>{t('booking.date')}</dt>
            <dd>{format.longDate(reservation.date)}</dd>
            <dt>{t('booking.time')}</dt>
            <dd>{format.timeRange(reservation.start, reservation.end)}</dd>
            <dt>{t('reservation.status')}</dt>
            <dd>
              <StatusBadge tone={RESERVATION_TONE[reservation.status]}>
                {t(`domain:reservationStatus.${reservation.status}`)}
              </StatusBadge>
            </dd>
            <dt>{t('booking.price')}</dt>
            <dd>{format.price(reservation.amountCents)}</dd>
            <dt>{t('reservation.payment')}</dt>
            <dd>{t(`domain:payment.${reservation.payment}`)}</dd>
            <dt>{t('reservation.channel')}</dt>
            <dd>{t(`domain:channel.${reservation.channel}`)}</dd>
          </dl>
          {active && (
            <p>
              <AddToCalendar reservation={reservation} facility={facility} />
            </p>
          )}
          <ReservationActions reservation={reservation} facility={facility} />
        </section>
      </div>

      {reservation.history.length > 0 && (
        <section className={layout.section} aria-labelledby="reservation-history">
          <h2 id="reservation-history">{t('reservation.history')}</h2>
          <ol className={layout.stack}>
            {reservation.history.map((event) => {
              const label = t(`reservation.event.${event.type}`);
              const holderId =
                reservation.holder.kind === 'user' ? reservation.holder.userId : null;
              const byCouncil = event.type === 'cancelled' && event.by !== holderId;
              return (
                <li key={`${event.at}-${event.type}`}>
                  {format.dateTime(event.at)}:{' '}
                  {byCouncil
                    ? t('reservation.byCouncil', { event: label, reason: event.detail ?? '' })
                    : label}
                </li>
              );
            })}
          </ol>
        </section>
      )}
    </Page>
  );
}
