// SPDX-License-Identifier: EUPL-1.2
import { Input, NumberField as AriaNumberField } from 'react-aria-components';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';

export interface NumberFieldProps {
  label: string;
  /** `null` while the field is empty. */
  value: number | null;
  onChange: (value: number | null) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  formatOptions?: Intl.NumberFormatOptions;
  description?: string | undefined;
  errorMessage?: string | undefined;
  isRequired?: boolean;
  id?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  description,
  errorMessage,
  isRequired = false,
  ...props
}: NumberFieldProps) {
  return (
    <AriaNumberField
      {...props}
      value={value ?? Number.NaN}
      onChange={(next) => {
        onChange(Number.isNaN(next) ? null : next);
      }}
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      validationBehavior="aria"
      className={fieldStyles.field}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <Input className={[fieldStyles.input, fieldStyles.short].join(' ')} />
      <FieldHelp description={description} errorMessage={errorMessage} />
    </AriaNumberField>
  );
}
