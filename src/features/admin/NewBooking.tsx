// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Page } from '../../app/Page';
import { useAvailability, useFacilities } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { ConflictError, RuleViolationError } from '../../data/ports/errors';
import type { ReservationInput } from '../../data/ports/repositories';
import { zonedNow } from '../../domain/time';
import type { Channel, Facility, IsoDate, User } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized, useViolationText } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DatePicker } from '../../ui/DatePicker';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { RadioGroup } from '../../ui/RadioGroup';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { PERSON_FIELD_ID, PersonPicker } from './PersonPicker';
import { useStaff, useStaffMutation, useStaffQuery } from './queries';

const SLOT_FIELD_ID = 'booking-slot';
const CONFIRM_FIELD_ID = 'booking-confirm';
type Confirmation = 'none' | 'sms' | 'email';

export function NewBooking() {
  const { t } = useTranslation(['admin', 'common']);
  const facilities = useFacilities();
  if (!facilities.data) {
    return (
      <Page title={t('newBooking.title')}>
        <p aria-busy="true">{t('common:loading')}</p>
      </Page>
    );
  }
  return <NewBookingForm facilities={facilities.data.filter((f) => f.status === 'active')} />;
}

function NewBookingForm({ facilities }: { facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const navigate = useNavigate();
  const toast = useToast();
  const format = useFormat();
  const localized = useLocalized();
  const violationText = useViolationText();
  const [params] = useSearchParams();
  const today = zonedNow(new Date(), tenant.timeZone).date;

  const initialFacility =
    facilities.find((f) => f.id === params.get('instalacion')) ?? facilities[0];
  const [person, setPerson] = useState<User | null>(null);
  const [facilityId, setFacilityId] = useState(initialFacility?.id ?? '');
  const facility = facilities.find((f) => f.id === facilityId);
  const [subspaceId, setSubspaceId] = useState(
    facility?.subspaces.find((s) => s.id === params.get('espazo'))?.id ??
      facility?.subspaces[0]?.id ??
      '',
  );
  const requestedDate = params.get('data');
  const [date, setDate] = useState<IsoDate>(
    requestedDate && requestedDate >= today ? requestedDate : today,
  );
  const [start, setStart] = useState<string | null>(params.get('inicio'));
  const [channel, setChannel] = useState<Channel>('phone');
  const [confirmation, setConfirmation] = useState<Confirmation>('sms');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<FormError[]>([]);

  const availability = useAvailability(facilityId, date);
  const free = (availability.data ?? []).filter(
    (s) => s.subspaceId === subspaceId && s.status === 'free',
  );
  const slot = free.find((s) => s.start === start);

  const input: ReservationInput | null =
    person && slot
      ? {
          facilityId,
          subspaceId,
          date,
          start: slot.start,
          end: slot.end,
          holder: { kind: 'user', userId: person.id },
          channel,
          notes,
          ...(confirmation === 'none' ? {} : { confirmBy: confirmation }),
        }
      : null;
  const quote = useStaffQuery(
    ['quote', input],
    input ? (r, id) => r.reservations.quote(id, input) : null,
  );
  const book = useStaffMutation((r, id, booking: ReservationInput) =>
    r.reservations.create(id, booking),
  );

  const errorOf = (fieldId: string) => errors.find((e) => e.fieldId === fieldId)?.message;

  const submit = () => {
    const found: FormError[] = [
      ...(person ? [] : [{ fieldId: PERSON_FIELD_ID, message: t('newBooking.errors.person') }]),
      ...(slot ? [] : [{ fieldId: SLOT_FIELD_ID, message: t('newBooking.errors.slot') }]),
      ...(confirmation === 'email' && person && !person.email
        ? [{ fieldId: CONFIRM_FIELD_ID, message: t('newBooking.errors.noEmail') }]
        : []),
      ...(confirmation === 'sms' && person && !person.phone
        ? [{ fieldId: CONFIRM_FIELD_ID, message: t('newBooking.errors.noPhone') }]
        : []),
    ];
    setErrors(found);
    if (found.length > 0 || !input) return;
    book.mutate(input, {
      onSuccess: (reservation) => {
        toast(
          t(`newBooking.done.${confirmation}`, {
            code: reservation.code,
            person: person?.firstName ?? '',
          }),
        );
        void navigate(paths.reservation(reservation.id));
      },
      onError: (error) => {
        if (error instanceof ConflictError) {
          setStart(null);
          setErrors([{ fieldId: SLOT_FIELD_ID, message: t('newBooking.errors.taken') }]);
        } else if (!(error instanceof RuleViolationError)) {
          toast(t('common:error.title'), 'danger');
        }
      },
    });
  };

  return (
    <Page title={t('newBooking.title')}>
      <p>{t('newBooking.intro')}</p>
      <ErrorSummary errors={errors} />
      <form
        className={layout.section}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <section className={layout.section} aria-labelledby="booking-person-title">
          <h2 id="booking-person-title">{t('newBooking.person')}</h2>
          <PersonPicker
            value={person}
            onChange={setPerson}
            errorMessage={errorOf(PERSON_FIELD_ID)}
          />
        </section>

        <section className={layout.section} aria-labelledby="booking-slot-title">
          <h2 id="booking-slot-title">{t('newBooking.slot')}</h2>
          <div className={layout.filters}>
            <Select
              label={t('newBooking.facility')}
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
                label={t('newBooking.space')}
                value={subspaceId}
                onChange={(value) => {
                  setSubspaceId(value);
                  setStart(null);
                }}
                options={facility.subspaces.map((s) => ({ id: s.id, label: localized(s.name) }))}
              />
            )}
            <DatePicker
              label={t('newBooking.date')}
              value={date}
              minValue={today}
              onChange={(value) => {
                if (value) setDate(value);
                setStart(null);
              }}
            />
          </div>
          {availability.isPending ? (
            <p aria-busy="true">{t('common:loading')}</p>
          ) : free.length === 0 ? (
            <p id={SLOT_FIELD_ID} tabIndex={-1}>
              {t('newBooking.noFree')}
            </p>
          ) : (
            <Select
              id={SLOT_FIELD_ID}
              label={t('newBooking.time')}
              placeholder={t('newBooking.timePlaceholder')}
              value={slot ? slot.start : null}
              onChange={setStart}
              errorMessage={errorOf(SLOT_FIELD_ID)}
              options={free.map((s) => ({ id: s.start, label: format.timeRange(s.start, s.end) }))}
            />
          )}
        </section>

        <section className={layout.section} aria-labelledby="booking-channel-title">
          <h2 id="booking-channel-title">{t('newBooking.channelTitle')}</h2>
          <RadioGroup
            label={t('newBooking.channel')}
            value={channel}
            onChange={(value) => {
              setChannel(value as Channel);
            }}
            options={(['phone', 'inPerson'] as const).map((c) => ({
              id: c,
              label: t(`domain:channel.${c}`),
            }))}
          />
          <RadioGroup
            id={CONFIRM_FIELD_ID}
            label={t('newBooking.confirmation')}
            description={t('newBooking.confirmationHelp')}
            value={confirmation}
            onChange={(value) => {
              setConfirmation(value as Confirmation);
            }}
            errorMessage={errorOf(CONFIRM_FIELD_ID)}
            options={(['sms', 'email', 'none'] as const).map((c) => ({
              id: c,
              label: t(`newBooking.confirmBy.${c}`),
            }))}
          />
          <TextField
            label={t('newBooking.notes')}
            description={t('newBooking.notesHelp')}
            value={notes}
            onChange={setNotes}
            multiline
          />
        </section>

        {input && quote.data && (
          <section
            className={layout.panel}
            aria-labelledby="booking-summary-title"
            aria-live="polite"
          >
            <h2 id="booking-summary-title">{t('newBooking.summary')}</h2>
            <p>
              {t('newBooking.price', {
                price: format.price(quote.data.price.totalCents),
                tariff: t(`domain:tariff.${quote.data.price.tariff}`),
              })}
            </p>
            {quote.data.violations.length > 0 && (
              <div className={layout.notice} data-tone="danger">
                <p>{t('newBooking.blocked')}</p>
                <ul>
                  {quote.data.violations.map((v) => (
                    <li key={v.code}>{violationText(v)}</li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <p>
          <Button
            type="submit"
            variant="primary"
            isDisabled={Boolean(quote.data && quote.data.violations.length > 0)}
          >
            {t('newBooking.submit')}
          </Button>
        </p>
      </form>
    </Page>
  );
}
