// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { toIcs } from '../../domain/ics';
import type { AvailabilitySlot } from '../../domain/rules/availability';
import type { RuleViolation } from '../../domain/rules/booking';
import type { CancelViolation, ModifyViolation } from '../../domain/rules/cancellation';
import type { Facility, Id, LocalizedText, Reservation, Tenant } from '../../domain/types';
import { currentLanguage } from '../../i18n';
import { useFormat } from '../../i18n/format';

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

/** What a screen reader hears for a slot: «Pista 1, martes 20 de outubro, 18:00 a 19:00, libre, 4,00 €». */
export function useSlotDescription(facility: Facility) {
  const { t } = useTranslation(['domain', 'citizen']);
  const format = useFormat();
  const subspaceName = useSubspaceName();
  return (slot: AvailabilitySlot, priceCents?: number) => {
    const free = slot.status === 'free';
    return [
      facility.subspaces.length > 1 ? subspaceName(facility, slot.subspaceId) : null,
      format.longDate(slot.date),
      format.timeRange(slot.start, slot.end),
      t(`domain:slotStatus.${slot.status}`),
      free && slot.capacity > 1
        ? t('citizen:availability.places', { count: slot.capacity - slot.taken })
        : null,
      free && priceCents !== undefined ? format.price(priceCents) : null,
    ]
      .filter(Boolean)
      .join(', ');
  };
}

export function useReservationsIcs() {
  const { t } = useTranslation('citizen');
  const subspaceName = useSubspaceName();
  return (tenant: Tenant, reservations: Reservation[], facilities: Facility[]) =>
    toIcs(
      reservations.flatMap((reservation) => {
        const facility = facilities.find((f) => f.id === reservation.facilityId);
        if (!facility) return [];
        return [
          {
            uid: `${reservation.id}@quenda`,
            summary: `${facility.name}, ${subspaceName(facility, reservation.subspaceId)}`,
            location: facility.address,
            description: `${t('reservation.code')}: ${reservation.code}`,
            date: reservation.date,
            start: reservation.start,
            end: reservation.end,
            stamp: reservation.history.at(-1)?.at ?? reservation.createdAt,
          },
        ];
      }),
      t('calendar.calendarName', { tenant: tenant.name }),
    );
}

export function downloadFile(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
