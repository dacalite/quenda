// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { Cents, Instant, IsoDate, Time } from '../domain/types';
import { currentLanguage } from '.';

const LOCALES = { gl: 'gl-ES', es: 'es-ES' } as const;

// Noon UTC keeps the calendar day whatever the browser's time zone.
const calendarDay = (date: IsoDate) => new Date(`${date}T12:00:00Z`);

export function useFormat() {
  const { t } = useTranslation();
  const locale = LOCALES[currentLanguage()];
  const day = (options: Intl.DateTimeFormatOptions) => (date: IsoDate) =>
    new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' }).format(calendarDay(date));

  return {
    /** «martes, 20 de outubro» */
    longDate: day({ weekday: 'long', day: 'numeric', month: 'long' }),
    /** «mar., 20 out.» */
    shortDate: day({ weekday: 'short', day: 'numeric', month: 'short' }),
    /** «20 de outubro de 2026» */
    fullDate: day({ day: 'numeric', month: 'long', year: 'numeric' }),
    weekday: day({ weekday: 'long' }),
    /** The parts of a date drawn as a calendar sheet: «ven.», «30», «out.» */
    weekdayShort: day({ weekday: 'short' }),
    dayOfMonth: day({ day: 'numeric' }),
    monthShort: day({ month: 'short' }),
    timeRange: (start: Time, end: Time) => t('timeRange', { start, end }),
    dateTime: (instant: Instant) =>
      new Intl.DateTimeFormat(locale, {
        day: 'numeric',
        month: 'long',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Madrid',
      }).format(new Date(instant)),
    price: (cents: Cents) =>
      new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(cents / 100),
    /** One decimal, as contrast ratios are written: «4,5». */
    decimal: (value: number) =>
      new Intl.NumberFormat(locale, { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(
        value,
      ),
    /** «11:00 e 15:00» */
    list: (items: string[]) => new Intl.ListFormat(locale, { type: 'conjunction' }).format(items),
    percent: (ratio: number) =>
      new Intl.NumberFormat(locale, { style: 'percent', maximumFractionDigits: 0 }).format(ratio),
  };
}
