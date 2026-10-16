// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import { LANGUAGE_NAMES, LANGUAGES } from '../../config/app';
import { ValidationError } from '../../data/ports/errors';
import type { Emblem, NoShowPolicy, Tenant } from '../../domain/types';
import { isHexColor, NUMERIC_RULES, validateTenant } from '../../domain/validation';
import { useFormat } from '../../i18n/format';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { accessibleColor, contrastRatio } from '../../ui/contrast';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { NumberField } from '../../ui/NumberField';
import { RadioGroup } from '../../ui/RadioGroup';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import styles from './admin.module.css';
import { fieldId, useProblemMessages } from './problems';
import { useStaff, useStaffMutation } from './queries';
import { RulesFields } from './RulesFields';

const FORM = 'settings';
const EMBLEMS: Emblem[] = ['tower', 'bridge', 'oak', 'wave'];
const LEGAL = ['legalNotice', 'privacy', 'accessibility'] as const;
const NO_SHOW = ['strikesForSuspension', 'windowDays', 'suspensionDays'] as const;
const MIN_CONTRAST = 4.5;

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
  const format = useFormat();
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

  const validColor = isHexColor(draft.primaryColor);
  const contrast = validColor ? contrastRatio(draft.primaryColor, '#ffffff') : null;
  const suggestion = validColor ? accessibleColor(draft.primaryColor) : null;
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
          <RadioGroup
            label={t('settings.emblem')}
            description={t('settings.emblemHelp')}
            value={draft.emblem}
            onChange={(emblem) => {
              update({ emblem: emblem as Emblem });
            }}
            options={EMBLEMS.map((e) => ({ id: e, label: t(`settings.emblems.${e}`) }))}
          />
          <div className={layout.row}>
            <TextField
              {...field('primaryColor')}
              label={t('settings.color')}
              description={t('settings.colorHelp')}
              value={draft.primaryColor}
              onChange={(primaryColor) => {
                update({ primaryColor: primaryColor.trim() });
              }}
              autoComplete="off"
              spellCheck="false"
              isRequired
            />
            {validColor && (
              <span
                className={styles.swatch}
                style={{ background: draft.primaryColor }}
                aria-hidden="true"
              />
            )}
          </div>
          <div aria-live="polite">
            {contrast !== null && suggestion !== null && (
              <p
                className={layout.notice}
                data-tone={contrast >= MIN_CONTRAST ? 'success' : 'warning'}
              >
                {contrast >= MIN_CONTRAST
                  ? t('settings.contrastOk', { ratio: format.decimal(contrast) })
                  : t('settings.contrastLow', {
                      ratio: format.decimal(contrast),
                      minimum: format.decimal(MIN_CONTRAST),
                      suggestion,
                    })}
              </p>
            )}
          </div>
          {contrast !== null && contrast < MIN_CONTRAST && suggestion && (
            <p className={layout.row}>
              <span
                className={styles.swatch}
                style={{ background: suggestion }}
                aria-hidden="true"
              />
              <Button
                onPress={() => {
                  update({ primaryColor: suggestion });
                }}
              >
                {t('settings.useSuggestion', { color: suggestion })}
              </Button>
            </p>
          )}
        </fieldset>

        <fieldset className={layout.section} id={fieldId(FORM, 'languages')}>
          <legend>{t('settings.languages')}</legend>
          <p className={layout.meta}>{t('settings.languagesHelp')}</p>
          {errorOf(fieldId(FORM, 'languages')) && (
            <p className={layout.notice} data-tone="danger">
              {errorOf(fieldId(FORM, 'languages'))}
            </p>
          )}
          {LANGUAGES.map((language) => (
            <Checkbox
              key={language}
              isSelected={draft.languages.includes(language)}
              onChange={(selected) => {
                update({
                  languages: selected
                    ? LANGUAGES.filter((l) => l === language || draft.languages.includes(l))
                    : draft.languages.filter((l) => l !== language),
                });
              }}
            >
              <span lang={language}>{LANGUAGE_NAMES[language]}</span>
            </Checkbox>
          ))}
        </fieldset>

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
