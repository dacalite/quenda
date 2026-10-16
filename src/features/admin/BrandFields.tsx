// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES, LANGUAGES, type Language } from '../../config/app';
import type { Emblem } from '../../domain/types';
import { isHexColor } from '../../domain/validation';
import { useFormat } from '../../i18n/format';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { accessibleColor, contrastRatio } from '../../ui/contrast';
import layout from '../../ui/layout.module.css';
import { RadioGroup } from '../../ui/RadioGroup';
import { TextField } from '../../ui/TextField';
import styles from './admin.module.css';

const EMBLEMS: Emblem[] = ['tower', 'bridge', 'oak', 'wave'];
const MIN_CONTRAST = 4.5;

interface FieldState {
  id: string;
  errorMessage: string | undefined;
}

/** Emblem and corporate colour, with the contrast check and an accessible alternative. */
export function BrandFields({
  emblem,
  primaryColor,
  colorField,
  onChange,
}: {
  emblem: Emblem;
  primaryColor: string;
  colorField: FieldState;
  onChange: (patch: { emblem?: Emblem; primaryColor?: string }) => void;
}) {
  const { t } = useTranslation('admin');
  const format = useFormat();
  const validColor = isHexColor(primaryColor);
  const contrast = validColor ? contrastRatio(primaryColor, '#ffffff') : null;
  const suggestion = validColor ? accessibleColor(primaryColor) : null;

  return (
    <>
      <RadioGroup
        label={t('settings.emblem')}
        description={t('settings.emblemHelp')}
        value={emblem}
        onChange={(value) => {
          onChange({ emblem: value as Emblem });
        }}
        options={EMBLEMS.map((e) => ({ id: e, label: t(`settings.emblems.${e}`) }))}
      />
      <div className={layout.row}>
        <TextField
          {...colorField}
          label={t('settings.color')}
          description={t('settings.colorHelp')}
          value={primaryColor}
          onChange={(value) => {
            onChange({ primaryColor: value.trim() });
          }}
          autoComplete="off"
          spellCheck="false"
          isRequired
        />
        {validColor && (
          <span className={styles.swatch} style={{ background: primaryColor }} aria-hidden="true" />
        )}
      </div>
      <div aria-live="polite">
        {contrast !== null && suggestion !== null && (
          <p className={layout.notice} data-tone={contrast >= MIN_CONTRAST ? 'success' : 'warning'}>
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
          <span className={styles.swatch} style={{ background: suggestion }} aria-hidden="true" />
          <Button
            onPress={() => {
              onChange({ primaryColor: suggestion });
            }}
          >
            {t('settings.useSuggestion', { color: suggestion })}
          </Button>
        </p>
      )}
    </>
  );
}

/** The languages a council offers, in the order of the app. */
export function LanguagesField({
  id,
  errorMessage,
  value,
  onChange,
}: FieldState & { value: Language[]; onChange: (languages: Language[]) => void }) {
  const { t } = useTranslation('admin');
  return (
    <fieldset className={layout.section} id={id}>
      <legend>{t('settings.languages')}</legend>
      <p className={layout.meta}>{t('settings.languagesHelp')}</p>
      {errorMessage && (
        <p className={layout.notice} data-tone="danger">
          {errorMessage}
        </p>
      )}
      {LANGUAGES.map((language) => (
        <Checkbox
          key={language}
          isSelected={value.includes(language)}
          onChange={(selected) => {
            onChange(
              selected
                ? LANGUAGES.filter((l) => l === language || value.includes(l))
                : value.filter((l) => l !== language),
            );
          }}
        >
          <span lang={language}>{LANGUAGE_NAMES[language]}</span>
        </Checkbox>
      ))}
    </fieldset>
  );
}
