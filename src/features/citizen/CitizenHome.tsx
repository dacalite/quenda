// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import { zonedNow } from '../../domain/time';
import { useFormat } from '../../i18n/format';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Link } from '../../ui/Link';
import { TextField } from '../../ui/TextField';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import { useCitizen, useMyReservations, useNotifications } from './queries';

export function CitizenHome() {
  const { t } = useTranslation(['citizen', 'domain']);
  const { tenant, signedIn } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const navigate = useNavigate();
  const format = useFormat();
  const [search, setSearch] = useState('');
  const facilities = useFacilities();
  const reservations = useMyReservations();
  const notifications = useNotifications();

  const today = zonedNow(new Date(), tenant.timeZone).date;
  const upcoming = (reservations.data ?? [])
    .filter((r) => r.status === 'confirmed' && r.date >= today)
    .sort((a, b) => `${a.date}${a.start}`.localeCompare(`${b.date}${b.start}`))
    .slice(0, 3);
  const unread = (notifications.data ?? []).filter((n) => !n.readAt).length;
  const types = [...new Set((facilities.data ?? []).map((f) => f.type))];
  const facilityName = (id: string) => facilities.data?.find((f) => f.id === id)?.name ?? '';

  return (
    <Page title={t('home.title')}>
      <p>{t('home.intro')}</p>

      <form
        role="search"
        className={layout.row}
        onSubmit={(event) => {
          event.preventDefault();
          void navigate(paths.facilities({ q: search.trim() || undefined }));
        }}
      >
        <TextField
          label={t('home.searchLabel')}
          description={t('home.searchHelp')}
          value={search}
          onChange={setSearch}
          type="search"
        />
        <Button type="submit" variant="primary">
          {t('home.search')}
        </Button>
      </form>

      <section className={layout.section} aria-labelledby="home-types">
        <h2 id="home-types">{t('home.types')}</h2>
        <ul className={styles.featureList}>
          {types.map((type) => (
            <li key={type}>
              <Link href={paths.facilities({ tipo: type })} variant="secondary">
                {t(`domain:facilityType.${type}`)}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {signedIn ? (
        <div className={layout.split}>
          <section className={layout.section} aria-labelledby="home-upcoming">
            <h2 id="home-upcoming">{t('home.upcoming')}</h2>
            {upcoming.length === 0 ? (
              <p>{t('home.noUpcoming')}</p>
            ) : (
              <ul className={layout.stack}>
                {upcoming.map((r) => (
                  <Card key={r.id} as="li" headingLevel={3} title={facilityName(r.facilityId)}>
                    <p>
                      {format.longDate(r.date)}, {format.timeRange(r.start, r.end)}
                    </p>
                    <Link href={paths.reservation(r.id)}>
                      {t('reservation.title', { code: r.code })}
                    </Link>
                  </Card>
                ))}
              </ul>
            )}
            <p>
              <Link href={paths.reservations}>{t('home.allReservations')}</Link>
            </p>
          </section>
          <section className={layout.section} aria-labelledby="home-notices">
            <h2 id="home-notices">{t('home.notices')}</h2>
            <p>{unread > 0 ? t('home.unread', { count: unread }) : t('home.noUnread')}</p>
            <p>
              <Link href={paths.notifications}>{t('home.seeNotices')}</Link>
            </p>
          </section>
        </div>
      ) : (
        <div className={layout.panel}>
          <p>{t('home.signInPrompt')}</p>
          <p>
            <Link href={paths.signIn(paths.home)} variant="primary">
              {t('session.signIn')}
            </Link>
          </p>
        </div>
      )}
    </Page>
  );
}
