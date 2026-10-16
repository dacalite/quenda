// SPDX-License-Identifier: EUPL-1.2
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '../../app/repositories';
import type { Repositories } from '../../data/ports/repositories';
import { DEPUTACION } from '../../data/seed/catalog';
import type { Id } from '../../domain/types';

/** Calls made by the deputación shown in the demo; the simulated server checks it on every one. */
export function useDeputacionQuery<T>(
  key: readonly unknown[],
  run: (repositories: Repositories, deputacionId: Id) => Promise<T>,
) {
  const repositories = useRepositories();
  const [resource, ...rest] = key;
  return useQuery({
    queryKey: [resource, DEPUTACION.id, 'deputacion', ...rest],
    queryFn: () => run(repositories, DEPUTACION.id),
  });
}

export function useDeputacionMutation<V, R>(
  run: (repositories: Repositories, deputacionId: Id, variables: V) => Promise<R>,
) {
  const repositories = useRepositories();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: V) => run(repositories, DEPUTACION.id, variables),
    onSettled: () => {
      void queryClient.invalidateQueries();
    },
  });
}
