// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import styles from './Card.module.css';

export interface CardProps {
  title: ReactNode;
  headingLevel?: 2 | 3 | 4;
  children?: ReactNode;
  footer?: ReactNode;
  as?: 'div' | 'article' | 'li';
}

export function Card({
  title,
  headingLevel = 2,
  children,
  footer,
  as: Element = 'div',
}: CardProps) {
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3' | 'h4';
  return (
    <Element className={styles.card}>
      <Heading className={styles.title}>{title}</Heading>
      {children && <div className={styles.body}>{children}</div>}
      {footer && <div className={styles.footer}>{footer}</div>}
    </Element>
  );
}
