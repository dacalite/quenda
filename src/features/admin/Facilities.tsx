// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { ConflictError } from '../../data/ports/errors';
import type { HolidayInput } from '../../data/ports/repositories';
import { zonedNow } from '../../domain/time';
import type { IsoDate } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { DatePicker } from '../../ui/DatePicker';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { StatusBadge } from '../../ui/StatusBadge';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { useStaff, useStaffMutation, useStaffQuery } from './queries';

export function Facilities() {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const facilities = useFacilities();

  return (
    <Page title={t('facilities.title')}>
      <p>
        <Link href={paths.newFacility} variant="primary">
          {t('facilities.new')}
        </Link>
      </p>
      {facilities.data ? (
        <DataTable
          caption={t('facilities.caption')}
          hideCaption
          rows={facilities.data}
          rowKey={(f) => f.id}
          columns={[
            {
              key: 'name',
              header: t('facilities.name'),
              isRowHeader: true,
              render: (f) => <Link href={paths.facility(f.id)}>{f.name}</Link>,
            },
            {
              key: 'type',
              header: t('facilities.type'),
              render: (f) => t(`domain:facilityType.${f.type}`),
            },
            {
              key: 'spaces',
              header: t('facilities.spaces'),
              align: 'end',
              render: (f) => String(f.subspaces.length),
            },
            {
              key: 'status',
              header: t('facilities.status'),
              render: (f) => (
                <StatusBadge tone={f.status === 'active' ? 'success' : 'neutral'}>
                  {t(`facilities.statusValue.${f.status}`)}
                </StatusBadge>
              ),
            },
            {
              key: 'schedule',
              header: t('facilities.schedule'),
              render: (f) => (
                <Link
                  href={paths.schedule(f.id)}
                  aria-label={t('facilities.scheduleOf', { name: f.name })}
                >
                  {t('facilities.editSchedule')}
                </Link>
              ),
            },
          ]}
        />
      ) : (
        <Pending queries={[facilities]} size="section" />
      )}
      <Holidays />
    </Page>
  );
}

const HOLIDAY_FIELDS = ['date', 'gl', 'es'] as const;

function Holidays() {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const format = useFormat();
  const localized = useLocalized();
  const toast = useToast();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const holidays = useStaffQuery(['holidays'], (r, id) => r.schedules.listHolidays(id));
  const create = useStaffMutation((r, id, input: HolidayInput) =>
    r.schedules.createHoliday(id, input),
  );
  const remove = useStaffMutation((r, id, holidayId: string) =>
    r.schedules.deleteHoliday(id, holidayId),
  );
  const [date, setDate] = useState<IsoDate | null>(null);
  const [name, setName] = useState({ gl: '', es: '' });
  const [errors, setErrors] = useState<FormError[]>([]);
  const upcoming = (holidays.data ?? []).filter((h) => h.date >= today);
  const errorOf = (field: string) => errors.find((e) => e.fieldId === `holiday-${field}`)?.message;

  const add = () => {
    const found = HOLIDAY_FIELDS.filter((field) =>
      field === 'date' ? !date : !name[field].trim(),
    ).map((field) => ({ fieldId: `holiday-${field}`, message: t(`holidays.errors.${field}`) }));
    setErrors(found);
    if (found.length > 0 || !date) return;
    create.mutate(
      { date, name },
      {
        onSuccess: () => {
          toast(t('holidays.added', { date: format.longDate(date) }));
          setDate(null);
          setName({ gl: '', es: '' });
        },
        onError: (error) => {
          setErrors([
            {
              fieldId: 'holiday-date',
              message: t(
                error instanceof ConflictError ? 'holidays.errors.taken' : 'common:error.title',
              ),
            },
          ]);
        },
      },
    );
  };

  return (
    <section className={layout.section} aria-labelledby="holidays-title">
      <h2 id="holidays-title">{t('holidays.title')}</h2>
      <p>{t('holidays.intro')}</p>
      {upcoming.length > 0 && (
        <DataTable
          caption={t('holidays.caption')}
          hideCaption
          rows={upcoming}
          rowKey={(h) => h.id}
          columns={[
            {
              key: 'date',
              header: t('holidays.date'),
              isRowHeader: true,
              render: (h) => format.fullDate(h.date),
            },
            { key: 'name', header: t('holidays.name'), render: (h) => localized(h.name) },
            {
              key: 'remove',
              header: t('table.action'),
              render: (h) => (
                <Button
                  variant="quiet"
                  aria-label={t('holidays.removeLabel', { date: format.fullDate(h.date) })}
                  onPress={() => {
                    remove.mutate(h.id, {
                      onSuccess: () => {
                        toast(t('holidays.removed'));
                      },
                    });
                  }}
                >
                  {t('holidays.remove')}
                </Button>
              ),
            },
          ]}
        />
      )}
      <ErrorSummary errors={errors} />
      <form
        className={layout.panel}
        aria-labelledby="holiday-new"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          add();
        }}
      >
        <h3 id="holiday-new">{t('holidays.new')}</h3>
        <div className={layout.filters}>
          <div id="holiday-date">
            <DatePicker
              label={t('holidays.date')}
              value={date}
              minValue={today}
              onChange={setDate}
              isRequired
              errorMessage={errorOf('date')}
            />
          </div>
          {(['gl', 'es'] as const).map((language) => (
            <TextField
              key={language}
              id={`holiday-${language}`}
              label={t(`holidays.name_${language}`)}
              lang={language}
              value={name[language]}
              onChange={(value) => {
                setName({ ...name, [language]: value });
              }}
              isRequired
              errorMessage={errorOf(language)}
            />
          ))}
        </div>
        <p>
          <Button type="submit">{t('holidays.add')}</Button>
        </p>
      </form>
    </section>
  );
}
