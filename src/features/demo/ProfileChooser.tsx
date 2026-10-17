// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import { Pending } from '../../app/Pending';
import { useTenants } from '../../app/queries';
import { roleHome } from '../../app/routes/paths';
import { SiteFrame } from '../../app/SiteFrame';
import { useDemo } from '../../app/state';
import { APP_DISPLAY_NAME } from '../../config/app';
import { RoleCards } from './RoleCards';

/** The way into the demo: pick whose eyes to see it with. */
export function ProfileChooser() {
  const { t } = useTranslation('demo');
  const queryClient = useQueryClient();
  const tenants = useTenants();
  const setRole = useDemo((state) => state.setRole);
  const first = tenants.data?.[0];

  return (
    <SiteFrame name={APP_DISPLAY_NAME} homeHref="/">
      {first ? (
        <Page title={t('chooser.title')}>
          <p>{t('chooser.intro')}</p>
          <RoleCards
            headingLevel={2}
            hrefOf={(role) => roleHome(role, first.slug)}
            onChoose={(role) => {
              setRole(role);
              void queryClient.invalidateQueries();
            }}
          />
        </Page>
      ) : (
        <Pending queries={[tenants]} size="section" />
      )}
    </SiteFrame>
  );
}
