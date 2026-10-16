// SPDX-License-Identifier: EUPL-1.2
import { adminPaths, citizenPaths, deputacionPaths } from '../../app/routes/paths';
import { useDemo, useTour, type DemoRole } from '../../app/state';
import type { Repositories } from '../../data/ports/repositories';
import { addDays, zonedNow } from '../../domain/time';
import type { Id, Tenant } from '../../domain/types';
import type demoTexts from '../../i18n/gl/demo.json';

export type TourStepKey = keyof (typeof demoTexts)['tour']['steps'];

export interface TourContext {
  repositories: Repositories;
  tenant: Tenant;
  /** The resident shown in the demo, once signed in through the simulated gateway. */
  signIn: () => Id | null;
}

export interface TourStep {
  key: TourStepKey;
  /** Where the step takes place; `null` keeps the current page. */
  locate: (context: TourContext) => string | null | Promise<string | null>;
  /** Part of the page the step is about, outlined and scrolled into view. */
  target?: string;
}

const today = (tenant: Tenant) => zonedNow(new Date(), tenant.timeZone).date;

async function firstFacility({ repositories, tenant }: TourContext) {
  const facilities = await repositories.facilities.list(tenant.id);
  return facilities.find((f) => f.status === 'active');
}

async function freeSlot(context: TourContext, facilityId: Id) {
  for (let day = 1; day <= 7; day++) {
    const date = addDays(today(context.tenant), day);
    const slots = await context.repositories.facilities.availability(
      context.tenant.id,
      facilityId,
      date,
    );
    const free = slots.find((slot) => slot.status === 'free');
    if (free) return free;
  }
  return undefined;
}

async function nextReservation(context: TourContext) {
  const userId = context.signIn();
  if (!userId) return undefined;
  const reservations = await context.repositories.reservations.list(context.tenant.id, {
    holder: { kind: 'user', userId },
    from: today(context.tenant),
    status: ['confirmed'],
  });
  return reservations[0];
}

const citizen: TourStep[] = [
  { key: 'citizenWelcome', locate: () => null },
  { key: 'search', locate: ({ tenant }) => citizenPaths(tenant.slug).facilities() },
  {
    key: 'availability',
    target: '#recommendations-title',
    locate: async (context) => {
      const facility = await firstFacility(context);
      const paths = citizenPaths(context.tenant.slug);
      return facility ? paths.availability(facility.id) : paths.facilities();
    },
  },
  {
    key: 'review',
    locate: async (context) => {
      context.signIn();
      const paths = citizenPaths(context.tenant.slug);
      const facility = await firstFacility(context);
      const slot = facility && (await freeSlot(context, facility.id));
      return slot ? paths.booking(slot) : paths.facilities();
    },
  },
  {
    key: 'ticket',
    target: '#reservation-code',
    locate: async (context) => {
      const reservation = await nextReservation(context);
      const paths = citizenPaths(context.tenant.slug);
      return reservation ? paths.reservation(reservation.id) : paths.reservations;
    },
  },
  { key: 'mine', locate: ({ tenant }) => citizenPaths(tenant.slug).reservations },
  {
    key: 'cancel',
    target: '#reservation-details',
    locate: async (context) => {
      const reservation = await nextReservation(context);
      const paths = citizenPaths(context.tenant.slug);
      return reservation ? paths.reservation(reservation.id) : paths.reservations;
    },
  },
];

const staff: TourStep[] = [
  { key: 'staffWelcome', locate: () => null },
  { key: 'panel', locate: ({ tenant }) => adminPaths(tenant.slug).home },
  { key: 'facility', locate: ({ tenant }) => adminPaths(tenant.slug).newFacility },
  { key: 'block', locate: ({ tenant }) => adminPaths(tenant.slug).blocks },
  { key: 'phone', locate: ({ tenant }) => adminPaths(tenant.slug).newBooking() },
  { key: 'season', locate: ({ tenant }) => adminPaths(tenant.slug).newSeason },
  { key: 'indicators', locate: ({ tenant }) => adminPaths(tenant.slug).indicators },
];

const deputacion: TourStep[] = [
  { key: 'deputacionWelcome', locate: () => null },
  { key: 'councils', target: '#councils', locate: () => deputacionPaths.home },
  { key: 'compare', target: '#compare', locate: () => deputacionPaths.home },
  { key: 'signUp', locate: () => deputacionPaths.newCouncil },
  { key: 'deployment', target: '#deployment', locate: () => deputacionPaths.home },
];

export const TOURS: Record<DemoRole, TourStep[]> = { citizen, staff, deputacion };

/** Opens the tour of the current role; the demo bar uses it to reopen a tour. */
export function useStartTour() {
  const start = useTour((state) => state.start);
  const setStaff = useDemo((state) => state.setStaff);
  return (role: DemoRole) => {
    // Several stops of the council tour are for administrators.
    if (role === 'staff') setStaff('carme');
    start(role);
  };
}
