// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';

export function DeputacionHome() {
  const { t } = useTranslation();
  return (
    <Page title={t('deputacion.home.title')}>
      <p>{t('deputacion.home.intro')}</p>
    </Page>
  );
}
