// SPDX-License-Identifier: EUPL-1.2
import styles from './SkipLink.module.css';

export function SkipLink({ targetId, children }: { targetId: string; children: string }) {
  return (
    <a className={styles.skipLink} href={`#${targetId}`}>
      {children}
    </a>
  );
}
