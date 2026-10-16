// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { attendanceOf } from '../../domain/rules/attendance';
import { addDays, byDateAndStart, startOfWeek, zonedNow } from '../../domain/time';
import { useFormat } from '../../i18n/format';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { StatList } from '../../ui/StatList';
import { useStaff, useStaffQuery } from './queries';
import { ReservationTable } from './ReservationTable';

export function AdminHome() {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant, isAdmin } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const now = zonedNow(new Date(), tenant.timeZone);
  const tomorrow = addDays(now.date, 1);
  const week = { from: startOfWeek(now.date), to: addDays(startOfWeek(now.date), 6) };

  const reservations = useStaffQuery(['reservations', now.date, tomorrow], (r, id) =>
    r.reservations.list(id, { from: now.date, to: tomorrow }),
  );
  const indicators = useStaffQuery(['indicators', week], (r, id) => r.indicators.get(id, week));
  const facilities = useFacilities();

  const active = (reservations.data ?? []).filter((r) => r.status !== 'cancelled');
  const today = active.filter((r) => r.date === now.date).sort(byDateAndStart);
  const unrecorded = today.filter((r) => attendanceOf(r, now) === 'unrecorded');

  const quickLinks = [
    { href: paths.newBooking(), label: t('home.quick.newBooking') },
    { href: paths.access, label: t('home.quick.access') },
    { href: paths.agenda(), label: t('home.quick.agenda') },
    ...(isAdmin
      ? [
          { href: paths.blocks, label: t('home.quick.block') },
          { href: paths.newSeason, label: t('home.quick.season') },
        ]
      : []),
  ];

  return (
    <Page title={t('home.title')}>
      <p>{t('home.intro', { date: format.longDate(now.date) })}</p>

      <section className={layout.section} aria-labelledby="home-figures">
        <h2 id="home-figures">{t('home.figures')}</h2>
        {!reservations.data || !indicators.data ? (
          <Pending queries={[reservations, indicators]} size="section" />
        ) : (
          <StatList
            stats={[
              { label: t('home.today'), value: String(today.length) },
              {
                label: t('home.tomorrow'),
                value: String(active.filter((r) => r.date === tomorrow).length),
              },
              {
                label: t('home.weekOccupancy'),
                value: format.percent(indicators.data.occupancy),
              },
              {
                label: t('home.weekCancellations'),
                value: String(indicators.data.cancellations),
              },
              { label: t('home.weekNoShows'), value: String(indicators.data.noShows) },
              {
                label: t('home.unrecorded'),
                value: String(unrecorded.length),
                detail:
                  unrecorded.length > 0 ? (
                    <Link href={paths.access}>{t('home.unrecordedLink')}</Link>
                  ) : undefined,
              },
            ]}
          />
        )}
      </section>

      <nav className={layout.section} aria-labelledby="home-quick">
        <h2 id="home-quick">{t('home.quickTitle')}</h2>
        <ul className={layout.row}>
          {quickLinks.map((link) => (
            <li key={link.href}>
              <Link href={link.href} variant="secondary">
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <section className={layout.section} aria-labelledby="home-today">
        <h2 id="home-today">{t('home.todayTitle')}</h2>
        {!reservations.data ? null : today.length === 0 ? (
          <p>{t('home.noneToday')}</p>
        ) : (
          <ReservationTable
            caption={t('home.todayCaption', { date: format.longDate(now.date) })}
            reservations={today}
            facilities={facilities.data ?? []}
          />
        )}
      </section>
    </Page>
  );
}
