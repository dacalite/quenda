// SPDX-License-Identifier: EUPL-1.2
import { createContext, use, useCallback, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useAnnounce } from './announcer';
import { Button } from './Button';
import styles from './feedback.module.css';
import { Icon } from './Icon';
import { TONE_ICONS, type Tone } from './tones';

interface Toast {
  id: number;
  tone: Tone;
  message: string;
}

type ShowToast = (message: string, tone?: Tone) => void;

const ToastContext = createContext<ShowToast>(() => undefined);

let nextId = 0;

/** Visible confirmations. They stay until dismissed (no time limits) and are read out once. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation('ui');
  const announce = useAnnounce();
  const [toasts, setToasts] = useState<Toast[]>([]);

  const show = useCallback<ShowToast>(
    (message, tone = 'success') => {
      nextId += 1;
      setToasts((current) => [...current.slice(-2), { id: nextId, tone, message }]);
      announce(message, tone === 'danger' ? 'assertive' : 'polite');
    },
    [announce],
  );

  return (
    <ToastContext value={show}>
      {children}
      {toasts.length > 0 && (
        <section aria-label={t('toast.region')} className={styles.toasts}>
          {toasts.map((toast) => (
            <div key={toast.id} className={styles.toast} data-tone={toast.tone}>
              <Icon name={TONE_ICONS[toast.tone]} />
              <p className={styles.toastMessage}>{toast.message}</p>
              <Button
                variant="quiet"
                aria-label={t('toast.dismiss')}
                onPress={() => {
                  setToasts((current) => current.filter((item) => item.id !== toast.id));
                }}
              >
                <Icon name="close" />
              </Button>
            </div>
          ))}
        </section>
      )}
    </ToastContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- the hook belongs with its provider
export const useToast = () => use(ToastContext);
