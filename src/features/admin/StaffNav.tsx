// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { adminPaths } from '../../app/routes/paths';
import { SiteNav } from '../../app/SiteNav';
import { useStaff } from './queries';

export function StaffNav() {
  const { t } = useTranslation(['admin', 'common']);
  const { tenant, isAdmin } = useStaff();
  const paths = adminPaths(tenant.slug);

  return (
    <SiteNav
      label={t('nav.label')}
      variant="menu"
      items={[
        { href: paths.home, label: t('nav.home') },
        { href: paths.agenda(), label: t('nav.agenda') },
        { href: paths.newBooking(), label: t('nav.newBooking') },
        { href: paths.access, label: t('nav.access') },
        ...(isAdmin
          ? [
              { href: paths.facilities, label: t('nav.facilities') },
              { href: paths.blocks, label: t('nav.blocks') },
              { href: paths.seasons, label: t('nav.seasons') },
            ]
          : []),
        { href: paths.indicators, label: t('nav.indicators') },
        ...(isAdmin
          ? [
              { href: paths.settings, label: t('nav.settings') },
              { href: paths.activity, label: t('nav.activity') },
            ]
          : []),
      ]}
    />
  );
}

export function StaffSession() {
  const { t } = useTranslation('admin');
  const { isAdmin, name } = useStaff();
  return (
    <span>{t('nav.session', { name, role: t(isAdmin ? 'nav.roleAdmin' : 'nav.roleStaff') })}</span>
  );
}
