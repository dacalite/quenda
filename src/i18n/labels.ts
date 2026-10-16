// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { RuleViolation } from '../domain/rules/booking';
import type { CancelViolation, ModifyViolation } from '../domain/rules/cancellation';
import type { Facility, Id, LocalizedText, Weekday } from '../domain/types';
import { currentLanguage } from '.';
import { useFormat } from './format';

export function useLocalized() {
  useTranslation();
  const language = currentLanguage();
  return (text: LocalizedText) => text[language];
}

export function useSubspaceName() {
  const localized = useLocalized();
  return (facility: Facility, subspaceId: Id) => {
    const subspace = facility.subspaces.find((s) => s.id === subspaceId);
    return subspace ? localized(subspace.name) : '';
  };
}

export function useViolationText() {
  const { t } = useTranslation('domain');
  const format = useFormat();
  return (violation: RuleViolation | CancelViolation | ModifyViolation): string => {
    switch (violation.code) {
      case 'misaligned':
        return t('violation.misaligned', { slotMinutes: violation.slotMinutes });
      case 'tooSoon':
        return t('violation.tooSoon', { count: violation.hours });
      case 'tooFarAhead':
        return t('violation.tooFarAhead', { count: violation.days });
      case 'tooShort':
      case 'tooLong':
        return t(`violation.${violation.code}`, { minutes: violation.minutes });
      case 'weeklyLimit':
        return t('violation.weeklyLimit', { count: violation.max });
      case 'suspended':
        return t('violation.suspended', { until: format.longDate(violation.until) });
      case 'modificationWindowClosed':
        return t('violation.modificationWindowClosed', { count: violation.hours });
      default:
        return t(`violation.${violation.code}`);
    }
  };
}

const WEEKDAY_KEYS = {
  1: 'weekday.1',
  2: 'weekday.2',
  3: 'weekday.3',
  4: 'weekday.4',
  5: 'weekday.5',
  6: 'weekday.6',
  7: 'weekday.7',
} as const satisfies Record<Weekday, string>;

export function useWeekdayName() {
  const { t } = useTranslation('domain');
  return (day: Weekday) => t(WEEKDAY_KEYS[day]);
}
