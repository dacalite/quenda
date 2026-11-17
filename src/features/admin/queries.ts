// SPDX-License-Identifier: EUPL-1.2
import { skipToken, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCurrentTenant } from '../../app/contexts';
import { useRepositories } from '../../app/repositories';
import { sessionUserId, useDemo } from '../../app/state';
import type { Repositories } from '../../data/ports/repositories';
import { PERSONAS } from '../../data/seed/catalog';
import type { Holder, Id } from '../../domain/types';

/** The council employee using the tool; the simulated server checks the same role on every call. */
export function useStaff() {
  const tenant = useCurrentTenant();
  const demo = useDemo();
  const persona = PERSONAS.find((p) => p.key === demo.staff);
  return {
    tenant,
    userId: sessionUserId({ ...demo, tenantId: tenant.id }),
    isAdmin: persona?.role === 'admin',
    name: persona ? `${persona.firstName} ${persona.lastName}` : '',
  };
}

/** `run` is `null` while the query cannot be asked yet, e.g. before choosing a person. */
export function useStaffQuery<T>(
  key: readonly unknown[],
  run: ((repositories: Repositories, tenantId: Id) => Promise<T>) | null,
) {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const [resource, ...rest] = key;
  return useQuery({
    queryKey: [resource, tenant.id, 'staff', ...rest],
    queryFn: run ? () => run(repositories, tenant.id) : skipToken,
  });
}

// Staff changes can touch bookings, schedules, notices and the council itself, so every view refreshes.
// The refresh is not awaited: a form that remounts with the new data must still get its callbacks.
export function useStaffMutation<V, R>(
  run: (repositories: Repositories, tenantId: Id, variables: V) => Promise<R>,
) {
  const repositories = useRepositories();
  const tenant = useCurrentTenant();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: V) => run(repositories, tenant.id, variables),
    onSettled: () => {
      void queryClient.invalidateQueries();
    },
  });
}

/** Names of the people and clubs behind bookings, for staff screens. */
/** «Uxía Varela Pena», or «Uxía Varela Pena, para Martiño Rial Varela» when booked for someone in her care. */
export function useHolderName() {
  const { t } = useTranslation('admin');
  const users = useStaffQuery(['users'], (r, tenantId) => r.users.list(tenantId));
  const entities = useStaffQuery(['entities'], (r, tenantId) => r.entities.list(tenantId));
  return (holder: Holder, dependentId?: Id) => {
    if (holder.kind === 'entity') {
      return entities.data?.find((e) => e.id === holder.entityId)?.name ?? '';
    }
    const user = users.data?.find((u) => u.id === holder.userId);
    if (!user) return '';
    const name = `${user.firstName} ${user.lastName}`;
    const dependent = user.dependents.find((d) => d.id === dependentId);
    return dependent
      ? t('holder.forDependent', {
          holder: name,
          dependent: `${dependent.firstName} ${dependent.lastName}`,
        })
      : name;
  };
}
