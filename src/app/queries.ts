// SPDX-License-Identifier: EUPL-1.2
import { useQuery } from '@tanstack/react-query';
import { useRepositories } from './repositories';

export function useTenants() {
  const repositories = useRepositories();
  return useQuery({ queryKey: ['tenants'], queryFn: () => repositories.tenants.list() });
}

export function useTenantBySlug(slug: string) {
  const repositories = useRepositories();
  return useQuery({
    queryKey: ['tenants', 'slug', slug],
    queryFn: () => repositories.tenants.getBySlug(slug),
  });
}
