// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import type { RecurringBooking } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName, useWeekdayName } from '../../i18n/labels';
import { DataTable } from '../../ui/DataTable';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { useStaff, useStaffQuery } from './queries';

export function Seasons() {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const weekdayName = useWeekdayName();
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const format = useFormat();
  const subspaceName = useSubspaceName();
  const facilities = useFacilities();
  const entities = useStaffQuery(['entities'], (r, id) => r.entities.list(id));
  const bookings = useStaffQuery(['recurringBookings'], (r, id) => r.recurringBookings.list(id));
  const entityName = (b: RecurringBooking) =>
    entities.data?.find((e) => e.id === b.entityId)?.name ?? '';
  const rows = (bookings.data ?? []).toSorted(
    (a, b) =>
      entityName(a).localeCompare(entityName(b)) ||
      a.weekday - b.weekday ||
      a.times.start.localeCompare(b.times.start),
  );

  return (
    <Page title={t('seasons.title')}>
      <p>{t('seasons.intro')}</p>
      <p>
        <Link href={paths.newSeason} variant="primary">
          {t('seasons.new')}
        </Link>
      </p>

      <section className={layout.section} aria-labelledby="seasons-schedules">
        <h2 id="seasons-schedules">{t('seasons.schedules')}</h2>
        {/* Each row is named by its club, so the table waits for every list it reads. */}
        {bookings.data && entities.data && facilities.data ? (
          <DataTable
            caption={t('seasons.schedules')}
            hideCaption
            rows={rows}
            rowKey={(b) => b.id}
            columns={[
              { key: 'entity', header: t('seasons.entity'), isRowHeader: true, render: entityName },
              {
                key: 'place',
                header: t('table.place'),
                render: (b) => {
                  const facility = facilities.data.find((f) => f.id === b.facilityId);
                  return facility
                    ? `${facility.name} · ${subspaceName(facility, b.subspaceId)}`
                    : '';
                },
              },
              {
                key: 'when',
                header: t('seasons.when'),
                render: (b) =>
                  t('seasons.weekly', {
                    day: weekdayName(b.weekday),
                    time: format.timeRange(b.times.start, b.times.end),
                  }),
              },
              {
                key: 'season',
                header: t('seasons.season'),
                render: (b) =>
                  t('blocks.dateRange', {
                    from: format.fullDate(b.season.from),
                    to: format.fullDate(b.season.to),
                  }),
              },
              {
                key: 'skipped',
                header: t('seasons.skipped'),
                align: 'end',
                render: (b) => String(b.exceptions.length),
              },
            ]}
          />
        ) : (
          <Pending queries={[bookings, entities, facilities]} />
        )}
      </section>

      <section className={layout.section} aria-labelledby="seasons-entities">
        <h2 id="seasons-entities">{t('seasons.entities')}</h2>
        <DataTable
          caption={t('seasons.entities')}
          hideCaption
          rows={entities.data ?? []}
          rowKey={(e) => e.id}
          columns={[
            { key: 'name', header: t('seasons.entity'), isRowHeader: true, render: (e) => e.name },
            {
              key: 'kind',
              header: t('seasons.kind'),
              render: (e) => t(`domain:entityKind.${e.kind}`),
            },
            { key: 'registry', header: t('seasons.registry'), render: (e) => e.registryNumber },
            {
              key: 'contact',
              header: t('seasons.contact'),
              render: (e) => `${e.contactName} · ${e.phone}`,
            },
          ]}
        />
      </section>
    </Page>
  );
}
