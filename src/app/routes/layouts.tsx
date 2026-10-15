// SPDX-License-Identifier: EUPL-1.2
import { useEffect } from 'react';
import { RouterProvider as AriaRouterProvider } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { Navigate, Outlet, useHref, useNavigate, useParams } from 'react-router';
import { APP_DISPLAY_NAME } from '../../config/app';
import { NotFoundError } from '../../data/ports/errors';
import { DEPUTACION } from '../../data/seed/catalog';
import { DemoBar } from '../../features/demo/DemoBar';
import { accessibleColor } from '../../ui/contrast';
import { SkipLink } from '../../ui/SkipLink';
import { TenantContext } from '../contexts';
import { ErrorPage, NotFoundPage } from '../pages';
import { useTenantBySlug, useTenants } from '../queries';
import { SiteFrame } from '../SiteFrame';
import { useDemo, usePreferences } from '../state';
import { DEPUTACION_PATH, roleHome } from './paths';

function useApplyPreferences() {
  const { textSize, highContrast, reducedMotion } = usePreferences();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.textSize = textSize;
    root.dataset.contrast = highContrast ? 'high' : 'normal';
    root.dataset.motion = reducedMotion ? 'reduced' : 'normal';
  }, [textSize, highContrast, reducedMotion]);
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
      useHref={useHref}
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

function LoadingFrame() {
  const { t } = useTranslation();
  return (
    <SiteFrame name={APP_DISPLAY_NAME} homeHref="/">
      <p aria-busy="true">{t('loading')}</p>
    </SiteFrame>
  );
}

export function TenantLayout() {
  const { tenantSlug = '' } = useParams();
  const tenant = useTenantBySlug(tenantSlug);
  const setTenantId = useDemo((state) => state.setTenantId);
  const primaryColor = tenant.data?.primaryColor;

  useEffect(() => {
    if (tenant.data) setTenantId(tenant.data.id);
  }, [tenant.data, setTenantId]);

  useEffect(() => {
    if (!primaryColor) return;
    const root = document.documentElement;
    root.style.setProperty('--tenant-primary', accessibleColor(primaryColor));
    return () => {
      root.style.removeProperty('--tenant-primary');
    };
  }, [primaryColor]);

  if (tenant.isPending) return <LoadingFrame />;
  if (tenant.isError) {
    return (
      <SiteFrame name={APP_DISPLAY_NAME} homeHref="/">
        {tenant.error instanceof NotFoundError ? (
          <NotFoundPage />
        ) : (
          <ErrorPage onRetry={() => void tenant.refetch()} />
        )}
      </SiteFrame>
    );
  }

  return (
    <TenantContext value={tenant.data}>
      <SiteFrame
        name={tenant.data.name}
        emblem={tenant.data.emblem}
        homeHref={`/${tenant.data.slug}`}
      >
        <Outlet />
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
