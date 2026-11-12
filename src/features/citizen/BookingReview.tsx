// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router';
import { Page } from '../../app/Page';
import { useFacility } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import { ConflictError, RuleViolationError } from '../../data/ports/errors';
import type { ReservationInput } from '../../data/ports/repositories';
import { needsSport } from '../../domain/sports';
import type { Facility, Holder, Id } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized, useSubspaceName, useViolationText } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import { Link } from '../../ui/Link';
import { RadioGroup } from '../../ui/RadioGroup';
import layout from '../../ui/layout.module.css';
import { useBook, useCitizen, useQuote, useRecommendations } from './queries';

const ACCEPT_ID = 'accept-rules';
const SPORT_ID = 'booking-sport';

export function BookingReview() {
  const { t } = useTranslation('citizen');
  const [params] = useSearchParams();
  const { tenant, holder } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const facility = useFacility(params.get('instalacion') ?? '');

  const slot = {
    facilityId: params.get('instalacion') ?? '',
    subspaceId: params.get('espazo') ?? '',
    date: params.get('data') ?? '',
    start: params.get('inicio') ?? '',
    end: params.get('fin') ?? '',
  };
  const complete = Object.values(slot).every(Boolean);

  if (!complete || facility.isError) {
    return (
      <Page title={t('booking.title')}>
        <p>{t('booking.missing')}</p>
        <p>
          <Link href={paths.facilities()}>{t('booking.back')}</Link>
        </p>
      </Page>
    );
  }
  if (!facility.data || !holder) return null;
  return (
    <Review
      facility={facility.data}
      input={{ ...slot, holder, channel: 'web' }}
      requestedSport={params.get('deporte')}
      replaces={params.get('cambiar') ?? undefined}
    />
  );
}

function Review({
  facility,
  input: slotInput,
  requestedSport,
  replaces,
}: {
  facility: Facility;
  input: ReservationInput & { holder: Holder };
  requestedSport: string | null;
  replaces: Id | undefined;
}) {
  const { t } = useTranslation(['citizen', 'domain']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const navigate = useNavigate();
  const format = useFormat();
  const localized = useLocalized();
  const subspaceName = useSubspaceName();
  const violationText = useViolationText();
  const space = facility.subspaces.find((s) => s.id === slotInput.subspaceId);
  const choosesSport = space ? needsSport(space) : false;
  const [sport, setSport] = useState(space?.sports.find((s) => s === requestedSport));
  const input = sport ? { ...slotInput, sport } : slotInput;
  const quote = useQuote(input, replaces);
  const book = useBook();
  const recommendations = useRecommendations(facility.id, input.date);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<FormError[]>([]);

  const conflict = book.error instanceof ConflictError;
  // The sport is chosen in the form below, so a missing one is a form error, not a reason to stop.
  const violations = (
    book.error instanceof RuleViolationError
      ? book.error.violations
      : (quote.data?.violations ?? [])
  ).filter((v) => v.code !== 'sportRequired');
  const blocked = conflict || violations.length > 0;
  const backHref = paths.availability(facility.id, {
    date: input.date,
    subspaceId: input.subspaceId,
    sport,
    ...(replaces ? { replaces } : {}),
  });

  const submit = () => {
    if (book.isPending) return;
    const found: FormError[] = [
      ...(choosesSport && !sport ? [{ fieldId: SPORT_ID, message: t('booking.sportError') }] : []),
      ...(!accepted ? [{ fieldId: ACCEPT_ID, message: t('booking.acceptError') }] : []),
    ];
    setErrors(found);
    if (found.length > 0) return;
    book.mutate(
      { input, replaces },
      {
        onSuccess: (reservation) => {
          void navigate(paths.reservation(reservation.id, replaces ? 'cambiada' : 'nova'));
        },
      },
    );
  };

  const price = quote.data?.price;

  return (
    <Page title={replaces ? t('booking.changeTitle') : t('booking.title')}>
      <ErrorSummary errors={errors} />

      {blocked && (
        <section className={layout.notice} data-tone="danger" aria-labelledby="not-possible">
          <h2 id="not-possible">{t('booking.notPossible')}</h2>
          <ul>
            {conflict && <li>{t('booking.taken')}</li>}
            {violations.map((violation) => (
              <li key={violation.code}>{violationText(violation)}</li>
            ))}
          </ul>
          {(recommendations.data ?? []).length > 0 && (
            <>
              <p>{t('booking.alternatives')}</p>
              <ul>
                {(recommendations.data ?? []).map((r) => (
                  <li key={r.start}>{format.timeRange(r.start, r.end)}</li>
                ))}
              </ul>
            </>
          )}
          <p>
            <Link href={backHref} variant="secondary">
              {t('booking.back')}
            </Link>
          </p>
        </section>
      )}

      <section className={layout.panel} aria-labelledby="booking-summary">
        <h2 id="booking-summary">{t('booking.summary')}</h2>
        <dl className={layout.details}>
          <dt>{t('booking.facility')}</dt>
          <dd>{facility.name}</dd>
          <dt>{t('booking.space')}</dt>
          <dd>{subspaceName(facility, input.subspaceId)}</dd>
          {sport && (
            <>
              <dt>{t('booking.sport')}</dt>
              <dd>{t(`domain:sport.${sport}`)}</dd>
            </>
          )}
          <dt>{t('booking.date')}</dt>
          <dd>{format.longDate(input.date)}</dd>
          <dt>{t('booking.time')}</dt>
          <dd>{format.timeRange(input.start, input.end)}</dd>
          {price && (
            <>
              <dt>{t('booking.price')}</dt>
              <dd>
                {price.totalCents === 0 ? t('domain:payment.free') : format.price(price.totalCents)}
              </dd>
              <dt>{t('booking.tariff')}</dt>
              <dd>
                {t(`domain:tariff.${price.tariff}`)}
                {price.concession && (
                  <>
                    <br />
                    {t('booking.discount', {
                      name: t(`domain:concession.${price.concession}`),
                      percent: format.percent(price.discountPercent / 100),
                    })}
                  </>
                )}
              </dd>
            </>
          )}
          <dt>{t('booking.payment')}</dt>
          <dd>{t('booking.paymentNote')}</dd>
        </dl>
      </section>

      {!blocked && (
        <form
          className={layout.section}
          aria-labelledby="booking-rules"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          {choosesSport && space && (
            <RadioGroup
              id={SPORT_ID}
              label={t('booking.sport')}
              description={t('booking.sportHelp')}
              value={sport ?? null}
              isRequired
              errorMessage={errors.find((e) => e.fieldId === SPORT_ID)?.message}
              onChange={(value) => {
                setSport(space.sports.find((s) => s === value));
              }}
              options={space.sports.map((s) => ({ id: s, label: t(`domain:sport.${s}`) }))}
            />
          )}
          <h2 id="booking-rules">{t('booking.rulesTitle')}</h2>
          <p>{localized(facility.usageRules)}</p>
          <Checkbox
            id={ACCEPT_ID}
            isSelected={accepted}
            isInvalid={errors.some((e) => e.fieldId === ACCEPT_ID)}
            onChange={setAccepted}
          >
            {t('booking.accept')}
          </Checkbox>
          {errors.some((e) => e.fieldId === ACCEPT_ID) && (
            <p className={layout.meta} data-tone="danger">
              {t('booking.acceptError')}
            </p>
          )}
          <div className={layout.row}>
            <Button type="submit" variant="primary">
              {book.isPending
                ? t('booking.saving')
                : replaces
                  ? t('booking.confirmChange')
                  : t('booking.confirm')}
            </Button>
            <Link href={backHref}>{t('booking.back')}</Link>
          </div>
        </form>
      )}
    </Page>
  );
}
