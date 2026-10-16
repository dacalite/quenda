// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { NotFoundPage } from '../../app/pages';
import { Page } from '../../app/Page';
import { useFacility } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { attendanceOf, canCheckIn } from '../../domain/rules/attendance';
import { resolveRules } from '../../domain/rules/booking';
import { canCancel } from '../../domain/rules/cancellation';
import { zonedNow } from '../../domain/time';
import type { Facility, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { ConfirmDialog, DialogTrigger } from '../../ui/Dialog';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { useToast } from '../../ui/toasts';
import { AttendanceBadge } from './labels';
import { useHolderName, useStaff, useStaffMutation, useStaffQuery } from './queries';

export function ReservationRecord() {
  const { reservationId = '' } = useParams();
  const reservation = useStaffQuery(['reservations', reservationId], (r, id) =>
    r.reservations.get(id, reservationId),
  );
  const facility = useFacility(reservation.data?.facilityId ?? '');
  if (reservation.isError) return <NotFoundPage />;
  if (!reservation.data || !facility.data) return null;
  return <Record reservation={reservation.data} facility={facility.data} />;
}

function Record({ reservation, facility }: { reservation: Reservation; facility: Facility }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const toast = useToast();
  const holderName = useHolderName();
  const subspaceName = useSubspaceName();
  const userId = reservation.holder.kind === 'user' ? reservation.holder.userId : null;
  const holder = useStaffQuery(
    ['users', userId],
    userId ? (r, id) => r.users.get(id, userId) : null,
  );
  const now = zonedNow(new Date(), tenant.timeZone);
  const attendance = attendanceOf(reservation, now);
  const cancellable = canCancel(
    reservation,
    resolveRules(tenant.defaultRules, facility.rules),
    now,
  ).ok;

  const checkIn = useStaffMutation((r, id) => r.reservations.checkIn(id, reservation.id));
  const noShow = useStaffMutation((r, id) => r.reservations.markNoShow(id, reservation.id));
  const cancel = useStaffMutation((r, id) => r.reservations.cancel(id, reservation.id));
  const done = (message: string) => ({
    onSuccess: () => {
      toast(message);
    },
    onError: () => {
      toast(t('common:error.title'), 'danger');
    },
  });

  return (
    <Page title={t('record.title', { code: reservation.code })}>
      <p>
        <Link href={paths.agenda({ date: reservation.date, facilityId: facility.id })}>
          {t('record.toAgenda')}
        </Link>
      </p>
      <dl className={layout.details}>
        <dt>{t('record.holder')}</dt>
        <dd>
          {holderName(reservation.holder)}
          {holder.data && ` · ${holder.data.phone}`}
        </dd>
        <dt>{t('record.place')}</dt>
        <dd>{`${facility.name} · ${subspaceName(facility, reservation.subspaceId)}`}</dd>
        <dt>{t('record.when')}</dt>
        <dd>
          {`${format.longDate(reservation.date)}, ${format.timeRange(reservation.start, reservation.end)}`}
        </dd>
        <dt>{t('record.status')}</dt>
        <dd>
          <AttendanceBadge reservation={reservation} now={now} />
        </dd>
        <dt>{t('record.channel')}</dt>
        <dd>{t(`domain:channel.${reservation.channel}`)}</dd>
        <dt>{t('record.amount')}</dt>
        <dd>
          {`${format.price(reservation.amountCents)} · ${t(`domain:payment.${reservation.payment}`)}`}
        </dd>
        {reservation.notes && (
          <>
            <dt>{t('record.notes')}</dt>
            <dd>{reservation.notes}</dd>
          </>
        )}
      </dl>

      <div className={layout.row}>
        {canCheckIn(reservation, now) && (
          <Button
            variant="primary"
            onPress={() => {
              checkIn.mutate(undefined, done(t('record.checkedIn')));
            }}
          >
            {t('record.checkIn')}
          </Button>
        )}
        {attendance === 'unrecorded' && (
          <Button
            onPress={() => {
              noShow.mutate(undefined, done(t('record.markedNoShow')));
            }}
          >
            {t('record.noShow')}
          </Button>
        )}
        {cancellable && (
          <DialogTrigger>
            <Button variant="danger">{t('record.cancel')}</Button>
            <ConfirmDialog
              title={t('record.cancelTitle', { code: reservation.code })}
              confirmLabel={t('record.cancelConfirm')}
              tone="danger"
              onConfirm={() => {
                cancel.mutate(undefined, done(t('record.cancelled')));
              }}
            >
              <p>{t('record.cancelBody')}</p>
            </ConfirmDialog>
          </DialogTrigger>
        )}
      </div>

      <section className={layout.section} aria-labelledby="record-history">
        <h2 id="record-history">{t('record.history')}</h2>
        <ol className={layout.stack}>
          {reservation.history.map((event) => (
            <li key={`${event.at}-${event.type}`}>
              {t(`record.event.${event.type}`, { at: format.dateTime(event.at) })}
              {event.detail && ` (${event.detail})`}
            </li>
          ))}
        </ol>
      </section>
    </Page>
  );
}
