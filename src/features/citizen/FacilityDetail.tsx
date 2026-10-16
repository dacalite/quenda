// SPDX-License-Identifier: EUPL-1.2
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacility, useSchedule } from '../../app/queries';
import { useRepositories } from '../../app/repositories';
import { citizenPaths } from '../../app/routes/paths';
import { computePrice } from '../../domain/rules/pricing';
import { addDays, zonedNow } from '../../domain/time';
import type { Concession, Weekday } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized } from '../../i18n/labels';
import { DataTable } from '../../ui/DataTable';
import { Icon } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import { StatusBadge } from '../../ui/StatusBadge';
import { NotFoundPage } from '../../app/pages';
import layout from '../../ui/layout.module.css';
import { FacilityImage } from './FacilityImage';
import { useCitizen, useMe } from './queries';

const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
// 2026-10-19 is a Monday: weekday names come from Intl in the page language.
const weekdayDate = (weekday: Weekday) => addDays('2026-10-19', weekday - 1);

export function FacilityDetail() {
  const { facilityId = '' } = useParams();
  const { t } = useTranslation(['citizen', 'domain', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const repositories = useRepositories();
  const localized = useLocalized();
  const format = useFormat();
  const facility = useFacility(facilityId);
  const schedule = useSchedule(facilityId);
  const me = useMe();

  const nextFree = useQuery({
    queryKey: ['next-free', tenant.id, facilityId],
    queryFn: async () => {
      const today = zonedNow(new Date(), tenant.timeZone).date;
      for (let day = 0; day < 7; day++) {
        const slots = await repositories.facilities.availability(
          tenant.id,
          facilityId,
          addDays(today, day),
        );
        const free = slots.find((slot) => slot.status === 'free');
        if (free) return free;
      }
      return null;
    },
  });

  if (facility.isError) return <NotFoundPage />;
  if (!facility.data) return <Pending queries={[facility]} size="section" />;

  const f = facility.data;
  const slotMinutes = schedule.data?.slotMinutes ?? 60;
  const user = me.data;
  const yourTariff = user ? (user.resident ? 'resident' : 'nonResident') : null;
  const tariffs = [
    { id: 'resident', cents: f.pricing.residentCents },
    { id: 'nonResident', cents: f.pricing.nonResidentCents },
    { id: 'entity', cents: f.pricing.entitiesFree ? 0 : f.pricing.residentCents },
  ] as const;
  const yourPrice = user
    ? computePrice({ kind: 'user', user }, f.pricing, slotMinutes, slotMinutes)
    : null;

  return (
    <Page title={f.name}>
      <div className={layout.split}>
        <FacilityImage type={f.type} alt={f.photos[0] ? localized(f.photos[0].alt) : ''} />
        <div className={layout.section}>
          <p>{localized(f.description)}</p>
          <dl className={layout.details}>
            <dt>{t('facility.type')}</dt>
            <dd>{t(`domain:facilityType.${f.type}`)}</dd>
            <dt>{t('facility.address')}</dt>
            <dd>{f.address}</dd>
          </dl>
          <p className={layout.meta}>{t('facility.capacity', { count: f.capacity })}</p>
          <p>
            {nextFree.data
              ? t('facility.nextFree', {
                  date: format.longDate(nextFree.data.date),
                  time: format.timeRange(nextFree.data.start, nextFree.data.end),
                })
              : nextFree.isSuccess && t('facility.noNextFree')}
          </p>
          <p>
            <Link href={paths.availability(f.id)} variant="primary">
              {t('facility.book')}
            </Link>
          </p>
        </div>
      </div>

      <section className={layout.panel} aria-labelledby="facility-accessibility">
        <h2 id="facility-accessibility">{t('facility.accessibilityTitle')}</h2>
        {f.accessibility.length === 0 ? (
          <p>{t('facility.noAccessibility')}</p>
        ) : (
          <ul className={layout.stack}>
            {f.accessibility.map((feature) => (
              <li key={feature} className={layout.row}>
                <Icon name="check" />
                {t(`domain:accessibility.${feature}`)}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={layout.section} aria-labelledby="facility-rules">
        <h2 id="facility-rules">{t('facility.rulesTitle')}</h2>
        <p>{localized(f.usageRules)}</p>
      </section>

      <section className={layout.section} aria-labelledby="facility-prices">
        <h2 id="facility-prices">{t('facility.pricesTitle')}</h2>
        <DataTable
          caption={t('facility.pricesCaption', { minutes: slotMinutes })}
          rows={[...tariffs]}
          rowKey={(row) => row.id}
          columns={[
            {
              key: 'tariff',
              header: t('facility.tariffColumn'),
              isRowHeader: true,
              render: (row) => (
                <span className={layout.row}>
                  {t(`domain:tariff.${row.id}`)}
                  {row.id === yourTariff && (
                    <StatusBadge tone="info">{t('facility.yourTariff')}</StatusBadge>
                  )}
                </span>
              ),
            },
            {
              key: 'price',
              header: t('facility.priceColumn'),
              align: 'end',
              render: (row) => format.price(row.cents),
            },
          ]}
        />
        {yourPrice && yourPrice.discountPercent > 0 && yourPrice.concession && (
          <p>
            {t('booking.discount', {
              name: t(`domain:concession.${yourPrice.concession}`),
              percent: format.percent(yourPrice.discountPercent / 100),
            })}
          </p>
        )}
        <h3>{t('facility.concessionsTitle')}</h3>
        <ul>
          {(Object.entries(f.pricing.concessions) as [Concession, number][]).map(
            ([concession, percent]) => (
              <li key={concession}>
                {t('facility.concessionItem', {
                  name: t(`domain:concession.${concession}`),
                  percent: format.percent(percent / 100),
                })}
              </li>
            ),
          )}
          {f.pricing.entitiesFree && <li>{t('facility.entitiesFree')}</li>}
        </ul>
      </section>

      {schedule.data && (
        <section className={layout.section} aria-labelledby="facility-schedule">
          <h2 id="facility-schedule">{t('facility.scheduleTitle')}</h2>
          <DataTable
            caption={t('facility.scheduleCaption')}
            hideCaption
            rows={WEEKDAYS}
            rowKey={String}
            columns={[
              {
                key: 'day',
                header: t('facility.dayColumn'),
                isRowHeader: true,
                render: (weekday) => format.weekday(weekdayDate(weekday)),
              },
              {
                key: 'hours',
                header: t('facility.hoursColumn'),
                render: (weekday) => {
                  const ranges = schedule.data.weekly[weekday];
                  return ranges.length === 0
                    ? t('facility.closed')
                    : ranges.map((r) => format.timeRange(r.start, r.end)).join(', ');
                },
              },
            ]}
          />
        </section>
      )}
    </Page>
  );
}
