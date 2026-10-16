// SPDX-License-Identifier: EUPL-1.2
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCurrentTenant } from '../../app/contexts';
import { useRepositories } from '../../app/repositories';
import { sessionUserId, useDemo } from '../../app/state';
import { ForbiddenError } from '../../data/ports/errors';
import type { ReservationInput, UserInput } from '../../data/ports/repositories';
import type { Holder, Id, IsoDate } from '../../domain/types';

/** The resident signed in to this council, if any. */
export function useCitizen() {
  const tenant = useCurrentTenant();
  const demo = useDemo();
  const userId = sessionUserId({ ...demo, tenantId: tenant.id });
  const holder: Holder | null = userId ? { kind: 'user', userId } : null;
  return { tenant, userId, holder, signedIn: demo.role === 'citizen' && Boolean(userId) };
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

export function useRecommendations(facilityId: Id, date: IsoDate) {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  return useQuery({
    queryKey: ['recommendations', tenant.id, facilityId, date],
    queryFn: () => repositories.facilities.recommendations(tenant.id, facilityId, date),
  });
}

export function useMyReservations() {
  const repositories = useRepositories();
  const { tenant, holder, userId } = useCitizen();
  return useQuery({
    queryKey: ['reservations', tenant.id, 'mine', userId],
    queryFn: holder ? () => repositories.reservations.list(tenant.id, { holder }) : skipToken,
  });
}

export function useReservation(reservationId: Id) {
  const repositories = useRepositories();
  const { tenant, userId } = useCitizen();
  return useQuery({
    queryKey: ['reservations', tenant.id, reservationId, userId],
    queryFn:
      userId && reservationId
        ? () => repositories.reservations.get(tenant.id, reservationId)
        : skipToken,
  });
}

export function useQuote(input: ReservationInput | null, replaces?: Id) {
  const repositories = useRepositories();
  const { tenant, userId } = useCitizen();
  return useQuery({
    queryKey: ['quote', tenant.id, userId, input, replaces],
    queryFn:
      input && userId
        ? () => repositories.reservations.quote(tenant.id, input, replaces)
        : skipToken,
  });
}

export function useNotifications() {
  const repositories = useRepositories();
  const { tenant, userId } = useCitizen();
  return useQuery({
    queryKey: ['notifications', tenant.id, userId],
    queryFn: userId ? () => repositories.notifications.list(tenant.id, userId) : skipToken,
  });
}

export function useMe() {
  const repositories = useRepositories();
  const { tenant, userId } = useCitizen();
  return useQuery({
    queryKey: ['users', tenant.id, userId],
    queryFn: userId ? () => repositories.users.get(tenant.id, userId) : skipToken,
  });
}

/** Everything that depends on bookings, refreshed after any change. */
function useInvalidateBookings() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all(
      ['reservations', 'availability', 'recommendations', 'notifications', 'quote'].map((key) =>
        queryClient.invalidateQueries({ queryKey: [key] }),
      ),
    );
}

export function useBook() {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: ({ input, replaces }: { input: ReservationInput; replaces?: Id | undefined }) => {
      const { holder: _holder, channel: _channel, notes: _notes, ...slot } = input;
      return replaces
        ? repositories.reservations.reschedule(tenant.id, replaces, slot)
        : repositories.reservations.create(tenant.id, input);
    },
    onSettled: invalidate,
  });
}

export function useCancel() {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const invalidate = useInvalidateBookings();
  return useMutation({
    mutationFn: (reservationId: Id) => repositories.reservations.cancel(tenant.id, reservationId),
    onSettled: invalidate,
  });
}

export function useMarkRead() {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: Id[]) =>
      Promise.all(ids.map((id) => repositories.notifications.markRead(tenant.id, id))),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useUpdateMe() {
  const repositories = useRepositories();
  const { tenant, userId } = useCitizen();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<UserInput>) => {
      if (!userId) throw new ForbiddenError();
      return repositories.users.update(tenant.id, userId, patch);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  });
}
