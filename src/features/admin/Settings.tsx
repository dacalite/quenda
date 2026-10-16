// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import { LANGUAGE_NAMES, LANGUAGES } from '../../config/app';
import { ValidationError } from '../../data/ports/errors';
import type { NoShowPolicy, Tenant } from '../../domain/types';
import { NUMERIC_RULES, validateTenant } from '../../domain/validation';
import { Button } from '../../ui/Button';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { NumberField } from '../../ui/NumberField';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { fieldId, useProblemMessages } from './problems';
import { useStaff, useStaffMutation } from './queries';
import { BrandFields, LanguagesField } from './BrandFields';
import { RulesFields } from './RulesFields';

const FORM = 'settings';
const LEGAL = ['legalNotice', 'privacy', 'accessibility'] as const;
const NO_SHOW = ['strikesForSuspension', 'windowDays', 'suspensionDays'] as const;

type Draft = Omit<Tenant, 'id' | 'slug' | 'deputacionId' | 'timeZone'>;

export function Settings() {
  const { tenant } = useStaff();
  const { id: _id, slug: _slug, deputacionId: _d, timeZone: _tz, ...draft } = tenant;
  // Remount when the saved council changes, so the form starts from the stored values.
  return <SettingsForm key={JSON.stringify(draft)} initial={draft} />;
}

function SettingsForm({ initial }: { initial: Draft }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const toast = useToast();
  const [draft, setDraft] = useState(initial);
  const [errors, setErrors] = useState<FormError[]>([]);
  const save = useStaffMutation((r, id, patch: Draft) => r.tenants.update(id, patch));
  const update = (patch: Partial<Draft>) => {
    setDraft({ ...draft, ...patch });
  };

  const labels: Record<string, string> = {
    name: t('settings.name'),
    primaryColor: t('settings.color'),
    languages: t('settings.languages'),
    ...Object.fromEntries(NUMERIC_RULES.map((key) => [`defaultRules.${key}`, t(`rules.${key}`)])),
    ...Object.fromEntries(
      NO_SHOW.map((key) => [`defaultRules.noShow.${key}`, t(`settings.noShow.${key}`)]),
    ),
  };
  const messages = useProblemMessages(FORM, (path) => labels[path] ?? path);
  const errorOf = (id: string) => errors.find((e) => e.fieldId === id)?.message;
  const field = (path: string) => {
    const id = fieldId(FORM, path);
    return { id, errorMessage: errorOf(id) };
  };

  const setNoShow = (key: keyof NoShowPolicy, value: number | null) => {
    update({
      defaultRules: {
        ...draft.defaultRules,
        noShow: { ...draft.defaultRules.noShow, [key]: value ?? Number.NaN },
      },
    });
  };

  const submit = () => {
    const found = messages(validateTenant(draft));
    setErrors(found);
    if (found.length > 0) return;
    save.mutate(draft, {
      onSuccess: () => {
        toast(t('settings.saved'));
      },
      onError: (error) => {
        if (error instanceof ValidationError) setErrors(messages(error.problems));
        else toast(t('common:error.title'), 'danger');
      },
    });
  };

  return (
    <Page title={t('settings.title')}>
      <p>{t('settings.intro')}</p>
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
          <legend>{t('settings.identity')}</legend>
          <TextField
            {...field('name')}
            label={t('settings.name')}
            value={draft.name}
            onChange={(name) => {
              update({ name });
            }}
            isRequired
          />
          <BrandFields
            emblem={draft.emblem}
            primaryColor={draft.primaryColor}
            colorField={field('primaryColor')}
            onChange={update}
          />
        </fieldset>

        <LanguagesField
          {...field('languages')}
          value={draft.languages}
          onChange={(languages) => {
            update({ languages });
          }}
        />

        <fieldset className={layout.section}>
          <legend>{t('settings.rules')}</legend>
          <p className={layout.meta}>{t('settings.rulesHelp')}</p>
          <RulesFields
            form={FORM}
            prefix="defaultRules"
            value={draft.defaultRules}
            onChange={(rules) => {
              update({ defaultRules: { ...draft.defaultRules, ...rules } });
            }}
            errorOf={errorOf}
          />
          <fieldset className={layout.fieldset}>
            <legend>{t('settings.noShowTitle')}</legend>
            <div className={layout.filters}>
              {NO_SHOW.map((key) => (
                <NumberField
                  key={key}
                  {...field(`defaultRules.noShow.${key}`)}
                  label={t(`settings.noShow.${key}`)}
                  value={draft.defaultRules.noShow[key]}
                  minValue={0}
                  isRequired
                  onChange={(value) => {
                    setNoShow(key, value);
                  }}
                />
              ))}
            </div>
          </fieldset>
        </fieldset>

        <fieldset className={layout.section}>
          <legend>{t('settings.legal')}</legend>
          {LEGAL.flatMap((page) =>
            LANGUAGES.map((language) => (
              <TextField
                key={`${page}-${language}`}
                label={t(`settings.legalPage.${page}`, { language: LANGUAGE_NAMES[language] })}
                value={draft.legal[page][language]}
                onChange={(value) => {
                  update({
                    legal: { ...draft.legal, [page]: { ...draft.legal[page], [language]: value } },
                  });
                }}
                multiline
              />
            )),
          )}
        </fieldset>

        <p>
          <Button type="submit" variant="primary">
            {t('settings.save')}
          </Button>
        </p>
      </form>
    </Page>
  );
}
