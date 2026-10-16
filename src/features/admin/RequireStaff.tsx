// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import { Navigate, Outlet } from 'react-router';
import { useCurrentTenant } from '../../app/contexts';
import { adminPaths, roleHome } from '../../app/routes/paths';
import { useDemo } from '../../app/state';
import { useStaff } from './queries';

/** Council tools: staff only. The simulated server enforces the same rule on every call. */
export function RequireStaff() {
  const role = useDemo((state) => state.role);
  const tenant = useCurrentTenant();
  if (role !== 'staff') return <Navigate to={roleHome(role, tenant.slug)} replace />;
  return <Outlet />;
}

/** Configuration, schedules and the audit log are for the council's administrators. */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { tenant, isAdmin } = useStaff();
  if (!isAdmin) return <Navigate to={adminPaths(tenant.slug).home} replace />;
  return children;
}
