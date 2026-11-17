// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { toIcs, type CalendarEvent } from '../../domain/ics';
import type { AvailabilitySlot } from '../../domain/rules/availability';
import type { Facility, Id, Reservation, Tenant } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useSpaceLabel, useSubspaceName } from '../../i18n/labels';
import { useMe } from './queries';

/** Badge tone for each reservation status. */
export const RESERVATION_TONE = {
  confirmed: 'success',
  cancelled: 'danger',
  completed: 'neutral',
  noShow: 'warning',
} as const;

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

/** A reservation as a calendar event: the same text for the .ics file and the Google and Outlook links. */
export function useCalendarEvent() {
  const { t } = useTranslation('citizen');
  const spaceLabel = useSpaceLabel();
  return (reservation: Reservation, facility: Facility): CalendarEvent => ({
    uid: `${reservation.id}@quenda`,
    summary: `${facility.name}, ${spaceLabel(facility, reservation)}`,
    location: facility.address,
    description: `${t('reservation.code')}: ${reservation.code}`,
    date: reservation.date,
    start: reservation.start,
    end: reservation.end,
    stamp: reservation.history.at(-1)?.at ?? reservation.createdAt,
  });
}

export function useReservationsIcs() {
  const { t } = useTranslation('citizen');
  const toEvent = useCalendarEvent();
  return (tenant: Tenant, reservations: Reservation[], facilities: Facility[]) =>
    toIcs(
      reservations.flatMap((reservation) => {
        const facility = facilities.find((f) => f.id === reservation.facilityId);
        return facility ? [toEvent(reservation, facility)] : [];
      }),
      t('calendar.calendarName', { tenant: tenant.name }),
    );
}

/** Full name of the person in the resident's care a booking is for, if any. */
export function useDependentName() {
  const me = useMe();
  return (dependentId: Id | undefined) => {
    const dependent = me.data?.dependents.find((d) => d.id === dependentId);
    return dependent ? `${dependent.firstName} ${dependent.lastName}` : null;
  };
}
