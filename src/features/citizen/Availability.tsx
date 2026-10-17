// SPDX-License-Identifier: EUPL-1.2
import { useQueries } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { Pending } from '../../app/Pending';
import { NotFoundPage } from '../../app/pages';
import { Page } from '../../app/Page';
import { useAvailability, useAvailabilityQuery, useFacility, useSchedule } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import type { AvailabilitySlot } from '../../domain/rules/availability';
import { computePrice } from '../../domain/rules/pricing';
import { addDays, daypart, startOfWeek, zonedNow, type Daypart } from '../../domain/time';
import type { Facility, IsoDate } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { DatePicker } from '../../ui/DatePicker';
import { Icon } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import { Select } from '../../ui/Select';
import { Tab, TabList, TabPanel, Tabs } from '../../ui/Tabs';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import { useSlotDescription } from './labels';
import { useCitizen, useMe, useRecommendations, useReservation } from './queries';

const DAYPARTS: Daypart[] = ['morning', 'afternoon', 'evening'];
const isIsoDate = (value: string | null): value is IsoDate =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export function Availability() {
  const { facilityId = '' } = useParams();
  const facility = useFacility(facilityId);
  if (facility.isError) return <NotFoundPage />;
  if (!facility.data) return null;
  return <AvailabilityFor facility={facility.data} />;
}

function AvailabilityFor({ facility }: { facility: Facility }) {
  const { t } = useTranslation(['citizen', 'domain', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const format = useFormat();
  const localized = useLocalized();
  const navigate = useNavigate();
  const describe = useSlotDescription(facility);
  const [params] = useSearchParams();
  const today = zonedNow(new Date(), tenant.timeZone).date;

  const requested = params.get('data');
  const date = isIsoDate(requested) && requested >= today ? requested : today;
  const subspaceId =
    facility.subspaces.find((s) => s.id === params.get('espazo'))?.id ??
    facility.subspaces[0]?.id ??
    '';
  const week = params.get('vista') === 'semana';
  const replaces = params.get('cambiar') ?? undefined;

  const schedule = useSchedule(facility.id);
  const me = useMe();
  const availability = useAvailability(facility.id, date);
  const recommendations = useRecommendations(facility.id, date);
  const changing = useReservation(replaces ?? '');

  const go = (changes: { date?: IsoDate; subspaceId?: string; week?: boolean }) => {
    void navigate(
      paths.availability(facility.id, {
        date: changes.date ?? date,
        subspaceId: changes.subspaceId ?? subspaceId,
        week: changes.week ?? week,
        ...(replaces ? { replaces } : {}),
      }),
      { replace: changes.week !== undefined },
    );
  };

  const slotMinutes = schedule.data?.slotMinutes ?? 60;
  const user = me.data;
  // Before signing in we show the resident rate; the review step shows the exact price.
  const price = user
    ? computePrice({ kind: 'user', user }, facility.pricing, slotMinutes, slotMinutes).totalCents
    : facility.pricing.residentCents;

  const bookingHref = (slot: AvailabilitySlot) =>
    paths.booking({
      facilityId: facility.id,
      subspaceId: slot.subspaceId,
      date: slot.date,
      start: slot.start,
      end: slot.end,
      replaces,
    });

  // Folded at first: on a phone the slots, not the suggestions, are what most people came for.
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const suggestionsId = useId();

  const stripStart = addDays(date, -3) < today ? today : addDays(date, -3);
  const stripDays = Array.from({ length: 7 }, (_, i) => addDays(stripStart, i));

  const slots = (availability.data ?? []).filter((slot) => slot.subspaceId === subspaceId);

  const recommended = (recommendations.data ?? []).flatMap((r) => {
    const all = availability.data ?? [];
    const slot =
      all.find((s) => s.start === r.start && s.subspaceId === subspaceId && s.status === 'free') ??
      all.find((s) => s.start === r.start && s.status === 'free');
    return slot ? [{ ...r, slot }] : [];
  });

  return (
    <Page title={t('availability.title', { name: facility.name })}>
      {replaces && changing.data && (
        <p className={layout.notice} data-tone="info">
          {t('availability.changing', { code: changing.data.code })}
        </p>
      )}

      <ul className={styles.dayStrip} aria-label={t('availability.days')}>
        {stripDays.map((day) => (
          <li key={day}>
            <Link
              href={paths.availability(facility.id, {
                date: day,
                subspaceId,
                week,
                ...(replaces ? { replaces } : {}),
              })}
              className={styles.day}
              aria-current={day === date ? 'date' : undefined}
            >
              <span aria-hidden="true">{format.weekdayShort(day)}</span>
              <span aria-hidden="true" className={styles.dayNumber}>
                {format.dayOfMonth(day)}
              </span>
              <span className="visually-hidden">{format.longDate(day)}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className={styles.dayControls}>
        <DatePicker
          label={t('availability.date')}
          value={date}
          minValue={today}
          onChange={(value) => {
            if (value) go({ date: value });
          }}
        />
        <div className={styles.dayButtons}>
          <Button
            variant="quiet"
            isDisabled={date <= today}
            onPress={() => {
              go({ date: addDays(date, -1) });
            }}
          >
            <Icon name="chevronLeft" />
            {t('availability.previousDay')}
          </Button>
          <Button
            variant="quiet"
            onPress={() => {
              go({ date: addDays(date, 1) });
            }}
          >
            {t('availability.nextDay')}
            <Icon name="chevronRight" />
          </Button>
        </div>
        {facility.subspaces.length > 1 && (
          <Select
            label={t('availability.subspace')}
            value={subspaceId}
            onChange={(value) => {
              go({ subspaceId: value });
            }}
            options={facility.subspaces.map((s) => ({ id: s.id, label: localized(s.name) }))}
          />
        )}
      </div>

      {recommended.length > 0 && (
        <section className={layout.panel} aria-labelledby="recommendations-title">
          <h2 id="recommendations-title" className={styles.disclosureTitle}>
            <Button
              variant="quiet"
              aria-expanded={suggestionsOpen}
              aria-controls={suggestionsId}
              onPress={() => {
                setSuggestionsOpen(!suggestionsOpen);
              }}
            >
              <Icon name={suggestionsOpen ? 'chevronDown' : 'chevronRight'} />
              {t('availability.recommendationsTitle')}
            </Button>
          </h2>
          <p>
            {t('availability.recommendationsIntro', {
              times: format.list(recommended.map((r) => r.start).sort()),
            })}
          </p>
          <ul id={suggestionsId} className={styles.suggestions} hidden={!suggestionsOpen}>
            {recommended.map((r) => (
              <li key={r.start}>
                <Link href={bookingHref(r.slot)} className={styles.suggestion}>
                  <Icon name="clock" />
                  {t('availability.recommendation', {
                    time: r.start,
                    percent: format.percent(r.expectedOccupancy),
                  })}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Tabs
        selectedKey={week ? 'week' : 'day'}
        onSelectionChange={(key) => {
          go({ week: key === 'week' });
        }}
      >
        <TabList aria-label={t('availability.views')}>
          <Tab id="day">{t('availability.dayView')}</Tab>
          <Tab id="week">{t('availability.weekView')}</Tab>
        </TabList>
        <TabPanel id="day">
          {!availability.data ? (
            <Pending queries={[availability]} size="section" />
          ) : slots.length === 0 ? (
            <p>{t('availability.noSlots')}</p>
          ) : (
            <div className={styles.dayparts}>
              {!slots.some((s) => s.status === 'free') && <p>{t('availability.noFree')}</p>}
              {DAYPARTS.map((part) => {
                const partSlots = slots.filter((slot) => daypart(slot.start) === part);
                if (partSlots.length === 0) return null;
                return (
                  <section key={part} className={layout.section} aria-labelledby={`part-${part}`}>
                    <h2 id={`part-${part}`}>{t(`domain:daypart.${part}`)}</h2>
                    <ul className={styles.slots}>
                      {partSlots.map((slot) => (
                        <li key={slot.start}>
                          {slot.status === 'free' ? (
                            <Link
                              href={bookingHref(slot)}
                              className={styles.slot}
                              data-status="free"
                              aria-label={describe(slot, price)}
                            >
                              <span className={styles.slotTime}>
                                {format.timeRange(slot.start, slot.end)}
                              </span>
                              <span className={styles.slotMeta}>
                                <span className={styles.slotStatus}>
                                  <Icon name="success" />
                                  {t('domain:slotStatus.free')}
                                </span>
                                <span className={styles.slotPrice}>{format.price(price)}</span>
                              </span>
                            </Link>
                          ) : (
                            <span className={styles.slot} data-status={slot.status}>
                              <span className={styles.slotTime}>
                                {format.timeRange(slot.start, slot.end)}
                              </span>
                              <span className={styles.slotStatus}>
                                <Icon name={slot.status === 'booked' ? 'neutral' : 'lock'} />
                                {t(`domain:slotStatus.${slot.status}`)}
                              </span>
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          )}
        </TabPanel>
        <TabPanel id="week">
          <WeekGrid
            facility={facility}
            date={date}
            subspaceId={subspaceId}
            bookingHref={bookingHref}
            price={price}
          />
        </TabPanel>
      </Tabs>
    </Page>
  );
}

function WeekGrid({
  facility,
  date,
  subspaceId,
  bookingHref,
  price,
}: {
  facility: Facility;
  date: IsoDate;
  subspaceId: string;
  bookingHref: (slot: AvailabilitySlot) => string;
  price: number;
}) {
  const { t } = useTranslation(['citizen', 'domain']);
  const format = useFormat();
  const describe = useSlotDescription(facility);
  const availabilityQuery = useAvailabilityQuery();
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(date), i));
  const results = useQueries({ queries: days.map((day) => availabilityQuery(facility.id, day)) });
  const byDay = days.map((_, i) =>
    (results[i]?.data ?? []).filter((slot) => slot.subspaceId === subspaceId),
  );
  const times = [...new Set(byDay.flat().map((slot) => slot.start))].sort();

  return (
    <DataTable
      caption={t('availability.weekCaption', { date: format.longDate(days[0] ?? date) })}
      rows={times}
      rowKey={(time) => time}
      columns={[
        {
          key: 'time',
          header: t('availability.timeColumn'),
          isRowHeader: true,
          render: (time) => time,
        },
        ...days.map((day, i) => ({
          key: day,
          header: format.shortDate(day),
          render: (time: string) => {
            const slot = byDay[i]?.find((s) => s.start === time);
            if (!slot) return '—';
            return slot.status === 'free' ? (
              <Link href={bookingHref(slot)} aria-label={describe(slot, price)}>
                {t('domain:slotStatus.free')}
              </Link>
            ) : (
              t(`domain:slotStatus.${slot.status}`)
            );
          },
        })),
      ]}
    />
  );
}
