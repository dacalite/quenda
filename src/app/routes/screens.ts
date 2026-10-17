// SPDX-License-Identifier: EUPL-1.2
import { lazy, type ComponentType } from 'react';

// Each area is a separate download; every screen of an area comes in the same file.
const citizen = () => import('../../features/citizen/screens');
const admin = () => import('../../features/admin/screens');
const deputacion = () => import('../../features/deputacion/screens');

function screen<K extends string, M extends Record<K, ComponentType>>(
  load: () => Promise<M>,
  name: K,
) {
  return lazy(async () => ({ default: (await load())[name] }));
}

export const Availability = screen(citizen, 'Availability');
export const BookingReview = screen(citizen, 'BookingReview');
export const CalendarPage = screen(citizen, 'CalendarPage');
export const CitizenHome = screen(citizen, 'CitizenHome');
export const FacilityDetail = screen(citizen, 'FacilityDetail');
export const FacilityList = screen(citizen, 'FacilityList');
export const LegalPage = lazy(async () => ({ default: (await citizen()).LegalPage }));
export const MyReservations = screen(citizen, 'MyReservations');
export const Notifications = screen(citizen, 'Notifications');
export const Profile = screen(citizen, 'Profile');
export const ReservationDetail = screen(citizen, 'ReservationDetail');
export const IdentityProvider = screen(citizen, 'IdentityProvider');
export const SignIn = screen(citizen, 'SignIn');

export const AccessControl = screen(admin, 'AccessControl');
export const Activity = screen(admin, 'Activity');
export const AdminHome = screen(admin, 'AdminHome');
export const Agenda = screen(admin, 'Agenda');
export const Blocks = screen(admin, 'Blocks');
export const Facilities = screen(admin, 'Facilities');
export const EditFacility = screen(admin, 'EditFacility');
export const NewFacility = screen(admin, 'NewFacility');
export const Indicators = screen(admin, 'Indicators');
export const NewBooking = screen(admin, 'NewBooking');
export const ReservationRecord = screen(admin, 'ReservationRecord');
export const ScheduleEditor = screen(admin, 'ScheduleEditor');
export const SeasonWizard = screen(admin, 'SeasonWizard');
export const Seasons = screen(admin, 'Seasons');
export const Settings = screen(admin, 'Settings');

export const DeputacionHome = screen(deputacion, 'DeputacionHome');
export const NewCouncil = screen(deputacion, 'NewCouncil');
