// SPDX-License-Identifier: EUPL-1.2
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { Page } from '../../app/Page';
import { deputacionPaths } from '../../app/routes/paths';
import { ValidationError } from '../../data/ports/errors';
import { suggestSlug, validateNewCouncil, type NewCouncil as Draft } from '../../domain/councils';
import type { FacilityType } from '../../domain/types';
import type { FieldProblem } from '../../domain/validation';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { BrandFields, LanguagesField } from '../admin/BrandFields';
import { fieldId, useProblemMessages } from '../admin/problems';
import { useDeputacionMutation, useDeputacionQuery } from './queries';

const FORM = 'new-council';
const STEPS = ['details', 'image', 'facilities'] as const;
const STEP_FIELDS: Record<(typeof STEPS)[number], string[]> = {
  details: ['name', 'slug', 'languages'],
  image: ['primaryColor'],
  facilities: ['facilityTypes', 'address'],
};
const FACILITY_TYPES: FacilityType[] = [
  'sportsHall',
  'paddleCourt',
  'tennisCourt',
  'footballPitch',
  'swimmingPool',
  'multipurposeRoom',
  'gym',
];

const BLANK: Draft = {
  name: '',
  slug: '',
  languages: ['gl', 'es'],
  emblem: 'tower',
  primaryColor: '#005f73',
  facilityTypes: ['sportsHall', 'paddleCourt', 'multipurposeRoom'],
  address: '',
};

const stepOf = (problem: FieldProblem) =>
  Math.max(
    0,
    STEPS.findIndex((step) => STEP_FIELDS[step].includes(problem.field)),
  );

export function NewCouncil() {
  const { t } = useTranslation(['deputacion', 'admin', 'domain', 'common']);
  const navigate = useNavigate();
  const toast = useToast();
  const councils = useDeputacionQuery(['councils'], (r, id) => r.deputacions.listCouncils(id));
  const create = useDeputacionMutation((r, id, input: Draft) =>
    r.deputacions.createCouncil(id, input),
  );
  const [draft, setDraft] = useState(BLANK);
  const [slugEdited, setSlugEdited] = useState(false);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<FormError[]>([]);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);

  useEffect(() => {
    if (moved.current) heading.current?.focus();
    moved.current = false;
  }, [step]);

  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
  };

  const labels: Record<string, string> = {
    name: t('wizard.name'),
    slug: t('wizard.slug'),
    languages: t('admin:settings.languages'),
    primaryColor: t('admin:settings.color'),
    facilityTypes: t('wizard.facilityTypes'),
    address: t('wizard.address'),
  };
  const problemMessages = useProblemMessages(FORM, (path) => labels[path] ?? path);
  const messages = (problems: FieldProblem[]) =>
    problemMessages(problems).map((error, i) =>
      problems[i]?.field === 'slug' && problems[i].code === 'format'
        ? { ...error, message: t('wizard.slugFormat') }
        : error,
    );
  const errorOf = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const field = (path: string) => {
    const id = fieldId(FORM, path);
    return { id, errorMessage: errorOf(id) };
  };

  const current = STEPS[step] ?? 'details';
  const isLast = step === STEPS.length - 1;
  const goTo = (index: number) => {
    moved.current = true;
    setErrors([]);
    setStep(index);
  };

  const submit = () => {
    const taken = (councils.data ?? []).map((c) => c.slug);
    const found = validateNewCouncil(draft, taken).filter((p) =>
      STEP_FIELDS[current].includes(p.field),
    );
    setErrors(messages(found));
    if (found.length > 0) return;
    if (!isLast) {
      goTo(step + 1);
      return;
    }
    create.mutate(draft, {
      onSuccess: (tenant) => {
        void navigate(deputacionPaths.created(tenant.slug));
      },
      onError: (error) => {
        if (error instanceof ValidationError) {
          setStep(Math.min(...error.problems.map(stepOf)));
          setErrors(messages(error.problems));
        } else {
          toast(t('common:error.title'), 'danger');
        }
      },
    });
  };

  return (
    <Page title={t('wizard.title')}>
      <p>{t('wizard.intro')}</p>
      <ol className={layout.row}>
        {STEPS.map((name, index) => (
          <li key={name} aria-current={index === step ? 'step' : undefined}>
            {index === step ? (
              <strong>
                {t('wizard.stepItem', { number: index + 1, name: t(`wizard.steps.${name}`) })}
              </strong>
            ) : (
              t('wizard.stepItem', { number: index + 1, name: t(`wizard.steps.${name}`) })
            )}
          </li>
        ))}
      </ol>
      <ErrorSummary errors={errors} />
      <form
        className={layout.section}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 ref={heading} tabIndex={-1}>
          {t('wizard.progress', {
            current: step + 1,
            total: STEPS.length,
            name: t(`wizard.steps.${current}`),
          })}
        </h2>

        {current === 'details' && (
          <>
            <TextField
              {...field('name')}
              label={t('wizard.name')}
              description={t('wizard.nameHelp')}
              value={draft.name}
              onChange={(name) => {
                update({ name, ...(slugEdited ? {} : { slug: suggestSlug(name) }) });
              }}
              autoComplete="off"
              isRequired
            />
            <TextField
              {...field('slug')}
              label={t('wizard.slug')}
              description={t('wizard.slugHelp', { slug: draft.slug || 'vilarmoura' })}
              value={draft.slug}
              onChange={(slug) => {
                setSlugEdited(true);
                update({ slug: slug.trim() });
              }}
              autoComplete="off"
              spellCheck="false"
              isRequired
            />
            <LanguagesField
              {...field('languages')}
              value={draft.languages}
              onChange={(languages) => {
                update({ languages });
              }}
            />
          </>
        )}

        {current === 'image' && (
          <BrandFields
            emblem={draft.emblem}
            primaryColor={draft.primaryColor}
            colorField={field('primaryColor')}
            onChange={update}
          />
        )}

        {current === 'facilities' && (
          <>
            <fieldset className={layout.section} id={fieldId(FORM, 'facilityTypes')}>
              <legend>{t('wizard.facilityTypes')}</legend>
              <p className={layout.meta}>{t('wizard.facilityTypesHelp')}</p>
              {errorOf(fieldId(FORM, 'facilityTypes')) && (
                <p className={layout.notice} data-tone="danger">
                  {errorOf(fieldId(FORM, 'facilityTypes'))}
                </p>
              )}
              {FACILITY_TYPES.map((type) => (
                <Checkbox
                  key={type}
                  isSelected={draft.facilityTypes.includes(type)}
                  onChange={(selected) => {
                    update({
                      facilityTypes: selected
                        ? FACILITY_TYPES.filter(
                            (f) => f === type || draft.facilityTypes.includes(f),
                          )
                        : draft.facilityTypes.filter((f) => f !== type),
                    });
                  }}
                >
                  {t(`domain:facilityType.${type}`)}
                </Checkbox>
              ))}
            </fieldset>
            <TextField
              {...field('address')}
              label={t('wizard.address')}
              description={t('wizard.addressHelp')}
              value={draft.address}
              onChange={(address) => {
                update({ address });
              }}
              autoComplete="off"
              isRequired
            />
          </>
        )}

        <div className={layout.row}>
          {step > 0 && (
            <Button
              onPress={() => {
                goTo(step - 1);
              }}
            >
              {t('wizard.previous')}
            </Button>
          )}
          <Button type="submit" variant="primary" isDisabled={create.isPending}>
            {isLast ? t('wizard.submit') : t('wizard.next')}
          </Button>
          <Link href={deputacionPaths.home}>{t('wizard.cancel')}</Link>
        </div>
      </form>
    </Page>
  );
}
