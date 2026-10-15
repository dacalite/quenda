// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import {
  Dialog as AriaDialog,
  Heading,
  Modal as AriaModal,
  ModalOverlay,
  type ModalOverlayProps,
} from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { Button } from './Button';
import type { ButtonVariant } from './buttonClass';
import styles from './Dialog.module.css';
import { Icon } from './Icon';

export { DialogTrigger } from 'react-aria-components';

export interface ModalProps extends Omit<ModalOverlayProps, 'children' | 'className'> {
  title: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode | ((close: () => void) => ReactNode);
}

/** Modal dialog: traps focus, closes with Esc and returns focus to whatever opened it. */
export function Modal({
  title,
  role = 'dialog',
  children,
  isDismissable = true,
  ...props
}: ModalProps) {
  const { t } = useTranslation('ui');
  return (
    <ModalOverlay {...props} isDismissable={isDismissable} className={styles.overlay}>
      <AriaModal className={styles.modal}>
        <AriaDialog role={role} className={styles.dialog}>
          {({ close }) => (
            <>
              <div className={styles.header}>
                <Heading slot="title" className={styles.title}>
                  {title}
                </Heading>
                <Button variant="quiet" onPress={close} aria-label={t('dialog.close')}>
                  <Icon name="close" />
                </Button>
              </div>
              {typeof children === 'function' ? children(close) : children}
            </>
          )}
        </AriaDialog>
      </AriaModal>
    </ModalOverlay>
  );
}

export interface ConfirmDialogProps extends Omit<ModalProps, 'children' | 'role'> {
  children: ReactNode;
  confirmLabel: string;
  onConfirm: () => void;
  tone?: Extract<ButtonVariant, 'primary' | 'danger'>;
}

export function ConfirmDialog({
  children,
  confirmLabel,
  onConfirm,
  tone = 'primary',
  ...props
}: ConfirmDialogProps) {
  const { t } = useTranslation('ui');
  return (
    <Modal {...props} role="alertdialog">
      {(close) => (
        <>
          <div>{children}</div>
          <div className={styles.actions}>
            <Button onPress={close}>{t('confirm.cancel')}</Button>
            <Button
              variant={tone}
              onPress={() => {
                onConfirm();
                close();
              }}
            >
              {confirmLabel}
            </Button>
          </div>
        </>
      )}
    </Modal>
  );
}
