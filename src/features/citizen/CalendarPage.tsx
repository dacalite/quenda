// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { downloadFile } from '../../app/download';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { zonedNow } from '../../domain/time';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import { useReservationsIcs } from './labels';
import { useCitizen, useMyReservations } from './queries';

export function CalendarPage() {
  const { t } = useTranslation('citizen');
  const { tenant, userId } = useCitizen();
  const reservations = useMyReservations();
  const facilities = useFacilities();
  const ics = useReservationsIcs();
  const toast = useToast();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const upcoming = (reservations.data ?? []).filter(
    (r) => r.status === 'confirmed' && r.date >= today,
  );
  // Simulated: the real service would issue a random, revocable token per person.
  // In the real system, a revocable secret per person, so calendar apps can read it without signing in.
  const url = `${window.location.origin}${import.meta.env.BASE_URL}api/v1/calendar-feeds/${btoa(`${tenant.slug}:${userId ?? ''}`).replace(/=/g, '')}.ics`;

  return (
    <Page title={t('calendar.title')}>
      <p>{t('calendar.intro')}</p>
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
