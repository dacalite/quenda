// SPDX-License-Identifier: EUPL-1.2
import { useQueries } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';
import { Page } from '../../app/Page';
import { citizenPaths } from '../../app/routes/paths';
import type { AvailabilitySlot } from '../../domain/rules/availability';
import { daypart, minutesBetween, zonedNow, type Daypart } from '../../domain/time';
import type { AccessibilityFeature, FacilityType } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { Checkbox } from '../../ui/Checkbox';
import { DatePicker } from '../../ui/DatePicker';
import { Link } from '../../ui/Link';
import { Select } from '../../ui/Select';
import { StatusBadge } from '../../ui/StatusBadge';
import { TextField } from '../../ui/TextField';
import styles from './citizen.module.css';
import { FacilityImage } from './FacilityImage';
import { useLocalized } from './labels';
import { useAvailabilityQuery, useCitizen, useFacilities } from './queries';

const FEATURES: AccessibilityFeature[] = [
  'stepFreeAccess',
  'adaptedChangingRoom',
  'adaptedToilet',
  'reservedParking',
  'hearingLoop',
];
const DAYPARTS: Daypart[] = ['morning', 'afternoon', 'evening'];
const ANY = 'any';

export function FacilityList() {
  const { t } = useTranslation(['citizen', 'domain', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const localized = useLocalized();
  const [params, setParams] = useSearchParams();
  const facilities = useFacilities();
  const availabilityQuery = useAvailabilityQuery();
  const now = zonedNow(new Date(), tenant.timeZone);

  const applied = {
    q: params.get('q') ?? '',
    type: params.get('tipo') ?? ANY,
    date: params.get('data'),
    daypart: params.get('franxa') ?? ANY,
    features: (params.get('acc') ?? '').split(',').filter(Boolean),
    now: params.get('agora') === '1',
  };
  const [draft, setDraft] = useState(applied);

  const all = facilities.data ?? [];
  const checkDate = applied.now ? now.date : applied.date;
  const availability = useQueries({
    queries: all.map((f) => ({
      ...availabilityQuery(f.id, checkDate ?? now.date),
      enabled: Boolean(checkDate),
    })),
  });

  const hasFreeSlot = (slots: AvailabilitySlot[] | undefined) =>
    (slots ?? []).some(
      (slot) =>
        slot.status === 'free' &&
        (applied.daypart === ANY || daypart(slot.start) === applied.daypart) &&
        (!applied.now || minutesBetween(now, { date: slot.date, time: slot.start }) <= 60),
    );

  const search = applied.q.toLowerCase();
  const results = all.filter(
    (facility, index) =>
      facility.status === 'active' &&
      (!search ||
        `${facility.name} ${t(`domain:facilityType.${facility.type}`)}`
          .toLowerCase()
          .includes(search)) &&
      (applied.type === ANY || facility.type === applied.type) &&
      applied.features.every((f) => facility.accessibility.includes(f as AccessibilityFeature)) &&
      (!checkDate || hasFreeSlot(availability[index]?.data)),
  );
  const loading = facilities.isPending || availability.some((q) => q.isPending && checkDate);
  const types = [...new Set(all.map((f) => f.type))];

  return (
    <Page title={t('list.title')}>
      <form
        className={styles.panel}
        aria-labelledby="filters-title"
        onSubmit={(event) => {
          event.preventDefault();
          setParams({
            ...(draft.q ? { q: draft.q } : {}),
            ...(draft.type !== ANY ? { tipo: draft.type } : {}),
            ...(draft.date ? { data: draft.date } : {}),
            ...(draft.daypart !== ANY ? { franxa: draft.daypart } : {}),
            ...(draft.features.length ? { acc: draft.features.join(',') } : {}),
            ...(draft.now ? { agora: '1' } : {}),
          });
        }}
      >
        <h2 id="filters-title">{t('list.filters')}</h2>
        <div className={styles.filters}>
          <TextField
            label={t('list.search')}
            type="search"
            value={draft.q}
            onChange={(q) => {
              setDraft({ ...draft, q });
            }}
          />
          <Select
            label={t('list.type')}
            value={draft.type}
            onChange={(type) => {
              setDraft({ ...draft, type });
            }}
            options={[
              { id: ANY, label: t('list.anyType') },
              ...types.map((type: FacilityType) => ({
                id: type,
                label: t(`domain:facilityType.${type}`),
              })),
            ]}
          />
          <DatePicker
            label={t('list.date')}
            value={draft.date}
            minValue={now.date}
            onChange={(date) => {
              setDraft({ ...draft, date });
            }}
          />
          <Select
            label={t('list.daypart')}
            value={draft.daypart}
            onChange={(value) => {
              setDraft({ ...draft, daypart: value });
            }}
            options={[
              { id: ANY, label: t('list.anyDaypart') },
              ...DAYPARTS.map((part) => ({ id: part, label: t(`domain:daypart.${part}`) })),
            ]}
          />
        </div>
        <fieldset className={styles.fieldset}>
          <legend>{t('list.accessibility')}</legend>
          <div className={styles.row}>
            {FEATURES.map((feature) => (
              <Checkbox
                key={feature}
                isSelected={draft.features.includes(feature)}
                onChange={(selected) => {
                  setDraft({
                    ...draft,
                    features: selected
                      ? [...draft.features, feature]
                      : draft.features.filter((f) => f !== feature),
                  });
                }}
              >
                {t(`domain:accessibility.${feature}`)}
              </Checkbox>
            ))}
          </div>
        </fieldset>
        <Checkbox
          isSelected={draft.now}
          onChange={(value) => {
            setDraft({ ...draft, now: value });
          }}
        >
          {t('list.availableNow')}
        </Checkbox>
        <div className={styles.row}>
          <Button type="submit" variant="primary">
            {t('list.apply')}
          </Button>
          <Link
            href={paths.facilities()}
            onPress={() => {
              setDraft({ q: '', type: ANY, date: null, daypart: ANY, features: [], now: false });
            }}
          >
            {t('list.clear')}
          </Link>
        </div>
      </form>

      <p role="status" aria-busy={loading}>
        {loading ? t('common:loading') : t('list.results', { count: results.length })}
      </p>
      {!loading && results.length === 0 && <p>{t('list.noResults')}</p>}

      <ul className={styles.cards}>
        {results.map((facility) => (
          <Card
            key={facility.id}
            as="li"
            title={<Link href={paths.facility(facility.id)}>{facility.name}</Link>}
            footer={
              <>
                <Link
                  href={paths.availability(facility.id, applied.date ? { date: applied.date } : {})}
                  variant="primary"
                >
                  {t('list.seeAvailability')}
                </Link>
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${String(facility.coordinates.lat)},${String(facility.coordinates.lng)}`}
                  aria-label={t('list.mapLabel', { name: facility.name })}
                >
                  {t('list.map')}
                </Link>
              </>
            }
          >
            <FacilityImage
              type={facility.type}
              alt={facility.photos[0] ? localized(facility.photos[0].alt) : ''}
            />
            <p className={styles.meta}>
              {t(`domain:facilityType.${facility.type}`)} · {facility.address}
            </p>
            {facility.accessibility.length > 0 && (
              <ul className={styles.featureList} aria-label={t('list.accessibility')}>
                {facility.accessibility.map((feature) => (
                  <li key={feature}>
                    <StatusBadge tone="info">{t(`domain:accessibility.${feature}`)}</StatusBadge>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </ul>
    </Page>
  );
}
