// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';

export function AdminHome() {
  const { t } = useTranslation();
  return (
    <Page title={t('admin.home.title')}>
      <p>{t('admin.home.intro')}</p>
    </Page>
  );
}
