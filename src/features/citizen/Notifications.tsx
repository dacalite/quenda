// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import { citizenPaths } from '../../app/routes/paths';
import type { NotificationChannel } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import { Icon } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import { StatusBadge } from '../../ui/StatusBadge';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import {
  useCitizen,
  useMarkRead,
  useMe,
  useMyReservations,
  useNotifications,
  useUpdateMe,
} from './queries';

const OPTIONAL_CHANNELS: NotificationChannel[] = ['email', 'sms'];

export function Notifications() {
  const { t } = useTranslation(['citizen', 'domain', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const format = useFormat();
  const notifications = useNotifications();
  const reservations = useMyReservations();
  const facilities = useFacilities();
  const markRead = useMarkRead();
  const unread = (notifications.data ?? []).filter((n) => !n.readAt);

  return (
    <Page title={t('notifications.title')}>
      {unread.length > 0 && (
        <p>
          <Button
            onPress={() => {
              markRead.mutate(unread.map((n) => n.id));
            }}
          >
            {t('notifications.markAll')}
          </Button>
        </p>
      )}
      {!notifications.data ? (
        <Pending queries={[notifications]} size="section" />
      ) : notifications.data.length === 0 ? (
        <p>{t('notifications.empty')}</p>
      ) : (
        <ul className={layout.stack}>
          {notifications.data.map((notification) => {
            const reservation = reservations.data?.find((r) => r.id === notification.reservationId);
            const facility = facilities.data?.find((f) => f.id === reservation?.facilityId);
            const reason = reservation?.history.findLast((e) => e.type === 'cancelled')?.detail;
            return (
              <li
                key={notification.id}
                className={styles.notification}
                data-unread={notification.readAt ? undefined : true}
              >
                <div className={layout.row}>
                  <h2 id={`notice-${notification.id}`} tabIndex={-1} className={styles.noticeTitle}>
                    {t(`domain:notificationType.${notification.type}`)}
                  </h2>
                  {!notification.readAt && (
                    <StatusBadge tone="info">{t('notifications.unread')}</StatusBadge>
                  )}
                  <span className={layout.meta}>{format.dateTime(notification.createdAt)}</span>
                </div>
                {reservation && facility && (
                  <>
                    <p>
                      {t(`notifications.message.${notification.type}`, {
                        facility: facility.name,
                        date: format.longDate(reservation.date),
                        time: reservation.start,
                        reason: reason ?? t('notifications.noReason'),
                      })}
                    </p>
                    <p className={layout.row}>
                      {notification.type === 'councilNotice' ? (
                        <Link
                          variant="primary"
                          href={paths.availability(facility.id, {
                            date: reservation.date,
                            subspaceId: reservation.subspaceId,
                          })}
                        >
                          {t('notifications.relocate')}
                        </Link>
                      ) : (
                        <Link href={paths.reservation(reservation.id)}>
                          {t('notifications.view')}
                        </Link>
                      )}
                      {!notification.readAt && (
                        <MarkOneRead id={notification.id} titleId={`notice-${notification.id}`} />
                      )}
                    </p>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
      <ChannelSettings />
    </Page>
  );
}

/** Once read, the button goes away: focus moves to the notice so it is not lost. */
function MarkOneRead({ id, titleId }: { id: string; titleId: string }) {
  const { t } = useTranslation('citizen');
  const markRead = useMarkRead();
  return (
    <Button
      variant="quiet"
      aria-describedby={titleId}
      isDisabled={markRead.isPending}
      onPress={() => {
        markRead.mutate([id], {
          onSuccess: () => {
            document.getElementById(titleId)?.focus();
          },
        });
      }}
    >
      <Icon name="check" />
      {t('notifications.markOne')}
    </Button>
  );
}

function ChannelSettings() {
  const { t } = useTranslation(['citizen', 'domain']);
  const me = useMe();
  const update = useUpdateMe();
  const toast = useToast();
  const [channels, setChannels] = useState<NotificationChannel[] | null>(null);
  const user = me.data;
  if (!user) return null;
  const current = channels ?? user.preferences.channels;

  return (
    <form
      className={layout.panel}
      aria-labelledby="channels-title"
      onSubmit={(event) => {
        event.preventDefault();
        update.mutate(
          {
            preferences: {
              ...user.preferences,
              channels: ['app', ...current.filter((c) => c !== 'app')],
            },
          },
          {
            onSuccess: () => {
              toast(t('notifications.saved'));
            },
          },
        );
      }}
    >
      <h2 id="channels-title">{t('notifications.settingsTitle')}</h2>
      <p>{t('notifications.settingsIntro')}</p>
      <p>
        <StatusBadge tone="success">{t('domain:notificationChannel.app')}</StatusBadge>
      </p>
      {OPTIONAL_CHANNELS.map((channel) => (
        <Checkbox
          key={channel}
          isSelected={current.includes(channel)}
          onChange={(selected) => {
            setChannels(selected ? [...current, channel] : current.filter((c) => c !== channel));
          }}
        >
          {t(`domain:notificationChannel.${channel}`)}
        </Checkbox>
      ))}
      <p>
        <Button type="submit">{t('notifications.save')}</Button>
      </p>
    </form>
  );
}
