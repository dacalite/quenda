// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router';
import { NotFoundPage } from '../../app/pages';
import { Page } from '../../app/Page';
import { useFacility, useSchedule } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { ValidationError } from '../../data/ports/errors';
import { zonedNow } from '../../domain/time';
import type {
  Facility,
  IsoDate,
  Schedule,
  ScheduleException,
  SlotMinutes,
  TimeRange,
  Weekday,
} from '../../domain/types';
import { validateSchedule } from '../../domain/validation';
import { useFormat } from '../../i18n/format';
import { useWeekdayName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { DatePicker } from '../../ui/DatePicker';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { TimeField } from '../../ui/TimeField';
import { useToast } from '../../ui/toasts';
import { fieldId, useProblemMessages } from './problems';
import { useStaff, useStaffMutation } from './queries';

const FORM = 'schedule';
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];
const SLOT_LENGTHS: SlotMinutes[] = [30, 60, 90];

export function ScheduleEditor() {
  const { facilityId = '' } = useParams();
  const facility = useFacility(facilityId);
  const schedule = useSchedule(facilityId);
  if (facility.isError || schedule.isError) return <NotFoundPage />;
  if (!facility.data || !schedule.data) return null;
  return <Editor facility={facility.data} initial={schedule.data} />;
}

function Editor({ facility, initial }: { facility: Facility; initial: Schedule }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const weekdayName = useWeekdayName();
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const toast = useToast();
  const [schedule, setSchedule] = useState(initial);
  const [errors, setErrors] = useState<FormError[]>([]);
  const save = useStaffMutation((r, id, next: Schedule) => r.schedules.save(id, next));

  const label = (path: string) => {
    const [area, key, index] = path.split('.');
    if (area === 'weekly') {
      const day = weekdayName(Number(key) as Weekday);
      return index === undefined ? day : t('schedule.rangeOf', { day, n: Number(index) + 1 });
    }
    return t('schedule.exceptionN', { n: Number(key) + 1 });
  };
  const messages = useProblemMessages(FORM, label);
  const errorOf = (path: string) => errors.find((e) => e.fieldId === fieldId(FORM, path))?.message;

  const setDay = (day: Weekday, ranges: TimeRange[]) => {
    setSchedule({ ...schedule, weekly: { ...schedule.weekly, [day]: ranges } });
  };

  const submit = () => {
    const found = messages(validateSchedule(schedule));
    setErrors(found);
    if (found.length > 0) return;
    save.mutate(schedule, {
      onSuccess: () => {
        toast(t('schedule.saved'));
      },
      onError: (error) => {
        if (error instanceof ValidationError) setErrors(messages(error.problems));
        else toast(t('common:error.title'), 'danger');
      },
    });
  };

  return (
    <Page title={t('schedule.title', { name: facility.name })}>
      <p>
        <Link href={paths.facility(facility.id)}>{t('schedule.backToFacility')}</Link>
      </p>
      <ErrorSummary errors={errors} />
      <form
        className={layout.section}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <Select
          label={t('schedule.slotMinutes')}
          description={t('schedule.slotMinutesHelp')}
          value={String(schedule.slotMinutes)}
          onChange={(value) => {
            setSchedule({ ...schedule, slotMinutes: Number(value) as SlotMinutes });
          }}
          options={SLOT_LENGTHS.map((m) => ({
            id: String(m),
            label: t('schedule.minutes', { count: m }),
          }))}
        />

        <section className={layout.section} aria-labelledby="schedule-weekly">
          <h2 id="schedule-weekly">{t('schedule.weekly')}</h2>
          {WEEKDAYS.map((day) => (
            <RangesFieldset
              key={day}
              id={fieldId(FORM, `weekly.${String(day)}`)}
              legend={weekdayName(day)}
              ranges={schedule.weekly[day]}
              onChange={(ranges) => {
                setDay(day, ranges);
              }}
              errorOf={(i) =>
                errorOf(
                  i === undefined ? `weekly.${String(day)}` : `weekly.${String(day)}.${String(i)}`,
                )
              }
            />
          ))}
        </section>

        <Exceptions
          exceptions={schedule.exceptions}
          onChange={(exceptions) => {
            setSchedule({ ...schedule, exceptions });
          }}
          errorOf={errorOf}
        />

        <p>
          <Button type="submit" variant="primary">
            {t('schedule.save')}
          </Button>
        </p>
      </form>
    </Page>
  );
}

/** Opening ranges of one day; no ranges means closed. */
function RangesFieldset({
  id,
  legend,
  ranges,
  onChange,
  errorOf,
}: {
  id: string;
  legend: string;
  ranges: TimeRange[];
  onChange: (ranges: TimeRange[]) => void;
  errorOf: (index?: number) => string | undefined;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const dayError = errorOf();
  return (
    <fieldset className={layout.panel} id={id}>
      <legend>{legend}</legend>
      {ranges.length === 0 && <p>{t('schedule.closed')}</p>}
      {dayError && (
        <p className={layout.notice} data-tone="danger">
          {dayError}
        </p>
      )}
      {ranges.map((range, i) => (
        <div key={i} className={layout.row} id={`${id}-${String(i)}`}>
          <TimeField
            label={t('schedule.opens', { n: i + 1 })}
            value={range.start}
            onChange={(start) => {
              onChange(ranges.map((r, j) => (j === i ? { ...r, start: start ?? r.start } : r)));
            }}
            errorMessage={errorOf(i)}
          />
          <TimeField
            label={t('schedule.closes', { n: i + 1 })}
            value={range.end}
            onChange={(end) => {
              onChange(ranges.map((r, j) => (j === i ? { ...r, end: end ?? r.end } : r)));
            }}
          />
          <Button
            variant="quiet"
            aria-label={t('schedule.removeRangeOf', { day: legend, n: i + 1 })}
            onPress={() => {
              onChange(ranges.filter((_, j) => j !== i));
            }}
          >
            {t('schedule.removeRange')}
          </Button>
        </div>
      ))}
      <p>
        <Button
          aria-label={t('schedule.addRangeTo', { day: legend })}
          onPress={() => {
            const last = ranges.at(-1);
            onChange([
              ...ranges,
              last ? { start: last.end, end: last.end } : { start: '09:00', end: '14:00' },
            ]);
          }}
        >
          {t('schedule.addRange')}
        </Button>
      </p>
    </fieldset>
  );
}

function Exceptions({
  exceptions,
  onChange,
  errorOf,
}: {
  exceptions: ScheduleException[];
  onChange: (exceptions: ScheduleException[]) => void;
  errorOf: (path: string) => string | undefined;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant } = useStaff();
  const format = useFormat();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const [date, setDate] = useState<IsoDate | null>(null);
  const [closed, setClosed] = useState(true);
  const [range, setRange] = useState<TimeRange>({ start: '10:00', end: '14:00' });
  const [reason, setReason] = useState('');

  const replace = (i: number, change: Partial<ScheduleException>) => {
    onChange(exceptions.map((e, j) => (j === i ? { ...e, ...change } : e)));
  };

  return (
    <section className={layout.section} aria-labelledby="schedule-exceptions">
      <h2 id="schedule-exceptions">{t('schedule.exceptions')}</h2>
      <p>{t('schedule.exceptionsHelp')}</p>
      {exceptions.length > 0 && (
        <ul className={layout.stack}>
          {exceptions.map((exception, i) => (
            <li key={exception.date} className={layout.panel}>
              <p>
                <strong>{format.fullDate(exception.date)}</strong>
                {': '}
                {exception.ranges.length === 0
                  ? t('schedule.closedAllDay')
                  : exception.ranges.map((r) => format.timeRange(r.start, r.end)).join(', ')}
              </p>
              <TextField
                id={fieldId(FORM, `exceptions.${String(i)}.reason`)}
                label={t('schedule.reason')}
                value={exception.reason}
                onChange={(value) => {
                  replace(i, { reason: value });
                }}
                isRequired
                errorMessage={errorOf(`exceptions.${String(i)}.reason`)}
              />
              <p>
                <Button
                  variant="quiet"
                  aria-label={t('schedule.removeExceptionOf', {
                    date: format.fullDate(exception.date),
                  })}
                  onPress={() => {
                    onChange(exceptions.filter((_, j) => j !== i));
                  }}
                >
                  {t('schedule.removeException')}
                </Button>
              </p>
            </li>
          ))}
        </ul>
      )}
      <fieldset className={layout.panel}>
        <legend>{t('schedule.newException')}</legend>
        <div className={layout.filters}>
          <DatePicker label={t('schedule.date')} value={date} minValue={today} onChange={setDate} />
          <TextField label={t('schedule.reason')} value={reason} onChange={setReason} />
        </div>
        <Checkbox isSelected={closed} onChange={setClosed}>
          {t('schedule.closedAllDay')}
        </Checkbox>
        {!closed && (
          <div className={layout.row}>
            <TimeField
              label={t('schedule.opens', { n: 1 })}
              value={range.start}
              onChange={(start) => {
                setRange({ ...range, start: start ?? range.start });
              }}
            />
            <TimeField
              label={t('schedule.closes', { n: 1 })}
              value={range.end}
              onChange={(end) => {
                setRange({ ...range, end: end ?? range.end });
              }}
            />
          </div>
        )}
        <p>
          <Button
            isDisabled={!date || exceptions.some((e) => e.date === date)}
            onPress={() => {
              if (!date) return;
              onChange(
                [...exceptions, { date, ranges: closed ? [] : [range], reason }].sort((a, b) =>
                  a.date.localeCompare(b.date),
                ),
              );
              setDate(null);
              setReason('');
            }}
          >
            {t('schedule.addException')}
          </Button>
        </p>
        <p className={layout.meta}>{t('schedule.addExceptionHelp')}</p>
      </fieldset>
    </section>
  );
}
