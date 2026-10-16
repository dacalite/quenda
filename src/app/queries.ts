// SPDX-License-Identifier: EUPL-1.2
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Id, IsoDate } from '../domain/types';
import { useCurrentTenant } from './contexts';
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

export function useFacilities() {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  return useQuery({
    queryKey: ['facilities', tenant.id],
    queryFn: () => repositories.facilities.list(tenant.id),
  });
}

export function useFacility(facilityId: Id) {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  return useQuery({
    queryKey: ['facilities', tenant.id, facilityId],
    queryFn: () => repositories.facilities.get(tenant.id, facilityId),
  });
}

export function useSchedule(facilityId: Id) {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  return useQuery({
    queryKey: ['schedule', tenant.id, facilityId],
    queryFn: () => repositories.schedules.get(tenant.id, facilityId),
  });
}

export function useAvailabilityQuery() {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  return (facilityId: Id, date: IsoDate) => ({
    queryKey: ['availability', tenant.id, facilityId, date],
    queryFn: () => repositories.facilities.availability(tenant.id, facilityId, date),
  });
}

export function useAvailability(facilityId: Id, date: IsoDate) {
  return useQuery(useAvailabilityQuery()(facilityId, date));
}

/** Everything that depends on bookings, refreshed after any change. */
export function useInvalidateBookings() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['reservations', 'availability', 'recommendations', 'notifications', 'quote'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}
