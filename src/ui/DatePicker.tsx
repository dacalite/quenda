// SPDX-License-Identifier: EUPL-1.2
import { parseDate } from '@internationalized/date';
import {
  Calendar,
  CalendarCell,
  CalendarGrid,
  DateInput,
  DatePicker as AriaDatePicker,
  DateSegment,
  Dialog,
  Group,
  Heading,
  Popover,
} from 'react-aria-components';
import type { IsoDate } from '../domain/types';
import { Button } from './Button';
import styles from './DatePicker.module.css';
import { FieldHelp, FieldLabel } from './FieldParts';
import fieldStyles from './fields.module.css';
import { Icon } from './Icon';
import overlayStyles from './overlays.module.css';

export interface DatePickerProps {
  label: string;
  value: IsoDate | null;
  onChange: (value: IsoDate | null) => void;
  minValue?: IsoDate;
  maxValue?: IsoDate;
  description?: string;
  errorMessage?: string | undefined;
  isRequired?: boolean;
}

export function DatePicker({
  label,
  value,
  onChange,
  minValue,
  maxValue,
  description,
  errorMessage,
  isRequired = false,
}: DatePickerProps) {
  return (
    <AriaDatePicker
      value={value ? parseDate(value) : null}
      onChange={(date) => {
        onChange(date ? date.toString() : null);
      }}
      {...(minValue ? { minValue: parseDate(minValue) } : {})}
      {...(maxValue ? { maxValue: parseDate(maxValue) } : {})}
      isRequired={isRequired}
      isInvalid={Boolean(errorMessage)}
      validationBehavior="aria"
      className={fieldStyles.field}
    >
      <FieldLabel isRequired={isRequired}>{label}</FieldLabel>
      <Group className={styles.group}>
        <DateInput className={styles.input}>
          {(segment) => <DateSegment segment={segment} className={styles.segment} />}
        </DateInput>
        <Button variant="quiet" className={styles.calendarButton}>
          <Icon name="calendar" />
        </Button>
      </Group>
      <FieldHelp description={description} errorMessage={errorMessage} />
      <Popover className={overlayStyles.popover}>
        <Dialog>
          <Calendar className={styles.calendar}>
            <header className={styles.calendarHeader}>
              <Button slot="previous" variant="quiet">
                <Icon name="chevronLeft" />
              </Button>
              <Heading className={styles.calendarHeading} />
              <Button slot="next" variant="quiet">
                <Icon name="chevronRight" />
              </Button>
            </header>
            <CalendarGrid className={styles.grid}>
              {(date) => <CalendarCell date={date} className={styles.cell} />}
            </CalendarGrid>
          </Calendar>
        </Dialog>
      </Popover>
    </AriaDatePicker>
  );
}
