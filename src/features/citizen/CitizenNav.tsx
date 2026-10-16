// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { citizenPaths } from '../../app/routes/paths';
import { useDemo } from '../../app/state';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import { useToast } from '../../ui/toasts';
import styles from './CitizenNav.module.css';
import { useCitizen, useMe, useNotifications } from './queries';

export function CitizenNav() {
  const { t } = useTranslation('citizen');
  const { tenant, signedIn } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const setSignedIn = useDemo((state) => state.setSignedIn);
  const me = useMe();
  const unread = (useNotifications().data ?? []).filter((n) => !n.readAt).length;
  const [open, setOpen] = useState(false);
  const listId = useId();

  const items = [
    { href: paths.home, label: t('nav.home') },
    { href: paths.facilities(), label: t('nav.facilities') },
    ...(signedIn
      ? [
          { href: paths.reservations, label: t('nav.reservations') },
          {
            href: paths.notifications,
            label: t('nav.notifications'),
            extra: unread > 0 ? t('nav.unread', { count: unread }) : undefined,
          },
          { href: paths.calendar, label: t('nav.calendar') },
          { href: paths.profile, label: t('nav.profile') },
        ]
      : []),
  ];

  return (
    <nav aria-label={t('nav.label')} className={styles.nav}>
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
        {t('nav.menu')}
      </Button>
      <ul id={listId} className={styles.list} data-open={open || undefined}>
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={styles.link}
              aria-current={pathname === item.href ? 'page' : undefined}
              onPress={() => {
                setOpen(false);
              }}
            >
              {item.label}
              {item.extra && <span className={styles.badge}>{item.extra}</span>}
            </Link>
          </li>
        ))}
        <li className={styles.session}>
          {signedIn ? (
            <>
              <span>{t('session.greeting', { name: me.data?.firstName ?? '' })}</span>
              <Button
                variant="quiet"
                onPress={() => {
                  setSignedIn(false);
                  void queryClient.invalidateQueries();
                  toast(t('session.signedOut'));
                  void navigate(paths.home);
                }}
              >
                {t('session.signOut')}
              </Button>
            </>
          ) : (
            <Link href={paths.signIn(pathname)} variant="primary">
              {t('session.signIn')}
            </Link>
          )}
        </li>
      </ul>
    </nav>
  );
}
