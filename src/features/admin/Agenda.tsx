// SPDX-License-Identifier: EUPL-1.2
import { useQueries } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Page } from '../../app/Page';
import { useAvailability, useAvailabilityQuery, useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { occupiesSlot, type AvailabilitySlot } from '../../domain/rules/availability';
import { addDays, rangesOverlap, startOfWeek, zonedNow } from '../../domain/time';
import type { Facility, IsoDate, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized, useSubspaceName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { DatePicker } from '../../ui/DatePicker';
import { Icon } from '../../ui/Icon';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { Select } from '../../ui/Select';
import { Tab, TabList, TabPanel, Tabs } from '../../ui/Tabs';
import styles from './admin.module.css';
import { useHolderName, useStaff, useStaffQuery } from './queries';

const isIsoDate = (value: string | null): value is IsoDate =>
  Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));

export function Agenda() {
  const { t } = useTranslation(['admin', 'common']);
  const facilities = useFacilities();
  const [params] = useSearchParams();
  const facility =
    facilities.data?.find((f) => f.id === params.get('instalacion')) ?? facilities.data?.[0];
  if (!facility || !facilities.data) {
    return (
      <Page title={t('agenda.title')}>
        <p aria-busy="true">{t('common:loading')}</p>
      </Page>
    );
  }
  return <AgendaFor facility={facility} facilities={facilities.data} />;
}

function AgendaFor({ facility, facilities }: { facility: Facility; facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const localized = useLocalized();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const requested = params.get('data');
  const date = isIsoDate(requested) ? requested : today;
  const week = params.get('vista') === 'semana';
  const range = week
    ? { from: startOfWeek(date), to: addDays(startOfWeek(date), 6) }
    : { from: date, to: date };

  const reservations = useStaffQuery(['reservations', facility.id, range], (r, id) =>
    r.reservations.list(id, { facilityId: facility.id, ...range }),
  );
  const booked = (reservations.data ?? []).filter(occupiesSlot);

  const go = (changes: { date?: IsoDate; facilityId?: string; week?: boolean }) => {
    void navigate(
      paths.agenda({
        date: changes.date ?? date,
        facilityId: changes.facilityId ?? facility.id,
        week: changes.week ?? week,
      }),
      { replace: changes.week !== undefined },
    );
  };

  return (
    <Page title={t('agenda.title')}>
      <div className={layout.row}>
        <Select
          label={t('agenda.facility')}
          value={facility.id}
          onChange={(value) => {
            go({ facilityId: value });
          }}
          options={facilities.map((f) => ({ id: f.id, label: f.name }))}
        />
        <Button
          onPress={() => {
            go({ date: addDays(date, week ? -7 : -1) });
          }}
        >
          <Icon name="chevronLeft" />
          {t(week ? 'agenda.previousWeek' : 'agenda.previousDay')}
        </Button>
        <DatePicker
          label={t('agenda.date')}
          value={date}
          onChange={(value) => {
            if (value) go({ date: value });
          }}
        />
        <Button
          onPress={() => {
            go({ date: addDays(date, week ? 7 : 1) });
          }}
        >
          {t(week ? 'agenda.nextWeek' : 'agenda.nextDay')}
          <Icon name="chevronRight" />
        </Button>
        {date !== today && (
          <Button
            variant="quiet"
            onPress={() => {
              go({ date: today });
            }}
          >
            {t('agenda.today')}
          </Button>
        )}
      </div>

      <Tabs
        selectedKey={week ? 'week' : 'day'}
        onSelectionChange={(key) => {
          go({ week: key === 'week' });
        }}
      >
        <TabList aria-label={t('agenda.views')}>
          <Tab id="day">{t('agenda.dayView')}</Tab>
          <Tab id="week">{t('agenda.weekView')}</Tab>
        </TabList>
        <TabPanel id="day">
          <DayGrid facility={facility} date={date} reservations={booked} />
        </TabPanel>
        <TabPanel id="week">
          {facility.subspaces.map((subspace) => (
            <WeekGrid
              key={subspace.id}
              facility={facility}
              subspaceId={subspace.id}
              caption={t('agenda.weekCaption', {
                space: localized(subspace.name),
                date: format.longDate(range.from),
              })}
              from={range.from}
              reservations={booked}
            />
          ))}
        </TabPanel>
      </Tabs>
    </Page>
  );
}

function DayGrid({
  facility,
  date,
  reservations,
}: {
  facility: Facility;
  date: IsoDate;
  reservations: Reservation[];
}) {
  const { t } = useTranslation(['admin', 'common']);
  const format = useFormat();
  const localized = useLocalized();
  const availability = useAvailability(facility.id, date);
  const slots = availability.data ?? [];
  const times = [...new Set(slots.map((s) => s.start))].sort();

  if (availability.isPending) return <p aria-busy="true">{t('common:loading')}</p>;
  if (times.length === 0) return <p>{t('agenda.closed')}</p>;

  return (
    <DataTable
      caption={t('agenda.dayCaption', { facility: facility.name, date: format.longDate(date) })}
      rows={times}
      rowKey={(time) => time}
      columns={[
        { key: 'time', header: t('table.time'), isRowHeader: true, render: (time) => time },
        ...facility.subspaces.map((subspace) => ({
          key: subspace.id,
          header: localized(subspace.name),
          render: (time: string) => {
            const slot = slots.find((s) => s.subspaceId === subspace.id && s.start === time);
            return slot ? (
              <AgendaCell facility={facility} slot={slot} reservations={reservations} />
            ) : (
              '—'
            );
          },
        })),
      ]}
    />
  );
}

function WeekGrid({
  facility,
  subspaceId,
  caption,
  from,
  reservations,
}: {
  facility: Facility;
  subspaceId: string;
  caption: string;
  from: IsoDate;
  reservations: Reservation[];
}) {
  const { t } = useTranslation(['admin', 'common']);
  const format = useFormat();
  const availabilityQuery = useAvailabilityQuery();
  const days = Array.from({ length: 7 }, (_, i) => addDays(from, i));
  const results = useQueries({ queries: days.map((day) => availabilityQuery(facility.id, day)) });
  const byDay = days.map((_, i) =>
    (results[i]?.data ?? []).filter((slot) => slot.subspaceId === subspaceId),
  );
  const times = [...new Set(byDay.flat().map((slot) => slot.start))].sort();

  return (
    <DataTable
      caption={caption}
      rows={times}
      rowKey={(time) => time}
      columns={[
        { key: 'time', header: t('table.time'), isRowHeader: true, render: (time) => time },
        ...days.map((day, i) => ({
          key: day,
          header: format.shortDate(day),
          render: (time: string) => {
            const slot = byDay[i]?.find((s) => s.start === time);
            return slot ? (
              <AgendaCell facility={facility} slot={slot} reservations={reservations} />
            ) : (
              '—'
            );
          },
        })),
      ]}
    />
  );
}

/** Who has the slot, or a link to book it on someone's behalf. */
function AgendaCell({
  facility,
  slot,
  reservations,
}: {
  facility: Facility;
  slot: AvailabilitySlot;
  reservations: Reservation[];
}) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const subspaceName = useSubspaceName();
  const holderName = useHolderName();
  const here = reservations.filter(
    (r) => r.subspaceId === slot.subspaceId && r.date === slot.date && rangesOverlap(r, slot),
  );

  return (
    <div className={styles.cell}>
      {here.map((r) => (
        <Link key={r.id} href={paths.reservation(r.id)}>
          {`${holderName(r.holder)} (${r.code})`}
        </Link>
      ))}
      {slot.status === 'free' ? (
        <Link
          href={paths.newBooking(slot)}
          aria-label={t('agenda.bookSlot', {
            space: subspaceName(facility, slot.subspaceId),
            date: format.longDate(slot.date),
            time: slot.start,
          })}
        >
          {t('agenda.book')}
        </Link>
      ) : (
        here.length === 0 && <span>{t(`domain:slotStatus.${slot.status}`)}</span>
      )}
    </div>
  );
}
