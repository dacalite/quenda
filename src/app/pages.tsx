// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/Button';
import { Link } from '../ui/Link';
import { Page } from './Page';

export function NotFoundPage() {
  const { t } = useTranslation();
  return (
    <Page title={t('notFound.title')}>
      <p>{t('notFound.body')}</p>
      <p>
        <Link href="/">{t('notFound.home')}</Link>
      </p>
    </Page>
  );
}

export function ErrorPage({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Page title={t('error.title')}>
      <p>{t('error.body')}</p>
      <p>
        <Button variant="primary" onPress={onRetry}>
          {t('error.retry')}
        </Button>
      </p>
    </Page>
  );
}
