// SPDX-License-Identifier: EUPL-1.2
import type { RouteObject } from 'react-router';
import { RequireAdmin, RequireStaff } from '../../features/admin/RequireStaff';
import { RequireCitizen } from '../../features/citizen/RequireCitizen';
import { NotFoundPage } from '../pages';
import {
  AccessControl,
  Activity,
  AdminHome,
  Agenda,
  Availability,
  Blocks,
  BookingReview,
  CalendarPage,
  CitizenHome,
  DeputacionHome,
  EditFacility,
  Facilities,
  FacilityDetail,
  FacilityList,
  IdentityProvider,
  Indicators,
  LegalPage,
  MyReservations,
  NewBooking,
  NewCouncil,
  NewFacility,
  Notifications,
  Profile,
  ReservationDetail,
  ReservationRecord,
  ScheduleEditor,
  SeasonWizard,
  Seasons,
  Settings,
  SignIn,
} from './screens';
import { AppShell, DeputacionLayout, RedirectToDemoStart, TenantLayout } from './layouts';
import { ADMIN_PATH, DEPUTACION_PATH, LEGAL_PAGES } from './paths';

const personal = (element: React.ReactNode) => <RequireCitizen>{element}</RequireCitizen>;
const adminOnly = (element: React.ReactNode) => <RequireAdmin>{element}</RequireAdmin>;

export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { index: true, element: <RedirectToDemoStart /> },
      {
        path: DEPUTACION_PATH,
        element: <DeputacionLayout />,
        children: [
          { index: true, element: <DeputacionHome /> },
          { path: 'novo-concello', element: <NewCouncil /> },
          { path: '*', element: <NotFoundPage /> },
        ],
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
          {
            path: ADMIN_PATH,
            element: <RequireStaff />,
            children: [
              { index: true, element: <AdminHome /> },
              { path: 'axenda', element: <Agenda /> },
              { path: 'nova-reserva', element: <NewBooking /> },
              { path: 'reservas/:reservationId', element: <ReservationRecord /> },
              { path: 'acceso', element: <AccessControl /> },
              { path: 'indicadores', element: <Indicators /> },
              { path: 'instalacions', element: adminOnly(<Facilities />) },
              { path: 'instalacions/nova', element: adminOnly(<NewFacility />) },
              { path: 'instalacions/:facilityId', element: adminOnly(<EditFacility />) },
              { path: 'instalacions/:facilityId/horario', element: adminOnly(<ScheduleEditor />) },
              { path: 'bloqueos', element: adminOnly(<Blocks />) },
              { path: 'tempada', element: adminOnly(<Seasons />) },
              { path: 'tempada/nova', element: adminOnly(<SeasonWizard />) },
              { path: 'configuracion', element: adminOnly(<Settings />) },
              { path: 'actividade', element: adminOnly(<Activity />) },
            ],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];
