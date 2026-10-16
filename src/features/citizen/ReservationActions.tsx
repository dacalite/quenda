// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { citizenPaths } from '../../app/routes/paths';
import { resolveRules } from '../../domain/rules/booking';
import { canCancel } from '../../domain/rules/cancellation';
import { zonedNow } from '../../domain/time';
import type { Facility, Reservation } from '../../domain/types';
import { Button } from '../../ui/Button';
import { ConfirmDialog, DialogTrigger, Modal } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import styles from './citizen.module.css';
import { useCancel, useCitizen } from './queries';
import { ReservationQr } from './ReservationQr';

/** Change, cancel and show the QR of a booking, with the cancellation policy stated first. */
export function ReservationActions({
  reservation,
  facility,
  showQr = false,
}: {
  reservation: Reservation;
  facility: Facility;
  showQr?: boolean;
}) {
  const { t } = useTranslation(['citizen', 'common']);
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const toast = useToast();
  const cancel = useCancel();
  const rules = resolveRules(tenant.defaultRules, facility.rules);
  const decision = canCancel(reservation, rules, zonedNow(new Date(), tenant.timeZone));

  if (!decision.ok) return null;

  return (
    <div className={layout.row}>
      {showQr && (
        <DialogTrigger>
          <Button>{t('reservation.showQr')}</Button>
          <Modal title={t('reservation.qrTitle')}>
            <p className={styles.code}>{reservation.code}</p>
            <ReservationQr
              code={reservation.code}
              alt={t('reservation.qrAlt', { code: reservation.code })}
            />
            <p>{t('reservation.qrHelp', { code: reservation.code })}</p>
          </Modal>
        </DialogTrigger>
      )}
      <Link
        variant="secondary"
        href={paths.availability(reservation.facilityId, {
          date: reservation.date,
          subspaceId: reservation.subspaceId,
          replaces: reservation.id,
        })}
      >
        {t('reservation.change')}
      </Link>
      <DialogTrigger>
        <Button variant="danger">
          <Icon name="close" />
          {t('reservation.cancel')}
        </Button>
        <ConfirmDialog
          title={t('reservation.cancelTitle')}
          confirmLabel={t('reservation.cancelConfirm')}
          tone="danger"
          onConfirm={() => {
            // The card may unmount once the booking is cancelled, so the promise carries the result.
            cancel.mutateAsync(reservation.id).then(
              () => {
                toast(t('reservation.cancelled'));
              },
              () => {
                toast(t('common:error.title'), 'danger');
              },
            );
          }}
        >
          <p>
            {decision.late
              ? t('reservation.cancelLate', { count: rules.freeCancellationHours })
              : t('reservation.cancelFree')}
          </p>
        </ConfirmDialog>
      </DialogTrigger>
    </div>
  );
}
