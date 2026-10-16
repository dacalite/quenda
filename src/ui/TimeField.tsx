// SPDX-License-Identifier: EUPL-1.2
import { parseTime } from '@internationalized/date';
import { DateInput, DateSegment, TimeField as AriaTimeField } from 'react-aria-components';
import type { Time } from '../domain/types';
import styles from './DatePicker.module.css';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';

export interface TimeFieldProps {
  label: string;
  value: Time | null;
  onChange: (value: Time | null) => void;
  description?: string | undefined;
  errorMessage?: string | undefined;
  isRequired?: boolean;
  id?: string;
}

/** 24-hour time, typed segment by segment as React Aria reads it to screen readers. */
export function TimeField({
  label,
  value,
  onChange,
  description,
  errorMessage,
  isRequired = false,
  id,
}: TimeFieldProps) {
  return (
    <AriaTimeField
      {...(id ? { id } : {})}
      value={value ? parseTime(value) : null}
      onChange={(time) => {
        onChange(time ? time.toString().slice(0, 5) : null);
      }}
      hourCycle={24}
      granularity="minute"
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      validationBehavior="aria"
      className={fieldStyles.field}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <DateInput className={[styles.group, styles.input].join(' ')}>
        {(segment) => <DateSegment segment={segment} className={styles.segment} />}
      </DateInput>
      <FieldHelp description={description} errorMessage={errorMessage} />
    </AriaTimeField>
  );
}
