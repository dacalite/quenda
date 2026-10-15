// SPDX-License-Identifier: EUPL-1.2
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'quiet';

export const buttonClass = (variant: ButtonVariant, className?: string) =>
  [styles.button, styles[variant], className].filter(Boolean).join(' ');
