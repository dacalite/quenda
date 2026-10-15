// SPDX-License-Identifier: EUPL-1.2
import { useEffect, useId, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './feedback.module.css';
import { Icon } from './Icon';

export interface FormError {
  /** Id of the input the message refers to. */
  fieldId: string;
  message: string;
}

/** Listed at the top of a form after a failed submit; takes focus so the errors are read first. */
export function ErrorSummary({ errors }: { errors: FormError[] }) {
  const { t } = useTranslation('ui');
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    if (errors.length > 0) ref.current?.focus();
  }, [errors]);

  if (errors.length === 0) return null;

  return (
    <div ref={ref} tabIndex={-1} className={styles.summary} aria-labelledby={titleId}>
      <h2 id={titleId} className={styles.summaryTitle}>
        <Icon name="error" />
        {t('errorSummary.title', { count: errors.length })}
      </h2>
      <ul>
        {errors.map((error) => (
          <li key={error.fieldId}>
            <a
              href={`#${error.fieldId}`}
              onClick={(event) => {
                const field = document.getElementById(error.fieldId);
                if (!field) return;
                event.preventDefault();
                field.focus();
                field.scrollIntoView({ block: 'center' });
              }}
            >
              {error.message}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
