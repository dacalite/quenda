// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams, useSearchParams } from 'react-router';
import { NotFoundPage } from '../../app/pages';
import { Page } from '../../app/Page';
import { citizenPaths, safeReturnPath } from '../../app/routes/paths';
import { useDemo } from '../../app/state';
import { PERSONAS } from '../../data/seed/catalog';
import { Button } from '../../ui/Button';
import { Link } from '../../ui/Link';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import { useCitizen } from './queries';

const PROVIDERS = { clave: 'Cl@ve', chave365: 'Chave365' } as const;

export function SignIn() {
  const { t } = useTranslation('citizen');
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const [params] = useSearchParams();
  const back = safeReturnPath(params.get('volver'), paths.home);

  return (
    <Page title={t('signIn.title')}>
      <p>{t('signIn.intro')}</p>
      <div className={layout.row}>
        <Link href={paths.provider('clave', back)} variant="primary">
          {t('signIn.clave')}
        </Link>
        <Link href={paths.provider('chave365', back)} variant="primary">
          {t('signIn.chave365')}
        </Link>
      </div>
      <section className={layout.panel} aria-labelledby="sign-in-how">
        <h2 id="sign-in-how">{t('signIn.howItWorks')}</h2>
        <p>{t('signIn.howItWorksBody')}</p>
      </section>
    </Page>
  );
}

export function IdentityProvider() {
  const { t } = useTranslation('citizen');
  const { provider = '' } = useParams();
  const { tenant } = useCitizen();
  const paths = citizenPaths(tenant.slug);
  const [params] = useSearchParams();
  const back = safeReturnPath(params.get('volver'), paths.home);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const demo = useDemo();

  if (!(provider in PROVIDERS)) return <NotFoundPage />;
  const persona = PERSONAS.find((p) => p.key === demo.citizen);
  const name = persona ? `${persona.firstName} ${persona.lastName}` : '';

  return (
    <Page
      title={t('signIn.providerTitle', { provider: PROVIDERS[provider as keyof typeof PROVIDERS] })}
    >
      <p>{t('signIn.providerIntro')}</p>
      <div className={layout.row}>
        <Button
          variant="primary"
          onPress={() => {
            demo.setRole('citizen');
            demo.setSignedIn(true);
            void queryClient.invalidateQueries();
            toast(t('signIn.signedIn', { name }));
            void navigate(back);
          }}
        >
          {t('signIn.continueAs', { name })}
        </Button>
        <Link href={paths.signIn(back)}>{t('signIn.cancel')}</Link>
      </div>
    </Page>
  );
}
