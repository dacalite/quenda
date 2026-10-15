// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import styles from './feedback.module.css';
import { Icon } from './Icon';
import { TONE_ICONS, type Tone } from './tones';

/** Status shown with colour, icon and text together: never colour alone. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className={styles.badge} data-tone={tone}>
      <Icon name={TONE_ICONS[tone]} size="1em" />
      {children}
    </span>
  );
}
