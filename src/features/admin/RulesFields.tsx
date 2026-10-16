// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { BookingRules, Eligibility } from '../../domain/types';
import { NUMERIC_RULES } from '../../domain/validation';
import layout from '../../ui/layout.module.css';
import { NumberField } from '../../ui/NumberField';
import { Select } from '../../ui/Select';
import { fieldId } from './problems';

const ELIGIBILITY: Eligibility[] = ['everyone', 'residents', 'entities'];
const INHERIT = 'inherit';

/**
 * Booking rules. With `inherited`, an empty field falls back to the council's value,
 * so a facility only stores what it changes.
 */
export function RulesFields({
  form,
  prefix,
  value,
  inherited,
  onChange,
  errorOf,
}: {
  form: string;
  prefix: string;
  value: Partial<BookingRules>;
  inherited?: BookingRules;
  onChange: (rules: Partial<BookingRules>) => void;
  errorOf: (id: string) => string | undefined;
}) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const set = <K extends keyof BookingRules>(key: K, next: BookingRules[K] | null) => {
    const { [key]: _old, ...rest } = value;
    if (next !== null) onChange({ ...rest, [key]: next });
    // Without a council value to fall back on, an empty field stays empty and fails validation.
    else onChange(inherited ? rest : { ...rest, [key]: Number.NaN });
  };

  return (
    <div className={layout.filters}>
      {NUMERIC_RULES.map((key) => {
        const id = fieldId(form, `${prefix}.${key}`);
        return (
          <NumberField
            key={key}
            id={id}
            label={t(`rules.${key}`)}
            value={value[key] ?? null}
            minValue={0}
            step={1}
            isRequired={!inherited}
            description={
              inherited ? t('rules.inherited', { value: String(inherited[key]) }) : undefined
            }
            errorMessage={errorOf(id)}
            onChange={(next) => {
              set(key, next);
            }}
          />
        );
      })}
      <Select
        label={t('rules.eligibility')}
        value={value.eligibility ?? (inherited ? INHERIT : 'everyone')}
        onChange={(next) => {
          set('eligibility', next === INHERIT ? null : (next as Eligibility));
        }}
        options={[
          ...(inherited
            ? [
                {
                  id: INHERIT,
                  label: t('rules.eligibilityInherited', {
                    value: t(`domain:eligibility.${inherited.eligibility}`),
                  }),
                },
              ]
            : []),
          ...ELIGIBILITY.map((e) => ({ id: e, label: t(`domain:eligibility.${e}`) })),
        ]}
      />
    </div>
  );
}
