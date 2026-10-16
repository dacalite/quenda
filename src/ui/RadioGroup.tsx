// SPDX-License-Identifier: EUPL-1.2
import { RadioButton, RadioField, RadioGroup as AriaRadioGroup, Text } from 'react-aria-components';
import styles from './choices.module.css';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';

export interface RadioOption {
  id: string;
  label: string;
  description?: string;
}

export interface RadioGroupProps {
  label: string;
  options: readonly RadioOption[];
  value: string | null;
  onChange: (value: string) => void;
  description?: string;
  errorMessage?: string | undefined;
  isRequired?: boolean;
  name?: string;
  id?: string;
}

export function RadioGroup({
  label,
  options,
  description,
  errorMessage,
  isRequired = false,
  ...props
}: RadioGroupProps) {
  return (
    <AriaRadioGroup
      {...props}
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      validationBehavior="aria"
      className={fieldStyles.field}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <div className={styles.options}>
        {options.map((option) => (
          <RadioField key={option.id} value={option.id}>
            <RadioButton className={styles.choice}>
              <span className={styles.circle} aria-hidden="true" />
              <span>{option.label}</span>
            </RadioButton>
            {option.description && (
              <Text slot="description" className={styles.choiceDescription}>
                {option.description}
              </Text>
            )}
          </RadioField>
        ))}
      </div>
      <FieldHelp description={description} errorMessage={errorMessage} />
    </AriaRadioGroup>
  );
}
