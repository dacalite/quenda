// SPDX-License-Identifier: EUPL-1.2
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from '../ui/Button';
import { Icon } from '../ui/Icon';
import { Link } from '../ui/Link';
import styles from './SiteNav.module.css';

export interface NavItem {
  href: string;
  label: string;
  /** Short status shown next to the label, e.g. unread notices. */
  badge?: string | undefined;
}

/** Main navigation: a list on wide screens, a disclosure menu on narrow ones. */
export function SiteNav({
  label,
  items,
  session,
}: {
  label: string;
  items: NavItem[];
  session?: ReactNode;
}) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const listId = useId();
  // The deepest section that contains this page, so a facility's form still marks «Instalacións».
  const current = items
    .map((item) => item.href)
    .filter((href) => pathname === href || pathname.startsWith(`${href}/`))
    .sort((a, b) => b.length - a.length)[0];

  return (
    <nav aria-label={label} className={styles.nav}>
      <Button
        variant="secondary"
        className={styles.toggle}
        aria-expanded={open}
        aria-controls={listId}
        onPress={() => {
          setOpen(!open);
        }}
      >
        <Icon name={open ? 'close' : 'chevronDown'} />
        {t('menu')}
      </Button>
      <ul id={listId} className={styles.list} data-open={open || undefined}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={styles.link}
              aria-current={item.href === current ? 'page' : undefined}
              onPress={() => {
                setOpen(false);
              }}
            >
              {item.label}
              {item.badge && <span className={styles.badge}>{item.badge}</span>}
            </Link>
          </li>
        ))}
        {session && <li className={styles.session}>{session}</li>}
      </ul>
    </nav>
  );
}
