// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import styles from './StatList.module.css';

export interface Stat {
  label: string;
  value: string;
  /** Extra context under the figure, e.g. «de 120 previstas». */
  detail?: ReactNode;
}

/** Key figures as cards; a description list, so each value is read with its label. */
export function StatList({ stats }: { stats: Stat[] }) {
  return (
    <dl className={styles.list}>
      {stats.map((stat) => (
        <div key={stat.label} className={styles.stat}>
          <dt className={styles.label}>{stat.label}</dt>
          <dd className={styles.value}>{stat.value}</dd>
          {stat.detail && <dd className={styles.detail}>{stat.detail}</dd>}
        </div>
      ))}
    </dl>
  );
}
