// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { attendanceOf, canCheckIn } from '../../domain/rules/attendance';
import { byDateAndStart, zonedNow, type LocalDateTime } from '../../domain/time';
import type { Facility, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { AttendanceBadge } from './labels';
import { canScanQr } from './barcode';
import { QrScanner } from './QrScanner';
import { useHolderName, useStaff, useStaffMutation, useStaffQuery } from './queries';

export function AccessControl() {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const format = useFormat();
  const [code, setCode] = useState('');
  const [lookup, setLookup] = useState('');
  const [scanning, setScanning] = useState(false);
  const now = zonedNow(new Date(), tenant.timeZone);
  const facilities = useFacilities();
  const found = useStaffQuery(
    ['reservations', 'code', lookup],
    lookup ? (r, id) => r.reservations.getByCode(id, lookup) : null,
  );
  const today = useStaffQuery(['reservations', 'day', now.date], (r, id) =>
    r.reservations.list(id, { from: now.date, to: now.date }),
  );
  const todays = (today.data ?? []).filter((r) => r.status !== 'cancelled').sort(byDateAndStart);

  const check = (value: string) => {
    setCode(value);
    setLookup(value.trim().toUpperCase());
  };

  return (
    <Page title={t('access.title')}>
      <section className={layout.section} aria-labelledby="access-check">
        <h2 id="access-check">{t('access.checkTitle')}</h2>
        <form
          className={layout.row}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            check(code);
          }}
        >
          <TextField
            label={t('access.code')}
            description={t('access.codeHelp')}
            value={code}
            onChange={setCode}
            autoComplete="off"
            spellCheck="false"
          />
          <Button type="submit" variant="primary">
            {t('access.check')}
          </Button>
          {canScanQr() && !scanning && (
            <Button
              onPress={() => {
                setScanning(true);
              }}
            >
              {t('access.scan')}
            </Button>
          )}
        </form>
        {scanning && (
          <QrScanner
            onCode={(value) => {
              setScanning(false);
              check(value);
            }}
            onClose={() => {
              setScanning(false);
            }}
          />
        )}
        <div aria-live="polite">
          {lookup &&
            (found.isError ? (
              <p className={layout.notice} data-tone="danger">
                {t('access.notFound', { code: lookup })}
              </p>
            ) : found.data ? (
              <Verdict
                reservation={found.data}
                facility={facilities.data?.find((f) => f.id === found.data.facilityId)}
                now={now}
              />
            ) : null)}
        </div>
      </section>

      <section className={layout.section} aria-labelledby="access-today">
        <h2 id="access-today">{t('access.todayTitle')}</h2>
        {today.isPending ? (
          <p aria-busy="true">{t('common:loading')}</p>
        ) : todays.length === 0 ? (
          <p>{t('home.noneToday')}</p>
        ) : (
          <TodayTable
            caption={t('home.todayCaption', { date: format.longDate(now.date) })}
            reservations={todays}
            facilities={facilities.data ?? []}
            now={now}
          />
        )}
      </section>
    </Page>
  );
}

/** What the person at the door needs: whose booking it is, and whether they can come in now. */
function Verdict({
  reservation,
  facility,
  now,
}: {
  reservation: Reservation;
  facility: Facility | undefined;
  now: LocalDateTime;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const format = useFormat();
  const holderName = useHolderName();
  const subspaceName = useSubspaceName();
  const attendance = attendanceOf(reservation, now);
  const tone = attendance === 'checkedIn' || canCheckIn(reservation, now) ? 'success' : 'warning';
  const message = canCheckIn(reservation, now)
    ? t('access.verdict.valid')
    : attendance === 'checkedIn'
      ? t('access.verdict.already')
      : attendance === 'cancelled'
        ? t('access.verdict.cancelled')
        : reservation.date !== now.date
          ? t('access.verdict.otherDay', { date: format.longDate(reservation.date) })
          : t('access.verdict.over');

  return (
    <div className={layout.notice} data-tone={tone}>
      <p>
        <strong>{message}</strong>
      </p>
      <dl className={layout.details}>
        <dt>{t('record.holder')}</dt>
        <dd>{holderName(reservation.holder)}</dd>
        <dt>{t('record.place')}</dt>
        <dd>
          {facility ? `${facility.name} · ${subspaceName(facility, reservation.subspaceId)}` : ''}
        </dd>
        <dt>{t('record.when')}</dt>
        <dd>{`${format.longDate(reservation.date)}, ${format.timeRange(reservation.start, reservation.end)}`}</dd>
        <dt>{t('record.status')}</dt>
        <dd>
          <AttendanceBadge reservation={reservation} now={now} />
        </dd>
      </dl>
      <AttendanceActions reservation={reservation} now={now} />
    </div>
  );
}

function AttendanceActions({ reservation, now }: { reservation: Reservation; now: LocalDateTime }) {
  const { t } = useTranslation(['admin', 'common']);
  const toast = useToast();
  const checkIn = useStaffMutation((r, id, reservationId: string) =>
    r.reservations.checkIn(id, reservationId),
  );
  const noShow = useStaffMutation((r, id, reservationId: string) =>
    r.reservations.markNoShow(id, reservationId),
  );
  const onError = () => {
    toast(t('common:error.title'), 'danger');
  };

  if (canCheckIn(reservation, now)) {
    return (
      <Button
        variant="primary"
        aria-label={t('access.checkInFor', { code: reservation.code })}
        onPress={() => {
          checkIn.mutate(reservation.id, {
            onSuccess: () => {
              toast(t('access.checkedIn', { code: reservation.code }));
            },
            onError,
          });
        }}
      >
        {t('record.checkIn')}
      </Button>
    );
  }
  if (attendanceOf(reservation, now) === 'unrecorded') {
    return (
      <Button
        aria-label={t('access.noShowFor', { code: reservation.code })}
        onPress={() => {
          noShow.mutate(reservation.id, {
            onSuccess: () => {
              toast(t('access.markedNoShow', { code: reservation.code }));
            },
            onError,
          });
        }}
      >
        {t('record.noShow')}
      </Button>
    );
  }
  return null;
}

function TodayTable({
  caption,
  reservations,
  facilities,
  now,
}: {
  caption: string;
  reservations: Reservation[];
  facilities: Facility[];
  now: LocalDateTime;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const holderName = useHolderName();
  const subspaceName = useSubspaceName();

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
          render: (r) => format.timeRange(r.start, r.end),
        },
        {
          key: 'place',
          header: t('table.place'),
          render: (r) => {
            const facility = facilities.find((f) => f.id === r.facilityId);
            return facility ? `${facility.name} · ${subspaceName(facility, r.subspaceId)}` : '';
          },
        },
        { key: 'holder', header: t('table.holder'), render: (r) => holderName(r.holder) },
        {
          key: 'code',
          header: t('table.code'),
          render: (r) => (
            <Link href={paths.reservation(r.id)} aria-label={t('table.open', { code: r.code })}>
              {r.code}
            </Link>
          ),
        },
        {
          key: 'attendance',
          header: t('table.attendance'),
          render: (r) => <AttendanceBadge reservation={r} now={now} />,
        },
        {
          key: 'action',
          header: t('table.action'),
          render: (r) => <AttendanceActions reservation={r} now={now} />,
        },
      ]}
    />
  );
}
