// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import styles from './Pending.module.css';

interface QueryState {
  isError: boolean;
  refetch: () => unknown;
}

/**
 * Stands in for content that has not arrived: space kept for it while it loads, so the page
 * does not jump, or a way to try again if it failed.
 */
export function Pending({
  queries = [],
  label,
  size = 'block',
}: {
  queries?: QueryState[];
  /** What is loading, for screen readers; «Cargando…» by default. */
  label?: string;
  size?: 'line' | 'block' | 'section';
}) {
  const { t } = useTranslation();
  const failed = queries.filter((query) => query.isError);

  if (failed.length > 0) {
    return (
      <div className={styles.error} role="alert">
        <p>
          <Icon name="error" />
          {t('error.inline')}
        </p>
        <Button
          onPress={() => {
            for (const query of failed) void query.refetch();
          }}
        >
          <Icon name="refresh" />
          {t('error.retry')}
        </Button>
      </div>
    );
  }

  return (
    <div className={styles.loading} data-size={size} aria-busy="true">
      <span className="visually-hidden">{label ?? t('loading')}</span>
    </div>
  );
}
