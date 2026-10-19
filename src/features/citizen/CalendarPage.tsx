// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadFile } from '../../app/download';
import { Page } from '../../app/Page';
import { Pending } from '../../app/Pending';
import { useFacilities } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import { zonedNow } from '../../domain/time';
import type { IsoDate, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName } from '../../i18n/labels';
import { useAnnounce } from '../../ui/announcer';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { MonthCalendar, type DayMark } from '../../ui/MonthCalendar';
import { StatusBadge } from '../../ui/StatusBadge';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import { RESERVATION_TONE, useReservationsIcs } from './labels';
import { useCitizen, useMyReservations } from './queries';
import { Ticket } from './Ticket';

export function CalendarPage() {
  const { t } = useTranslation(['citizen', 'domain']);
  const { tenant, userId } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const reservations = useMyReservations();
  const facilities = useFacilities();
  const ics = useReservationsIcs();
  const toast = useToast();
  const announce = useAnnounce();
  const format = useFormat();
  const subspaceName = useSubspaceName();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const [day, setDay] = useState<IsoDate>(today);

  const booked = (reservations.data ?? [])
    .filter((r) => r.status !== 'cancelled')
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`));
  const byDay = new Map<IsoDate, Reservation[]>();
  for (const r of booked) byDay.set(r.date, [...(byDay.get(r.date) ?? []), r]);
  const marks: Partial<Record<IsoDate, DayMark>> = {};
  for (const [date, list] of byDay) {
    marks[date] = {
      count: list.length,
      description: t('calendar.dayCount', { count: list.length }),
    };
  }
  const ofDay = byDay.get(day) ?? [];
  const upcoming = booked.filter((r) => r.status === 'confirmed' && r.date >= today);
  // Simulated: the real service would issue a random, revocable token per person,
  // so calendar apps can read it without signing in.
  const url = `${window.location.origin}${import.meta.env.BASE_URL}api/v1/calendar-feeds/${btoa(`${tenant.slug}:${userId ?? ''}`).replace(/=/g, '')}.ics`;

  return (
    <Page title={t('calendar.title')}>
      <p>{t('calendar.intro')}</p>
      {!reservations.data || !facilities.data ? (
        <Pending queries={[reservations, facilities]} size="section" />
      ) : (
        <div className={styles.calendarLayout}>
          <section aria-labelledby="calendar-month">
            <h2 id="calendar-month">{t('calendar.monthTitle')}</h2>
            <p className={layout.meta}>{t('calendar.monthHelp')}</p>
            <MonthCalendar
              label={t('calendar.monthTitle')}
              value={day}
              onChange={(date) => {
                setDay(date);
                const count = byDay.get(date)?.length ?? 0;
                announce(
                  `${format.longDate(date)}: ${count ? t('calendar.dayCount', { count }) : t('calendar.dayEmpty')}`,
                );
              }}
              marks={marks}
              previousLabel={t('calendar.previousMonth')}
              nextLabel={t('calendar.nextMonth')}
            />
          </section>
          <section aria-labelledby="calendar-day" className={styles.calendarDay}>
            <h2 id="calendar-day" className={styles.calendarDayTitle}>
              {format.longDate(day)}
            </h2>
            {ofDay.length === 0 ? (
              <p>{t('calendar.dayEmpty')}</p>
            ) : (
              <ul className={layout.stack}>
                {ofDay.map((reservation) => {
                  const facility = facilities.data.find((f) => f.id === reservation.facilityId);
                  return facility ? (
                    <Ticket
                      key={reservation.id}
                      reservation={reservation}
                      facilityName={`${facility.name}, ${subspaceName(facility, reservation.subspaceId)}`}
                      href={paths.reservation(reservation.id)}
                      muted={reservation.status !== 'confirmed'}
                    >
                      <p className={layout.row}>
                        <StatusBadge tone={RESERVATION_TONE[reservation.status]}>
                          {t(`domain:reservationStatus.${reservation.status}`)}
                        </StatusBadge>
                      </p>
                    </Ticket>
                  ) : null;
                })}
              </ul>
            )}
          </section>
        </div>
      )}
      <section className={layout.panel} aria-labelledby="calendar-download">
        <h2 id="calendar-download">{t('calendar.downloadTitle')}</h2>
        <p>{t('calendar.downloadHelp')}</p>
        <p>
          <Button
            variant="primary"
            onPress={() => {
              downloadFile(
                `reservas-${tenant.slug}.ics`,
                ics(tenant, upcoming, facilities.data ?? []),
                'text/calendar',
              );
            }}
          >
            <Icon name="calendar" />
            {t('calendar.download')}
          </Button>
        </p>
      </section>
      <section className={layout.panel} aria-labelledby="calendar-subscribe">
        <h2 id="calendar-subscribe">{t('calendar.subscribeTitle')}</h2>
        <p>{t('calendar.subscribeHelp')}</p>
        <TextField label={t('calendar.url')} value={url} isReadOnly />
        <p>
          <Button
            onPress={() => {
              void navigator.clipboard.writeText(url).then(() => {
                toast(t('calendar.copied'));
              });
            }}
          >
            {t('calendar.copy')}
          </Button>
        </p>
        <p className={layout.meta}>{t('calendar.simulated')}</p>
      </section>
    </Page>
  );
}
