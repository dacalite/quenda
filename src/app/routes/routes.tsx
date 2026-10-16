// SPDX-License-Identifier: EUPL-1.2
import type { RouteObject } from 'react-router';
import { AccessControl } from '../../features/admin/AccessControl';
import { Activity } from '../../features/admin/Activity';
import { AdminHome } from '../../features/admin/AdminHome';
import { Agenda } from '../../features/admin/Agenda';
import { Blocks } from '../../features/admin/Blocks';
import { Facilities } from '../../features/admin/Facilities';
import { EditFacility, NewFacility } from '../../features/admin/FacilityForm';
import { Indicators } from '../../features/admin/Indicators';
import { NewBooking } from '../../features/admin/NewBooking';
import { RequireAdmin, RequireStaff } from '../../features/admin/RequireStaff';
import { ReservationRecord } from '../../features/admin/ReservationRecord';
import { ScheduleEditor } from '../../features/admin/ScheduleEditor';
import { SeasonWizard } from '../../features/admin/SeasonWizard';
import { Seasons } from '../../features/admin/Seasons';
import { Settings } from '../../features/admin/Settings';
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
const adminOnly = (element: React.ReactNode) => <RequireAdmin>{element}</RequireAdmin>;

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
