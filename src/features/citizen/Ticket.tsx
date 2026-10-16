// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { Link } from '../../ui/Link';
import styles from './Ticket.module.css';

/** A booking drawn as a ticket stub: the day on the left, the place and time on the right. */
export function Ticket({
  reservation,
  facilityName,
  href,
  as: Element = 'li',
  children,
}: {
  reservation: Reservation;
  facilityName: string;
  href: string;
  as?: 'li' | 'div';
  children?: ReactNode;
}) {
  const { t } = useTranslation('citizen');
  const format = useFormat();
  const { date } = reservation;
  return (
    <Element className={styles.ticket}>
      <div className={styles.paper}>
        <div className={styles.stub} aria-hidden="true">
          <span>{format.weekdayShort(date)}</span>
          <span className={styles.day}>{format.dayOfMonth(date)}</span>
          <span>{format.monthShort(date)}</span>
        </div>
        <div className={styles.body}>
          <h3 className={styles.title}>{facilityName}</h3>
          <p className={styles.when}>
            {format.longDate(date)}, {format.timeRange(reservation.start, reservation.end)}
          </p>
          <Link href={href} className={styles.link}>
            {t('reservation.title', { code: reservation.code })}
          </Link>
          {children}
        </div>
      </div>
    </Element>
  );
}
