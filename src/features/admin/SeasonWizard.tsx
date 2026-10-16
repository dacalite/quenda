// SPDX-License-Identifier: EUPL-1.2
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities, useSchedule } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import type { RecurringBookingInput } from '../../data/ports/repositories';
import { expandRecurring, type RecurringConflict } from '../../domain/rules/recurring';
import { fromMinutes, toMinutes, zonedNow } from '../../domain/time';
import type { Facility, IsoDate, Weekday } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized, useWeekdayName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { DatePicker } from '../../ui/DatePicker';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { RadioGroup } from '../../ui/RadioGroup';
import { Select } from '../../ui/Select';
import { useToast } from '../../ui/toasts';
import { useStaff, useStaffMutation, useStaffQuery } from './queries';

const STEPS = ['entity', 'place', 'time', 'season', 'review'] as const;
type Step = (typeof STEPS)[number];
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

/** Sports seasons in Galicia run from September to June. */
const seasonEnd = (today: IsoDate) => {
  const year = Number(today.slice(0, 4));
  return `${String(Number(today.slice(5, 7)) >= 7 ? year + 1 : year)}-06-30`;
};

export function SeasonWizard() {
  const { t } = useTranslation(['admin', 'common']);
  const facilities = useFacilities();
  const entities = useStaffQuery(['entities'], (r, id) => r.entities.list(id));
  if (!facilities.data || !entities.data) {
    return (
      <Page title={t('wizard.title')}>
        <Pending queries={[facilities, entities]} />
      </Page>
    );
  }
  return (
    <Wizard
      facilities={facilities.data.filter((f) => f.status === 'active')}
      entities={entities.data}
    />
  );
}

function Wizard({
  facilities,
  entities,
}: {
  facilities: Facility[];
  entities: { id: string; name: string }[];
}) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const weekdayName = useWeekdayName();
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const navigate = useNavigate();
  const toast = useToast();
  const format = useFormat();
  const localized = useLocalized();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  const [step, setStep] = useState<Step>('entity');
  const [entityId, setEntityId] = useState<string | null>(null);
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '');
  const facility = facilities.find((f) => f.id === facilityId);
  const [subspaceId, setSubspaceId] = useState(facility?.subspaces[0]?.id ?? '');
  const [weekday, setWeekday] = useState<Weekday>(1);
  const [start, setStart] = useState<string | null>(null);
  const [slots, setSlots] = useState(1);
  const [from, setFrom] = useState<IsoDate | null>(today);
  const [to, setTo] = useState<IsoDate | null>(seasonEnd(today));
  const [errors, setErrors] = useState<FormError[]>([]);
  const [conflicts, setConflicts] = useState<RecurringConflict[] | null>(null);

  const schedule = useSchedule(facilityId);
  const slotMinutes = schedule.data?.slotMinutes ?? 60;
  const starts = (schedule.data?.weekly[weekday] ?? []).flatMap((range) => {
    const times: string[] = [];
    for (
      let m = toMinutes(range.start);
      m + slotMinutes <= toMinutes(range.end);
      m += slotMinutes
    ) {
      times.push(fromMinutes(m));
    }
    return times;
  });
  const end = start ? fromMinutes(toMinutes(start) + slots * slotMinutes) : null;

  const input: RecurringBookingInput | null =
    entityId && start && end && from && to
      ? {
          entityId,
          facilityId,
          subspaceId,
          weekday,
          times: { start, end },
          season: { from, to },
          exceptions: [],
        }
      : null;

  const preview = useStaffMutation((r, id, booking: RecurringBookingInput) =>
    r.recurringBookings.preview(id, booking),
  );
  const create = useStaffMutation((r, id, booking: RecurringBookingInput) =>
    r.recurringBookings.create(id, booking),
  );

  useEffect(() => {
    // Moving between steps keeps the page, so focus goes to the new step's heading.
    if (moved.current) heading.current?.focus();
    moved.current = false;
  }, [step]);

  const problems = (current: Step): FormError[] => {
    switch (current) {
      case 'entity':
        return entityId ? [] : [{ fieldId: 'wizard-entity', message: t('wizard.errors.entity') }];
      case 'time':
        return start ? [] : [{ fieldId: 'wizard-start', message: t('wizard.errors.start') }];
      case 'season':
        return [
          ...(from ? [] : [{ fieldId: 'wizard-from', message: t('wizard.errors.from') }]),
          ...(to && from && to >= from && to >= today
            ? []
            : [{ fieldId: 'wizard-to', message: t('wizard.errors.to') }]),
        ];
      default:
        return [];
    }
  };

  const go = (next: Step) => {
    const forward = STEPS.indexOf(next) > STEPS.indexOf(step);
    const found = forward ? problems(step) : [];
    setErrors(found);
    if (found.length > 0) return;
    if (next === 'review' && input) {
      setConflicts(null);
      preview.mutate(input, { onSuccess: setConflicts });
    }
    moved.current = true;
    setStep(next);
  };

  const index = STEPS.indexOf(step);
  const total = input
    ? expandRecurring(input, { from: from && from > today ? from : today, to: input.season.to })
        .length
    : 0;
  const errorOf = (id: string) => errors.find((e) => e.fieldId === id)?.message;

  return (
    <Page title={t('wizard.title')}>
      <ErrorSummary errors={errors} />
      <section className={layout.section} aria-labelledby="wizard-step">
        <h2 id="wizard-step" ref={heading} tabIndex={-1}>
          {t('wizard.stepOf', {
            n: index + 1,
            total: STEPS.length,
            title: t(`wizard.steps.${step}`),
          })}
        </h2>

        {step === 'entity' && (
          <RadioGroup
            id="wizard-entity"
            label={t('wizard.entity')}
            value={entityId}
            onChange={setEntityId}
            errorMessage={errorOf('wizard-entity')}
            options={entities.map((e) => ({ id: e.id, label: e.name }))}
          />
        )}

        {step === 'place' && (
          <div className={layout.filters}>
            <Select
              label={t('wizard.facility')}
              value={facilityId}
              onChange={(value) => {
                setFacilityId(value);
                setSubspaceId(facilities.find((f) => f.id === value)?.subspaces[0]?.id ?? '');
                setStart(null);
              }}
              options={facilities.map((f) => ({ id: f.id, label: f.name }))}
            />
            {facility && facility.subspaces.length > 1 && (
              <Select
                label={t('wizard.space')}
                value={subspaceId}
                onChange={setSubspaceId}
                options={facility.subspaces.map((s) => ({ id: s.id, label: localized(s.name) }))}
              />
            )}
          </div>
        )}

        {step === 'time' && (
          <div className={layout.filters}>
            <Select
              label={t('wizard.weekday')}
              value={String(weekday)}
              onChange={(value) => {
                setWeekday(Number(value) as Weekday);
                setStart(null);
              }}
              options={WEEKDAYS.map((d) => ({ id: String(d), label: weekdayName(d) }))}
            />
            {starts.length === 0 ? (
              <p id="wizard-start" tabIndex={-1}>
                {t('wizard.closedDay')}
              </p>
            ) : (
              <Select
                id="wizard-start"
                label={t('wizard.start')}
                value={start}
                onChange={setStart}
                errorMessage={errorOf('wizard-start')}
                options={starts.map((s) => ({ id: s, label: s }))}
              />
            )}
            <Select
              label={t('wizard.duration')}
              value={String(slots)}
              onChange={(value) => {
                setSlots(Number(value));
              }}
              options={[1, 2, 3].map((n) => ({
                id: String(n),
                label: t('schedule.minutes', { count: n * slotMinutes }),
              }))}
            />
          </div>
        )}

        {step === 'season' && (
          <div className={layout.filters}>
            <div id="wizard-from">
              <DatePicker
                label={t('wizard.from')}
                value={from}
                onChange={setFrom}
                isRequired
                errorMessage={errorOf('wizard-from')}
              />
            </div>
            <div id="wizard-to">
              <DatePicker
                label={t('wizard.to')}
                value={to}
                minValue={from ?? today}
                onChange={setTo}
                isRequired
                errorMessage={errorOf('wizard-to')}
              />
            </div>
          </div>
        )}

        {step === 'review' && input && (
          <div aria-live="polite" className={layout.section}>
            <p>
              {t('wizard.summary', {
                entity: entities.find((e) => e.id === entityId)?.name ?? '',
                facility: facility?.name ?? '',
                day: weekdayName(weekday),
                time: format.timeRange(input.times.start, input.times.end),
                from: format.fullDate(input.season.from),
                to: format.fullDate(input.season.to),
              })}
            </p>
            {conflicts === null ? (
              <p aria-busy="true">{t('wizard.checking')}</p>
            ) : (
              <>
                <p>
                  {t('wizard.dates', { count: total - conflicts.length })}{' '}
                  {conflicts.length > 0 && t('wizard.conflicts', { count: conflicts.length })}
                </p>
                {conflicts.length > 0 && (
                  <>
                    <DataTable
                      caption={t('wizard.conflictsCaption')}
                      rows={conflicts}
                      rowKey={(c) => c.date}
                      columns={[
                        {
                          key: 'date',
                          header: t('wizard.date'),
                          isRowHeader: true,
                          render: (c) => format.fullDate(c.date),
                        },
                        {
                          key: 'problem',
                          header: t('wizard.problem'),
                          render: (c) => t(`wizard.problemValue.${c.problem}`),
                        },
                      ]}
                    />
                    <p>{t('wizard.resolve')}</p>
                  </>
                )}
                <div className={layout.row}>
                  <Button
                    variant="primary"
                    onPress={() => {
                      create.mutate(
                        { ...input, exceptions: conflicts.map((c) => c.date) },
                        {
                          onSuccess: () => {
                            toast(t('wizard.created', { count: total - conflicts.length }));
                            void navigate(paths.seasons);
                          },
                          onError: () => {
                            toast(t('common:error.title'), 'danger');
                          },
                        },
                      );
                    }}
                  >
                    {conflicts.length > 0 ? t('wizard.createSkipping') : t('wizard.create')}
                  </Button>
                  {conflicts.length > 0 && (
                    <Button
                      onPress={() => {
                        go('time');
                      }}
                    >
                      {t('wizard.changeTime')}
                    </Button>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <div className={layout.row}>
          {index > 0 && (
            <Button
              onPress={() => {
                go(STEPS[index - 1] ?? 'entity');
              }}
            >
              {t('wizard.back')}
            </Button>
          )}
          {index < STEPS.length - 1 && (
            <Button
              variant="primary"
              onPress={() => {
                go(STEPS[index + 1] ?? 'review');
              }}
            >
              {t('wizard.next')}
            </Button>
          )}
        </div>
      </section>
    </Page>
  );
}
