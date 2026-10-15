// SPDX-License-Identifier: EUPL-1.2
import { createContext, use } from 'react';
import type { Tenant } from '../domain/types';

/** Name shown in the header and appended to every page title. */
export const SiteContext = createContext({ name: '' });
export const useSite = () => use(SiteContext);

export const TenantContext = createContext<Tenant | null>(null);

export function useCurrentTenant(): Tenant {
  const tenant = use(TenantContext);
  if (!tenant) throw new Error('useCurrentTenant must be used inside a tenant route');
  return tenant;
}
