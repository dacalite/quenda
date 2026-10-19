// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { downloadFile } from '../../app/download';
import { googleCalendarUrl, outlookCalendarUrl } from '../../domain/calendarLinks';
import type { Facility, Reservation } from '../../domain/types';
import { MenuButton } from '../../ui/Menu';
import { useCalendarEvent, useReservationsIcs } from './labels';
import { useCitizen } from './queries';

/** Google and Outlook open with the event filled in; every other app takes the .ics file. */
export function AddToCalendar({
  reservation,
  facility,
}: {
  reservation: Reservation;
  facility: Facility;
}) {
  const { t } = useTranslation('citizen');
  const { tenant } = useCitizen();
  const toEvent = useCalendarEvent();
  const ics = useReservationsIcs();
  const event = toEvent(reservation, facility);
  return (
    <MenuButton
      label={t('addToCalendar.label')}
      icon="calendar"
      newTabHint={t('addToCalendar.newTab')}
      items={[
        { id: 'google', label: t('addToCalendar.google'), href: googleCalendarUrl(event) },
        { id: 'outlook', label: t('addToCalendar.outlook'), href: outlookCalendarUrl(event) },
        {
          id: 'ics',
          label: t('addToCalendar.other'),
          onAction: () => {
            downloadFile(
              `reserva-${reservation.code}.ics`,
              ics(tenant, [reservation], [facility]),
              'text/calendar',
            );
          },
        },
      ]}
    />
  );
}
