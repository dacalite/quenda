// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import { LEGAL_PAGES } from '../../app/routes/paths';
import { useLocalized } from '../../i18n/labels';
import { useCitizen } from './queries';

export function LegalPage({ page }: { page: keyof typeof LEGAL_PAGES }) {
  const { t } = useTranslation('citizen');
  const { tenant } = useCitizen();
  const localized = useLocalized();
  const key = LEGAL_PAGES[page];
  return (
    <Page title={t(`legal.${key}`)}>
      <p>{localized(tenant.legal[key])}</p>
    </Page>
  );
}
