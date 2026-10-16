// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Pending } from '../../app/Pending';
import { Emblem } from '../../app/Emblem';
import { Page } from '../../app/Page';
import { adminPaths, citizenPaths, deputacionPaths } from '../../app/routes/paths';
import { useDemo } from '../../app/state';
import { LANGUAGE_NAMES } from '../../config/app';
import type { DeputacionIndicators } from '../../data/ports/repositories';
import { DEPUTACION } from '../../data/seed/catalog';
import { ratio, type Indicators } from '../../domain/analytics/indicators';
import { addDays, zonedNow } from '../../domain/time';
import type { DateRange, Tenant } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import { accessibleColor } from '../../ui/contrast';
import { DataTable } from '../../ui/DataTable';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { Select } from '../../ui/Select';
import { useDeputacionQuery } from './queries';

const PERIODS = ['last4', 'last8'] as const;
type Period = (typeof PERIODS)[number];

const periodRange = (period: Period, today: string): DateRange => ({
  from: addDays(today, period === 'last4' ? -28 : -56),
  to: addDays(today, -1),
});

export function DeputacionHome() {
  const { t } = useTranslation('deputacion');
  const [params] = useSearchParams();
  const councils = useDeputacionQuery(['councils'], (r, id) => r.deputacions.listCouncils(id));
  const created = councils.data?.find((c) => c.slug === params.get('novo'));
  const [period, setPeriod] = useState<Period>('last4');
  const range = periodRange(period, today());
  const figures = useDeputacionQuery(['deputacionIndicators', range], (r, id) =>
    r.deputacions.indicators(id, range),
  );

  return (
    <Page
      title={t('home.title')}
      {...(created ? { announcement: t('home.createdAnnouncement', { name: created.name }) } : {})}
    >
      {created && (
        <p className={layout.notice} data-tone="success">
          {t('home.created', { name: created.name })}
        </p>
      )}
      <p>{t('home.intro', { name: DEPUTACION.name })}</p>
      <p>
        <Link href={deputacionPaths.newCouncil} variant="primary">
          {t('home.newCouncil')}
        </Link>
      </p>
      {councils.data ? (
        <>
          <Councils councils={councils.data} figures={figures.data} />
          <section className={layout.section} aria-labelledby="compare">
            <h2 id="compare">{t('compare.title')}</h2>
            <PeriodPicker period={period} range={range} onChange={setPeriod} />
            {figures.data ? (
              <ComparisonReport figures={figures.data} councils={councils.data} />
            ) : (
              <Pending queries={[figures]} label={t('compare.loading')} size="section" />
            )}
          </section>
        </>
      ) : (
        <Pending queries={[councils]} label={t('compare.loading')} size="section" />
      )}
      <Deployment />
    </Page>
  );
}

function Councils({
  councils,
  figures,
}: {
  councils: Tenant[];
  figures: DeputacionIndicators | undefined;
}) {
  const { t } = useTranslation('deputacion');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const demo = useDemo();
  const format = useFormat();
  const facilityCount = (tenantId: string) =>
    figures?.councils.find((c) => c.tenantId === tenantId)?.indicators.facilities.length;

  // Leaving the back office: the council is then seen as a resident or as its staff.
  const viewAsResident = () => {
    demo.setRole('citizen');
    void queryClient.invalidateQueries();
  };
  const manage = (council: Tenant) => {
    demo.setRole('staff');
    demo.setStaff('carme');
    void queryClient.invalidateQueries();
    void navigate(adminPaths(council.slug).home);
  };

  return (
    <section className={layout.section} aria-labelledby="councils">
      <h2 id="councils">{t('home.councils')}</h2>
      <ul className={layout.cards}>
        {councils.map((council) => (
          <Card
            key={council.id}
            as="li"
            headingLevel={3}
            title={
              <span
                className={layout.row}
                style={{ '--color-accent': accessibleColor(council.primaryColor) } as CSSProperties}
              >
                <Emblem kind={council.emblem} />
                {council.name}
              </span>
            }
            footer={
              <ul className={layout.stack}>
                <li>
                  <Link href={citizenPaths(council.slug).home} onPress={viewAsResident}>
                    {t('home.visit', { name: council.name })}
                  </Link>
                </li>
                <li>
                  <Button
                    onPress={() => {
                      manage(council);
                    }}
                    aria-describedby={`manage-help-${council.id}`}
                  >
                    {t('home.manage', { name: council.name })}
                  </Button>
                  <p id={`manage-help-${council.id}`} className={layout.meta}>
                    {t('home.manageHelp')}
                  </p>
                </li>
              </ul>
            }
          >
            <ul className={[layout.stack, layout.meta].join(' ')}>
              <li>{t('home.address', { slug: council.slug })}</li>
              <li>
                {t('home.languages', {
                  list: format.list(council.languages.map((l) => LANGUAGE_NAMES[l])),
                })}
              </li>
              {facilityCount(council.id) !== undefined && (
                <li>{t('home.facilities', { count: facilityCount(council.id) })}</li>
              )}
            </ul>
          </Card>
        ))}
      </ul>
    </section>
  );
}

const today = () => zonedNow(new Date(), 'Europe/Madrid').date;

const assistedShare = ({ byChannel }: Indicators) =>
  ratio(byChannel.phone + byChannel.inPerson, byChannel.web + byChannel.phone + byChannel.inPerson);

function PeriodPicker({
  period,
  range,
  onChange,
}: {
  period: Period;
  range: DateRange;
  onChange: (period: Period) => void;
}) {
  const { t } = useTranslation('deputacion');
  const format = useFormat();
  return (
    <div className={layout.row}>
      <Select
        label={t('compare.period')}
        value={period}
        onChange={(value) => {
          onChange(value as Period);
        }}
        options={PERIODS.map((p) => ({ id: p, label: t(`compare.periods.${p}`) }))}
      />
      <p className={layout.meta}>
        {t('compare.range', { from: format.fullDate(range.from), to: format.fullDate(range.to) })}
      </p>
    </div>
  );
}

interface Row {
  id: string;
  name: string;
  indicators: Indicators;
}

function ComparisonReport({
  figures,
  councils,
}: {
  figures: DeputacionIndicators;
  councils: Tenant[];
}) {
  const { t } = useTranslation('deputacion');
  const format = useFormat();
  const nameOf = (tenantId: string) => councils.find((c) => c.id === tenantId)?.name ?? tenantId;
  const rows: Row[] = [
    ...figures.councils.map((c) => ({
      id: c.tenantId,
      name: nameOf(c.tenantId),
      indicators: c.indicators,
    })),
    { id: 'total', name: t('compare.total'), indicators: figures.total },
  ];
  const leader = (value: (i: Indicators) => number) =>
    figures.councils.reduce((best, c) => (value(c.indicators) > value(best.indicators) ? c : best));
  const busiest = figures.councils.length > 0 ? leader((i) => i.occupancy) : undefined;
  const absent = figures.councils.length > 0 ? leader((i) => i.noShowRate) : undefined;

  return (
    <>
      {busiest && absent && (
        <p>
          {t('compare.summary', {
            bookings: figures.total.bookings,
            occupancy: format.percent(figures.total.occupancy),
            busiest: nameOf(busiest.tenantId),
            busiestOccupancy: format.percent(busiest.indicators.occupancy),
            absent: nameOf(absent.tenantId),
            absentRate: format.percent(absent.indicators.noShowRate),
          })}
        </p>
      )}
      <DataTable
        caption={t('compare.caption')}
        rows={rows}
        rowKey={(row) => row.id}
        columns={[
          { key: 'name', header: t('compare.council'), isRowHeader: true, render: (r) => r.name },
          {
            key: 'bookings',
            header: t('compare.bookings'),
            align: 'end',
            render: (r) => r.indicators.bookings,
          },
          {
            key: 'occupancy',
            header: t('compare.occupancy'),
            align: 'end',
            render: (r) => format.percent(r.indicators.occupancy),
          },
          {
            key: 'cancellations',
            header: t('compare.cancellationRate'),
            align: 'end',
            render: (r) => format.percent(r.indicators.cancellationRate),
          },
          {
            key: 'noShows',
            header: t('compare.noShowRate'),
            align: 'end',
            render: (r) => format.percent(r.indicators.noShowRate),
          },
          {
            key: 'assisted',
            header: t('compare.assistedShare'),
            align: 'end',
            render: (r) => format.percent(assistedShare(r.indicators)),
          },
        ]}
      />
    </>
  );
}

function Deployment() {
  const { t } = useTranslation('deputacion');
  return (
    <section className={layout.section} aria-labelledby="deployment">
      <h2 id="deployment">{t('deployment.title')}</h2>
      <p>{t('deployment.intro')}</p>
      <ul className={layout.cards}>
        {(['shared', 'own'] as const).map((model) => (
          <Card key={model} as="li" headingLevel={3} title={t(`deployment.${model}.title`)}>
            <p>{t(`deployment.${model}.body`)}</p>
          </Card>
        ))}
      </ul>
    </section>
  );
}
