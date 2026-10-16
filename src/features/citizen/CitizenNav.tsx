// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate } from 'react-router';
import { citizenPaths } from '../../app/routes/paths';
import { SiteNav } from '../../app/SiteNav';
import { useDemo } from '../../app/state';
import { Button } from '../../ui/Button';
import { Link } from '../../ui/Link';
import { useToast } from '../../ui/toasts';
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

  return (
    <SiteNav
      label={t('nav.label')}
      items={[
        { href: paths.home, label: t('nav.home') },
        { href: paths.facilities(), label: t('nav.facilities') },
        ...(signedIn
          ? [
              { href: paths.reservations, label: t('nav.reservations') },
              {
                href: paths.notifications,
                label: t('nav.notifications'),
                badge: unread > 0 ? t('nav.unread', { count: unread }) : undefined,
              },
              { href: paths.calendar, label: t('nav.calendar') },
              { href: paths.profile, label: t('nav.profile') },
            ]
          : []),
      ]}
      session={
        signedIn ? (
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
        )
      }
    />
  );
}
