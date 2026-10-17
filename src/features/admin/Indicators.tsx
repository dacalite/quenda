// SPDX-License-Identifier: EUPL-1.2
import { useState, type CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { downloadFile } from '../../app/download';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import {
  busiestTime,
  quietestTimes,
  ratio,
  type Indicators as Figures,
} from '../../domain/analytics/indicators';
import { toCsv, type CsvValue } from '../../domain/csv';
import { addDays, zonedNow } from '../../domain/time';
import type { DateRange, Facility, Weekday } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSubspaceName, useWeekdayName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import layout from '../../ui/layout.module.css';
import { Select } from '../../ui/Select';
import { StatList } from '../../ui/StatList';
import styles from './admin.module.css';
import { useStaff, useStaffQuery } from './queries';

const PERIODS = ['last4', 'last8', 'next2'] as const;
const CHANNELS = ['web', 'phone', 'inPerson'] as const;
const HOLDER_KINDS = ['user', 'entity'] as const;
type Period = (typeof PERIODS)[number];

const periodRange = (period: Period, today: string): DateRange =>
  period === 'next2'
    ? { from: today, to: addDays(today, 13) }
    : { from: addDays(today, period === 'last4' ? -28 : -56), to: addDays(today, -1) };

function useCsv() {
  return (name: string, header: string[], rows: CsvValue[][]) => {
    // The byte order mark lets spreadsheet programs read accents correctly.
    downloadFile(`${name}.csv`, `\uFEFF${toCsv(header, rows)}`, 'text/csv;charset=utf-8');
  };
}

export function Indicators() {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const format = useFormat();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const [period, setPeriod] = useState<Period>('last4');
  const range = periodRange(period, today);
  const indicators = useStaffQuery(['indicators', range], (r, id) => r.indicators.get(id, range));
  const facilities = useFacilities();

  return (
    <Page title={t('indicators.title')}>
      <div className={layout.row}>
        <Select
          label={t('indicators.period')}
          value={period}
          onChange={(value) => {
            setPeriod(value as Period);
          }}
          options={PERIODS.map((p) => ({ id: p, label: t(`indicators.periods.${p}`) }))}
        />
        <p className={layout.meta}>
          {t('blocks.dateRange', {
            from: format.longDate(range.from),
            to: format.longDate(range.to),
          })}
        </p>
      </div>
      {indicators.data && facilities.data ? (
        <Report figures={indicators.data} facilities={facilities.data} />
      ) : (
        <Pending queries={[indicators, facilities]} size="section" />
      )}
    </Page>
  );
}

function Report({ figures, facilities }: { figures: Figures; facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const weekdayName = useWeekdayName();
  const format = useFormat();
  const csv = useCsv();
  const nameOf = (id: string) => facilities.find((f) => f.id === id)?.name ?? '';
  const ranked = figures.facilities.toSorted((a, b) => b.occupancy - a.occupancy);
  const top = ranked[0];
  const [facilityId, setFacilityId] = useState(top?.facilityId ?? '');
  const selected = figures.facilities.find((f) => f.facilityId === facilityId);
  const busiest = selected && busiestTime(selected.heatmap);
  const share = (n: number, total: number) => format.percent(ratio(n, total));
  const holders = figures.byHolder.user + figures.byHolder.entity;

  return (
    <>
      <section className={layout.section} aria-labelledby="indicators-summary">
        <h2 id="indicators-summary">{t('indicators.summary')}</h2>
        <StatList
          stats={[
            { label: t('indicators.bookings'), value: String(figures.bookings) },
            { label: t('indicators.occupancy'), value: format.percent(figures.occupancy) },
            {
              label: t('indicators.cancellationRate'),
              value: format.percent(figures.cancellationRate),
              detail: t('indicators.cancellations', { count: figures.cancellations }),
            },
            {
              label: t('indicators.noShowRate'),
              value: format.percent(figures.noShowRate),
              detail: t('indicators.noShows', { count: figures.noShows }),
            },
          ]}
        />
        {top && (
          <p>
            {t('indicators.topFacility', {
              facility: nameOf(top.facilityId),
              occupancy: format.percent(top.occupancy),
            })}
          </p>
        )}
      </section>

      <section className={layout.section} aria-labelledby="indicators-facilities">
        <h2 id="indicators-facilities">{t('indicators.byFacility')}</h2>
        <DataTable
          caption={t('indicators.byFacility')}
          hideCaption
          rows={ranked}
          rowKey={(f) => f.facilityId}
          columns={[
            {
              key: 'facility',
              header: t('indicators.facility'),
              isRowHeader: true,
              render: (f) => nameOf(f.facilityId),
            },
            {
              key: 'bookings',
              header: t('indicators.bookings'),
              align: 'end',
              render: (f) => String(f.bookings),
            },
            {
              key: 'occupancy',
              header: t('indicators.occupancy'),
              render: (f) => <Bar value={f.occupancy} label={format.percent(f.occupancy)} />,
            },
          ]}
        />
        <p>
          <Button
            onPress={() => {
              csv(
                `ocupacion-${figures.range.from}-${figures.range.to}`,
                [t('indicators.facility'), t('indicators.bookings'), t('indicators.occupancy')],
                ranked.map((f) => [nameOf(f.facilityId), f.bookings, f.occupancy.toFixed(3)]),
              );
            }}
          >
            {t('indicators.downloadCsv', { table: t('indicators.byFacility') })}
          </Button>
        </p>
      </section>

      <section className={layout.section} aria-labelledby="indicators-heatmap">
        <h2 id="indicators-heatmap">{t('indicators.heatmap')}</h2>
        <Select
          label={t('indicators.facility')}
          value={facilityId}
          onChange={setFacilityId}
          options={ranked.map((f) => ({ id: f.facilityId, label: nameOf(f.facilityId) }))}
        />
        {selected && busiest ? (
          <>
            <p>
              {t('indicators.busiest', {
                facility: nameOf(selected.facilityId),
                day: weekdayName(busiest.weekday),
                time: busiest.start,
                occupancy: format.percent(busiest.occupancy),
              })}{' '}
              {t('indicators.quietest', {
                times: format.list(
                  quietestTimes(selected.heatmap, 3).map((c) =>
                    t('indicators.dayAt', { day: weekdayName(c.weekday), time: c.start }),
                  ),
                ),
              })}
            </p>
            <Heatmap facilityName={nameOf(selected.facilityId)} heatmap={selected.heatmap} />
            <p>
              <Button
                onPress={() => {
                  csv(
                    `ocupacion-horaria-${selected.facilityId}`,
                    [t('indicators.weekday'), t('table.time'), t('indicators.occupancy')],
                    selected.heatmap.map((c) => [
                      weekdayName(c.weekday),
                      c.start,
                      c.occupancy.toFixed(3),
                    ]),
                  );
                }}
              >
                {t('indicators.downloadCsv', { table: t('indicators.heatmap') })}
              </Button>
            </p>
          </>
        ) : (
          <p>{t('indicators.noData')}</p>
        )}
      </section>

      <section className={layout.section} aria-labelledby="indicators-split">
        <h2 id="indicators-split">{t('indicators.split')}</h2>
        <div className={layout.split}>
          <DataTable
            caption={t('indicators.byChannel')}
            rows={[...CHANNELS]}
            rowKey={(c) => c}
            columns={[
              {
                key: 'channel',
                header: t('indicators.channel'),
                isRowHeader: true,
                render: (c) => t(`domain:channel.${c}`),
              },
              {
                key: 'count',
                header: t('indicators.bookings'),
                align: 'end',
                render: (c) => String(figures.byChannel[c]),
              },
              {
                key: 'share',
                header: t('indicators.share'),
                align: 'end',
                render: (c) => share(figures.byChannel[c], figures.bookings),
              },
            ]}
          />
          <DataTable
            caption={t('indicators.byHolder')}
            rows={[...HOLDER_KINDS]}
            rowKey={(h) => h}
            columns={[
              {
                key: 'holder',
                header: t('indicators.holder'),
                isRowHeader: true,
                render: (h) => t(`indicators.holderKind.${h}`),
              },
              {
                key: 'count',
                header: t('indicators.bookings'),
                align: 'end',
                render: (h) => String(figures.byHolder[h]),
              },
              {
                key: 'share',
                header: t('indicators.share'),
                align: 'end',
                render: (h) => share(figures.byHolder[h], holders),
              },
            ]}
          />
        </div>
      </section>

      <BookingsExport range={figures.range} facilities={facilities} />
    </>
  );
}

function Bar({ value, label }: { value: number; label: string }) {
  return (
    <span className={styles.barCell}>
      <span className={styles.barTrack} aria-hidden="true">
        <span
          className={styles.bar}
          style={{ inlineSize: `${String(Math.round(value * 100))}%` }}
        />
      </span>
      {label}
    </span>
  );
}

/** Occupancy by weekday and hour: a table whose shading only reinforces the written figures. */
function Heatmap({
  facilityName,
  heatmap,
}: {
  facilityName: string;
  heatmap: Figures['facilities'][number]['heatmap'];
}) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const weekdayName = useWeekdayName();
  const format = useFormat();
  const days = [...new Set(heatmap.map((c) => c.weekday))].sort();
  const times = [...new Set(heatmap.map((c) => c.start))].sort();
  const cell = (weekday: Weekday, start: string) =>
    heatmap.find((c) => c.weekday === weekday && c.start === start);

  return (
    <DataTable
      caption={t('indicators.heatmapCaption', { facility: facilityName })}
      rows={times}
      rowKey={(time) => time}
      columns={[
        { key: 'time', header: t('table.time'), isRowHeader: true, render: (time) => time },
        ...days.map((day) => ({
          key: String(day),
          header: weekdayName(day),
          align: 'end' as const,
          render: (time: string) => {
            const found = cell(day, time);
            return found ? (
              <span className={styles.heat} style={{ '--level': found.occupancy } as CSSProperties}>
                {format.percent(found.occupancy)}
              </span>
            ) : (
              '—'
            );
          },
        })),
      ]}
    />
  );
}

/** Every booking in the period, without names: enough to analyse use, nothing personal. */
function BookingsExport({ range, facilities }: { range: DateRange; facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const csv = useCsv();
  const subspaceName = useSubspaceName();
  const reservations = useStaffQuery(['reservations', 'export', range], (r, id) =>
    r.reservations.list(id, range),
  );

  return (
    <section className={layout.section} aria-labelledby="indicators-export">
      <h2 id="indicators-export">{t('indicators.export')}</h2>
      <p>{t('indicators.exportHelp')}</p>
      <p>
        <Button
          isDisabled={!reservations.data}
          onPress={() => {
            csv(
              `reservas-${range.from}-${range.to}`,
              [
                t('table.code'),
                t('indicators.date'),
                t('indicators.start'),
                t('indicators.end'),
                t('indicators.facility'),
                t('indicators.space'),
                t('indicators.channel'),
                t('indicators.status'),
                t('indicators.holder'),
              ],
              (reservations.data ?? []).map((r) => {
                const facility = facilities.find((f) => f.id === r.facilityId);
                return [
                  r.code,
                  r.date,
                  r.start,
                  r.end,
                  facility?.name,
                  facility ? subspaceName(facility, r.subspaceId) : '',
                  t(`domain:channel.${r.channel}`),
                  t(`domain:reservationStatus.${r.status}`),
                  t(`indicators.holderKind.${r.holder.kind}`),
                ];
              }),
            );
          }}
        >
          {t('indicators.exportButton', { count: reservations.data?.length ?? 0 })}
        </Button>
      </p>
    </section>
  );
}
