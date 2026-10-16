// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { deputacionPaths } from '../../app/routes/paths';
import { SiteNav } from '../../app/SiteNav';

export function DeputacionNav() {
  const { t } = useTranslation('deputacion');
  return (
    <SiteNav
      label={t('nav.label')}
      items={[
        { href: deputacionPaths.home, label: t('nav.home') },
        { href: deputacionPaths.newCouncil, label: t('nav.newCouncil') },
      ]}
      session={<span>{t('nav.session')}</span>}
    />
  );
}
