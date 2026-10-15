// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';

export function CitizenHome() {
  const { t } = useTranslation();
  return (
    <Page title={t('citizen.home.title')}>
      <p>{t('citizen.home.intro')}</p>
    </Page>
  );
}
