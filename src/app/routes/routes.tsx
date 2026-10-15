// SPDX-License-Identifier: EUPL-1.2
import type { RouteObject } from 'react-router';
import { AdminHome } from '../../features/admin/AdminHome';
import { Availability } from '../../features/citizen/Availability';
import { BookingReview } from '../../features/citizen/BookingReview';
import { CalendarPage } from '../../features/citizen/CalendarPage';
import { CitizenHome } from '../../features/citizen/CitizenHome';
import { FacilityDetail } from '../../features/citizen/FacilityDetail';
import { FacilityList } from '../../features/citizen/FacilityList';
import { LegalPage } from '../../features/citizen/LegalPage';
import { MyReservations } from '../../features/citizen/MyReservations';
import { Notifications } from '../../features/citizen/Notifications';
import { Profile } from '../../features/citizen/Profile';
import { RequireCitizen } from '../../features/citizen/RequireCitizen';
import { ReservationDetail } from '../../features/citizen/ReservationDetail';
import { IdentityProvider, SignIn } from '../../features/citizen/SignIn';
import { DeputacionHome } from '../../features/deputacion/DeputacionHome';
import { NotFoundPage } from '../pages';
import { AppShell, DeputacionLayout, RedirectToDemoStart, TenantLayout } from './layouts';
import { ADMIN_PATH, DEPUTACION_PATH, LEGAL_PAGES } from './paths';

const personal = (element: React.ReactNode) => <RequireCitizen>{element}</RequireCitizen>;

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
          { path: 'instalacions', element: <FacilityList /> },
          { path: 'instalacions/:facilityId', element: <FacilityDetail /> },
          { path: 'instalacions/:facilityId/reservar', element: <Availability /> },
          { path: 'reservar', element: personal(<BookingReview />) },
          { path: 'reservas', element: personal(<MyReservations />) },
          { path: 'reservas/:reservationId', element: personal(<ReservationDetail />) },
          { path: 'avisos', element: personal(<Notifications />) },
          { path: 'calendario', element: personal(<CalendarPage />) },
          { path: 'perfil', element: personal(<Profile />) },
          { path: 'acceder', element: <SignIn /> },
          { path: 'acceder/:provider', element: <IdentityProvider /> },
          ...(Object.keys(LEGAL_PAGES) as (keyof typeof LEGAL_PAGES)[]).map((page) => ({
            path: page,
            element: <LegalPage page={page} />,
          })),
          { path: ADMIN_PATH, element: <AdminHome /> },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
