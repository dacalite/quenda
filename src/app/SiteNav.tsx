// SPDX-License-Identifier: EUPL-1.2
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { Button } from '../ui/Button';
import { Icon, type IconName } from '../ui/Icon';
import { Link } from '../ui/Link';
import styles from './SiteNav.module.css';

export interface NavItem {
  href: string;
  label: string;
  icon?: IconName;
  /** Short status shown next to the label, e.g. unread notices: the count, and how it is read out. */
  badge?: { value: string; label: string } | undefined;
  /** Left out of the residents' tab bar on small screens; the page offers another way there. */
  secondary?: boolean;
}

/**
 * Main navigation. Residents get a tab bar at the bottom of small screens; staff, a disclosure
 * menu. On wide screens both are a row under the site name.
 */
export function SiteNav({
  label,
  items,
  variant,
}: {
  label: string;
  items: NavItem[];
  variant: 'tabs' | 'menu';
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
    <nav aria-label={label} className={styles.nav} data-variant={variant}>
      {variant === 'menu' && (
        <Button
          variant="secondary"
          className={styles.toggle}
          aria-expanded={open}
          aria-controls={listId}
          onPress={() => {
            setOpen(!open);
          }}
        >
          <Icon name={open ? 'close' : 'menu'} />
          {t('menu')}
        </Button>
      )}
      <ul id={listId} className={styles.list} data-open={open || undefined}>
        {items.map((item) => (
          <li key={item.href} data-secondary={item.secondary || undefined}>
            <Link
              href={item.href}
              className={styles.link}
              aria-current={item.href === current ? 'page' : undefined}
              onPress={() => {
                setOpen(false);
              }}
            >
              {item.icon && <Icon name={item.icon} />}
              <span className={styles.label}>{item.label}</span>
              {item.badge && (
                <span className={styles.badge}>
                  <span aria-hidden="true">{item.badge.value}</span>
                  <span className="visually-hidden">{item.badge.label}</span>
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
