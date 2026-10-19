// SPDX-License-Identifier: EUPL-1.2
import { parseDate } from '@internationalized/date';
import { useId } from 'react';
import { Calendar, CalendarCell, CalendarGrid, Heading } from 'react-aria-components';
import type { IsoDate } from '../domain/types';
import { Button } from './Button';
import { Icon } from './Icon';
import styles from './MonthCalendar.module.css';

export interface DayMark {
  /** Shown in the cell. */
  count: number;
  /** Read after the date, e.g. «2 reservas». */
  description: string;
}

/** A month grid with arrow-key navigation; marked days show a count and say it to screen readers. */
export function MonthCalendar({
  label,
  value,
  onChange,
  marks,
  previousLabel,
  nextLabel,
}: {
  label: string;
  value: IsoDate;
  onChange: (date: IsoDate) => void;
  marks: Partial<Record<IsoDate, DayMark>>;
  previousLabel: string;
  nextLabel: string;
}) {
  const id = useId();
  return (
    <Calendar
      aria-label={label}
      value={parseDate(value)}
      onChange={(date) => {
        onChange(date.toString());
      }}
      className={styles.calendar}
    >
      <header className={styles.header}>
        <Button slot="previous" variant="quiet" aria-label={previousLabel}>
          <Icon name="chevronLeft" />
        </Button>
        <Heading className={styles.heading} />
        <Button slot="next" variant="quiet" aria-label={nextLabel}>
          <Icon name="chevronRight" />
        </Button>
      </header>
      <CalendarGrid className={styles.grid}>
        {(date) => {
          const key = date.toString();
          const mark = marks[key];
          const describedBy = `${id}-${key}`;
          return (
            <CalendarCell
              date={date}
              className={styles.cell}
              data-marked={mark ? true : undefined}
              // React Aria filters aria-* props out of the cell and sets no description itself,
              // so the count is wired to the day's button here.
              ref={(td) => {
                const button = td?.firstElementChild;
                if (!button) return;
                if (mark) button.setAttribute('aria-describedby', describedBy);
                else button.removeAttribute('aria-describedby');
              }}
            >
              {({ formattedDate }) => (
                <>
                  <span>{formattedDate}</span>
                  {mark && (
                    <>
                      <span className={styles.count} aria-hidden="true">
                        {mark.count}
                      </span>
                      <span id={describedBy} className="visually-hidden">
                        {mark.description}
                      </span>
                    </>
                  )}
                </>
              )}
            </CalendarCell>
          );
        }}
      </CalendarGrid>
    </Calendar>
  );
}
