// SPDX-License-Identifier: EUPL-1.2
import { useEffect } from 'react';
import { RouterProvider as AriaRouterProvider } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useHref, useNavigate, useParams } from 'react-router';
import { APP_DISPLAY_NAME } from '../../config/app';
import { NotFoundError } from '../../data/ports/errors';
import { DEPUTACION } from '../../data/seed/catalog';
import { StaffNav } from '../../features/admin/StaffNav';
import { CitizenNav } from '../../features/citizen/CitizenNav';
import { DemoBar } from '../../features/demo/DemoBar';
import { currentLanguage } from '../../i18n';
import { accessibleColor } from '../../ui/contrast';
import { SkipLink } from '../../ui/SkipLink';
import { TenantContext } from '../contexts';
import { ErrorPage, NotFoundPage } from '../pages';
import { useTenantBySlug, useTenants } from '../queries';
import { SiteFrame } from '../SiteFrame';
import { useDemo, usePreferences } from '../state';
import { citizenPaths, DEPUTACION_PATH, LEGAL_PAGES, roleHome } from './paths';

function useApplyPreferences() {
  const { textSize, highContrast, reducedMotion } = usePreferences();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.contrast = highContrast ? 'high' : 'normal';
    root.dataset.motion = reducedMotion ? 'reduced' : 'normal';
  }, [textSize, highContrast, reducedMotion]);
}

// React Router resolves every href against the current route, external URLs included.
function useAppHref(href: string) {
  const internal = useHref(href);
  return /^[a-z][a-z\d+.-]*:/i.test(href) ? href : internal;
}

export function AppShell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useApplyPreferences();

  return (
    <AriaRouterProvider
      navigate={(href) => {
        void navigate(href);
      }}
      useHref={useAppHref}
    >
      <SkipLink targetId="main">{t('skipLink')}</SkipLink>
      <DemoBar />
      <Outlet />
    </AriaRouterProvider>
  );
}

export function RedirectToDemoStart() {
  const tenants = useTenants();
  const role = useDemo((state) => state.role);
  const first = tenants.data?.[0];
  if (first) return <Navigate to={roleHome(role, first.slug)} replace />;
  return <LoadingFrame />;
}

function Loading() {
  const { t } = useTranslation();
  return <p aria-busy="true">{t('loading')}</p>;
}

function LoadingFrame() {
  return (
    <SiteFrame name={APP_DISPLAY_NAME} homeHref="/">
      <Loading />
    </SiteFrame>
  );
}

export function TenantLayout() {
  const { t, i18n } = useTranslation('citizen');
  const { tenantSlug = '' } = useParams();
  const role = useDemo((state) => state.role);
  const tenant = useTenantBySlug(tenantSlug);
  const setTenantId = useDemo((state) => state.setTenantId);
  const primaryColor = tenant.data?.primaryColor;

  useEffect(() => {
    if (tenant.data) setTenantId(tenant.data.id);
  }, [tenant.data, setTenantId]);

  const languages = tenant.data?.languages;
  useEffect(() => {
    const [fallback] = languages ?? [];
    if (fallback && !languages?.includes(currentLanguage())) void i18n.changeLanguage(fallback);
  }, [languages, i18n]);

  useEffect(() => {
    if (!primaryColor) return;
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', accessibleColor(primaryColor));
    return () => {
      root.style.removeProperty('--tenant-primary');
    };
  }, [primaryColor]);

  // One frame for every state, so the header is not remounted when the council finishes loading.
  return (
    <TenantContext value={tenant.data ?? null}>
      <SiteFrame
        name={tenant.data?.name ?? APP_DISPLAY_NAME}
        emblem={tenant.data?.emblem}
        homeHref={tenant.data ? `/${tenant.data.slug}` : '/'}
        nav={
          tenant.data ? (
            role === 'citizen' ? (
              <CitizenNav />
            ) : role === 'staff' ? (
              <StaffNav />
            ) : undefined
          ) : undefined
        }
        footerLabel={t('legal.nav')}
        footerLinks={
          tenant.data
            ? (Object.keys(LEGAL_PAGES) as (keyof typeof LEGAL_PAGES)[]).map((page) => ({
                href: citizenPaths(tenantSlug).legal(page),
                label: t(`legal.${LEGAL_PAGES[page]}`),
              }))
            : []
        }
      >
        {tenant.isPending ? (
          <Loading />
        ) : tenant.isError ? (
          tenant.error instanceof NotFoundError ? (
            <NotFoundPage />
          ) : (
            <ErrorPage onRetry={() => void tenant.refetch()} />
          )
        ) : (
          <Outlet />
        )}
      </SiteFrame>
    </TenantContext>
  );
}

export function DeputacionLayout() {
  return (
    <SiteFrame name={DEPUTACION.name} homeHref={`/${DEPUTACION_PATH}`}>
      <Outlet />
    </SiteFrame>
  );
}
