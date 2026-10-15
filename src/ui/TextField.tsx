// SPDX-License-Identifier: EUPL-1.2
import {
  Input,
  TextField as AriaTextField,
  type TextFieldProps as AriaTextFieldProps,
} from 'react-aria-components';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';

export interface TextFieldProps extends Omit<
  AriaTextFieldProps,
  'className' | 'children' | 'validationBehavior'
> {
  label: string;
  description?: string;
  /** Shown, and linked to the input, when the field is invalid. */
  errorMessage?: string | undefined;
}

export function TextField({
  label,
  description,
  errorMessage,
  isRequired,
  ...props
}: TextFieldProps) {
  return (
    <AriaTextField
      {...props}
      isRequired={isRequired ?? false}
      isInvalid={Boolean(errorMessage) || (props.isInvalid ?? false)}
      validationBehavior="aria"
      className={fieldStyles.field}
    >
      <FieldLabel isRequired={isRequired ?? false}>{label}</FieldLabel>
      <Input className={fieldStyles.input} />
      <FieldHelp description={description} errorMessage={errorMessage} />
    </AriaTextField>
  );
}
