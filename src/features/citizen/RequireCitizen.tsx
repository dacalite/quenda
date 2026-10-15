// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router';
import { citizenPaths, roleHome } from '../../app/routes/paths';
import { useDemo } from '../../app/state';
import { useCitizen } from './queries';

/** Personal pages: residents only, signed in through the simulated identity gateway. */
export function RequireCitizen({ children }: { children: ReactNode }) {
  const role = useDemo((state) => state.role);
  const { tenant, signedIn } = useCitizen();
  const { pathname, search } = useLocation();
  if (role !== 'citizen') return <Navigate to={roleHome(role, tenant.slug)} replace />;
  if (!signedIn) {
    return <Navigate to={citizenPaths(tenant.slug).signIn(`${pathname}${search}`)} replace />;
  }
  return children;
}
