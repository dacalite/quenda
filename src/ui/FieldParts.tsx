// SPDX-License-Identifier: EUPL-1.2
import { FieldError, Label, Text } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import styles from './fields.module.css';
import { Icon } from './Icon';

export function FieldLabel({ children, isRequired }: { children: string; isRequired?: boolean }) {
  const { t } = useTranslation('ui');
  return (
    <Label className={styles.label}>
      {children}
      {/* aria-required already tells screen readers; this is the visible cue. */}
      {isRequired && (
        <span className={styles.required} aria-hidden="true">{` (${t('field.required')})`}</span>
      )}
    </Label>
  );
}

export function FieldHelp({
  description,
  errorMessage,
}: {
  description?: string | undefined;
  errorMessage?: string | undefined;
}) {
  return (
    <>
      {description && (
        <Text slot="description" className={styles.description}>
          {description}
        </Text>
      )}
      <FieldError className={styles.error}>
        <Icon name="error" />
        {errorMessage}
      </FieldError>
    </>
  );
}
