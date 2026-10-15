// SPDX-License-Identifier: EUPL-1.2
import type { RouteObject } from 'react-router';
import { AdminHome } from '../../features/admin/AdminHome';
import { CitizenHome } from '../../features/citizen/CitizenHome';
import { DeputacionHome } from '../../features/deputacion/DeputacionHome';
import { NotFoundPage } from '../pages';
import { AppShell, DeputacionLayout, RedirectToDemoStart, TenantLayout } from './layouts';
import { ADMIN_PATH, DEPUTACION_PATH } from './paths';

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <RedirectToDemoStart /> },
      {
        path: DEPUTACION_PATH,
        element: <DeputacionLayout />,
        children: [{ index: true, element: <DeputacionHome /> }],
      },
      {
        path: ':tenantSlug',
        element: <TenantLayout />,
        children: [
          { index: true, element: <CitizenHome /> },
          { path: ADMIN_PATH, element: <AdminHome /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
