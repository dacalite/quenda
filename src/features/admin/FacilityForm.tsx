// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router';
import { NotFoundPage } from '../../app/pages';
import { Page } from '../../app/Page';
import { useFacility } from '../../app/queries';
import { adminPaths } from '../../app/routes/paths';
import { ValidationError } from '../../data/ports/errors';
import type { FacilityInput } from '../../data/ports/repositories';
import { LANGUAGES } from '../../config/app';
import type {
  AccessibilityFeature,
  Concession,
  FacilityStatus,
  FacilityType,
} from '../../domain/types';
import { DEFAULT_COORDINATES } from '../../domain/councils';
import { NUMERIC_RULES, validateFacility } from '../../domain/validation';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { Link } from '../../ui/Link';
import { NumberField } from '../../ui/NumberField';
import { RadioGroup } from '../../ui/RadioGroup';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { PhotoFields } from './PhotoFields';
import { fieldId, useProblemMessages } from './problems';
import { useStaff, useStaffMutation } from './queries';
import { RulesFields } from './RulesFields';

const FORM = 'facility';
const TYPES: FacilityType[] = [
  'sportsHall',
  'paddleCourt',
  'tennisCourt',
  'footballPitch',
  'swimmingPool',
  'multipurposeRoom',
  'gym',
];
const FEATURES: AccessibilityFeature[] = [
  'stepFreeAccess',
  'adaptedChangingRoom',
  'adaptedToilet',
  'reservedParking',
  'hearingLoop',
];
const CONCESSIONS: Concession[] = ['minor', 'senior', 'disability', 'largeFamily'];
const STATUSES: FacilityStatus[] = ['active', 'inactive'];

const text = () => ({ gl: '', es: '' });
const newSpace = () => ({ id: crypto.randomUUID(), name: text(), capacity: 1, contains: [] });

const blankFacility = (): FacilityInput => ({
  name: '',
  type: 'sportsHall',
  description: text(),
  address: '',
  coordinates: DEFAULT_COORDINATES,
  capacity: 10,
  subspaces: [newSpace()],
  accessibility: [],
  photos: [],
  usageRules: text(),
  status: 'active',
  rules: {},
  pricing: { residentCents: 300, nonResidentCents: 600, concessions: {}, entitiesFree: true },
});

export function NewFacility() {
  return <FacilityForm initial={blankFacility()} />;
}

export function EditFacility() {
  const { facilityId = '' } = useParams();
  const facility = useFacility(facilityId);
  if (facility.isError) return <NotFoundPage />;
  if (!facility.data) return null;
  const { id, tenantId: _tenantId, ...input } = facility.data;
  return <FacilityForm id={id} initial={input} />;
}

function FacilityForm({ id, initial }: { id?: string; initial: FacilityInput }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const paths = adminPaths(tenant.slug);
  const navigate = useNavigate();
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FormError[]>([]);
  const existingSpaces = new Set(initial.subspaces.map((s) => s.id));
  const save = useStaffMutation((r, tenantId, input: FacilityInput) =>
    id ? r.facilities.update(tenantId, id, input) : r.facilities.create(tenantId, input),
  );

  const labels: Record<string, string> = {
    name: t('facilityForm.name'),
    address: t('facilityForm.address'),
    capacity: t('facilityForm.capacity'),
    subspaces: t('facilityForm.subspaces'),
    'coordinates.lat': t('facilityForm.lat'),
    'coordinates.lng': t('facilityForm.lng'),
    'pricing.residentCents': t('facilityForm.residentCents'),
    'pricing.nonResidentCents': t('facilityForm.nonResidentCents'),
    ...Object.fromEntries(NUMERIC_RULES.map((key) => [`rules.${key}`, t(`rules.${key}`)])),
    ...Object.fromEntries(
      CONCESSIONS.map((c) => [`pricing.concessions.${c}`, t(`domain:concession.${c}`)]),
    ),
  };
  const label = (path: string) => {
    const photo = /^photos\.(\d+)\.alt\.(gl|es)$/.exec(path);
    if (photo) {
      return t('facilityForm.photoAlt', {
        n: Number(photo[1]) + 1,
        language: t(`facilityForm.language.${photo[2] as 'gl' | 'es'}`),
      });
    }
    const space = /^subspaces\.(\d+)\.(?:name\.(gl|es)|capacity)$/.exec(path);
    if (!space) return labels[path] ?? path;
    const n = Number(space[1]) + 1;
    return space[2]
      ? t('facilityForm.spaceName', {
          n,
          language: t(`facilityForm.language.${space[2] as 'gl' | 'es'}`),
        })
      : t('facilityForm.spaceCapacity', { n });
  };
  const messages = useProblemMessages(FORM, label);
  const errorOf = (inputId: string) => errors.find((e) => e.fieldId === inputId)?.message;
  const field = (path: string) => {
    const inputId = fieldId(FORM, path);
    return { id: inputId, errorMessage: errorOf(inputId) };
  };
  const update = (patch: Partial<FacilityInput>) => {
    setDraft({ ...draft, ...patch });
  };
  const localizedFields = (key: 'description' | 'usageRules') =>
    LANGUAGES.map((language) => (
      <TextField
        key={language}
        label={t(`facilityForm.${key}`, { language: t(`facilityForm.language.${language}`) })}
        value={draft[key][language]}
        onChange={(value) => {
          update({ [key]: { ...draft[key], [language]: value } });
        }}
        multiline
      />
    ));

  const submit = () => {
    const found = messages(validateFacility(draft));
    setErrors(found);
    if (found.length > 0) return;
    save.mutate(draft, {
      onSuccess: (facility) => {
        if (id) {
          toast(t('facilityForm.saved'));
        } else {
          toast(t('facilityForm.created'));
          void navigate(paths.schedule(facility.id));
        }
      },
      onError: (error) => {
        if (error instanceof ValidationError) setErrors(messages(error.problems));
        else toast(t('common:error.title'), 'danger');
      },
    });
  };

  return (
    <Page
      title={id ? t('facilityForm.editTitle', { name: initial.name }) : t('facilityForm.newTitle')}
    >
      <ErrorSummary errors={errors} />
      <form
        className={layout.section}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset className={layout.section}>
          <legend>{t('facilityForm.general')}</legend>
          <TextField
            {...field('name')}
            label={t('facilityForm.name')}
            value={draft.name}
            onChange={(name) => {
              update({ name });
            }}
            isRequired
          />
          <Select
            label={t('facilityForm.type')}
            value={draft.type}
            onChange={(type) => {
              update({ type: type as FacilityType });
            }}
            options={TYPES.map((type) => ({ id: type, label: t(`domain:facilityType.${type}`) }))}
          />
          <TextField
            {...field('address')}
            label={t('facilityForm.address')}
            value={draft.address}
            onChange={(address) => {
              update({ address });
            }}
            isRequired
          />
          <div className={layout.filters}>
            {(['lat', 'lng'] as const).map((axis) => (
              <NumberField
                key={axis}
                {...field(`coordinates.${axis}`)}
                label={t(`facilityForm.${axis}`)}
                value={draft.coordinates[axis]}
                step={0.0001}
                formatOptions={{ maximumFractionDigits: 6 }}
                onChange={(value) => {
                  update({ coordinates: { ...draft.coordinates, [axis]: value ?? 0 } });
                }}
              />
            ))}
            <NumberField
              {...field('capacity')}
              label={t('facilityForm.capacity')}
              description={t('facilityForm.capacityHelp')}
              value={draft.capacity}
              minValue={1}
              isRequired
              onChange={(capacity) => {
                update({ capacity: capacity ?? 0 });
              }}
            />
          </div>
          {localizedFields('description')}
          <RadioGroup
            label={t('facilityForm.status')}
            value={draft.status}
            onChange={(status) => {
              update({ status: status as FacilityStatus });
            }}
            options={STATUSES.map((status) => ({
              id: status,
              label: t(`facilities.statusValue.${status}`),
              description: t(`facilityForm.statusHelp.${status}`),
            }))}
          />
        </fieldset>

        <fieldset className={layout.section}>
          <legend id={fieldId(FORM, 'subspaces')} tabIndex={-1}>
            {t('facilityForm.subspaces')}
          </legend>
          <p className={layout.meta}>{t('facilityForm.subspacesHelp')}</p>
          {draft.subspaces.map((space, i) => (
            <fieldset key={space.id} className={layout.panel}>
              <legend>{t('facilityForm.space', { n: i + 1 })}</legend>
              <div className={layout.filters}>
                {LANGUAGES.map((language) => (
                  <TextField
                    key={language}
                    {...field(`subspaces.${String(i)}.name.${language}`)}
                    label={t('facilityForm.spaceNameShort', {
                      language: t(`facilityForm.language.${language}`),
                    })}
                    value={space.name[language]}
                    isRequired
                    onChange={(value) => {
                      update({
                        subspaces: draft.subspaces.map((s) =>
                          s.id === space.id ? { ...s, name: { ...s.name, [language]: value } } : s,
                        ),
                      });
                    }}
                  />
                ))}
                <NumberField
                  {...field(`subspaces.${String(i)}.capacity`)}
                  label={t('facilityForm.spaceCapacityShort')}
                  description={t('facilityForm.spaceCapacityHelp')}
                  value={space.capacity}
                  minValue={1}
                  isRequired
                  onChange={(capacity) => {
                    update({
                      subspaces: draft.subspaces.map((s) =>
                        s.id === space.id ? { ...s, capacity: capacity ?? 0 } : s,
                      ),
                    });
                  }}
                />
              </div>
              {!existingSpaces.has(space.id) && draft.subspaces.length > 1 && (
                <p>
                  <Button
                    variant="quiet"
                    onPress={() => {
                      update({ subspaces: draft.subspaces.filter((s) => s.id !== space.id) });
                    }}
                  >
                    {t('facilityForm.removeSpace', { n: i + 1 })}
                  </Button>
                </p>
              )}
            </fieldset>
          ))}
          <p>
            <Button
              onPress={() => {
                update({ subspaces: [...draft.subspaces, newSpace()] });
              }}
            >
              {t('facilityForm.addSpace')}
            </Button>
          </p>
        </fieldset>

        <fieldset className={layout.section}>
          <legend>{t('facilityForm.accessibility')}</legend>
          {FEATURES.map((feature) => (
            <Checkbox
              key={feature}
              isSelected={draft.accessibility.includes(feature)}
              onChange={(selected) => {
                update({
                  accessibility: selected
                    ? [...draft.accessibility, feature]
                    : draft.accessibility.filter((f) => f !== feature),
                });
              }}
            >
              {t(`domain:accessibility.${feature}`)}
            </Checkbox>
          ))}
        </fieldset>

        <fieldset className={layout.section}>
          <legend>{t('facilityForm.photos')}</legend>
          <PhotoFields
            photos={draft.photos}
            onChange={(photos) => {
              update({ photos });
            }}
            field={field}
          />
        </fieldset>

        <fieldset className={layout.section}>
          <legend>{t('facilityForm.usage')}</legend>
          {localizedFields('usageRules')}
          <fieldset className={layout.fieldset}>
            <legend>{t('facilityForm.rulesTitle')}</legend>
            <p className={layout.meta}>{t('facilityForm.rulesHelp')}</p>
            <RulesFields
              form={FORM}
              prefix="rules"
              value={draft.rules}
              inherited={tenant.defaultRules}
              onChange={(rules) => {
                update({ rules });
              }}
              errorOf={errorOf}
            />
          </fieldset>
        </fieldset>

        <fieldset className={layout.section}>
          <legend>{t('facilityForm.pricing')}</legend>
          <p className={layout.meta}>{t('facilityForm.pricingHelp')}</p>
          <div className={layout.filters}>
            {(['residentCents', 'nonResidentCents'] as const).map((key) => (
              <NumberField
                key={key}
                {...field(`pricing.${key}`)}
                label={t(`facilityForm.${key}`)}
                value={draft.pricing[key] / 100}
                minValue={0}
                step={0.05}
                formatOptions={{ style: 'currency', currency: 'EUR' }}
                isRequired
                onChange={(euros) => {
                  update({ pricing: { ...draft.pricing, [key]: Math.round((euros ?? 0) * 100) } });
                }}
              />
            ))}
            {CONCESSIONS.map((concession) => (
              <NumberField
                key={concession}
                {...field(`pricing.concessions.${concession}`)}
                label={t('facilityForm.concession', {
                  concession: t(`domain:concession.${concession}`),
                })}
                value={draft.pricing.concessions[concession] ?? null}
                minValue={0}
                maxValue={100}
                onChange={(percent) => {
                  const { [concession]: _old, ...rest } = draft.pricing.concessions;
                  update({
                    pricing: {
                      ...draft.pricing,
                      concessions: percent === null ? rest : { ...rest, [concession]: percent },
                    },
                  });
                }}
              />
            ))}
          </div>
          <Checkbox
            isSelected={draft.pricing.entitiesFree}
            onChange={(entitiesFree) => {
              update({ pricing: { ...draft.pricing, entitiesFree } });
            }}
          >
            {t('facilityForm.entitiesFree')}
          </Checkbox>
        </fieldset>

        <p className={layout.row}>
          <Button type="submit" variant="primary">
            {id ? t('facilityForm.save') : t('facilityForm.create')}
          </Button>
          {id && (
            <Link variant="secondary" href={paths.schedule(id)}>
              {t('facilities.editSchedule')}
            </Link>
          )}
        </p>
      </form>
    </Page>
  );
}
