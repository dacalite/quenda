// SPDX-License-Identifier: EUPL-1.2
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME } from '../config/app';
import { DEPUTACION, DEPUTACION_STAFF_ID, type PersonaKey } from '../data/seed/catalog';
import { personaUserId } from '../data/seed/generate';
import type { AccessibilityPreferences, Id } from '../domain/types';

export type DemoRole = 'citizen' | 'staff' | 'deputacion';
export type CitizenPersona = Extract<PersonaKey, 'uxia' | 'manuel' | 'brais'>;
export type StaffPersona = Extract<PersonaKey, 'carme' | 'xose'>;

interface DemoState {
  role: DemoRole;
  citizen: CitizenPersona;
  staff: StaffPersona;
  /** Council being shown, set from the URL. */
  tenantId: Id | null;
  /** Residents sign in through the simulated Cl@ve or Chave365 screen. */
  signedIn: boolean;
  setRole: (role: DemoRole) => void;
  setCitizen: (persona: CitizenPersona) => void;
  setStaff: (persona: StaffPersona) => void;
  setTenantId: (tenantId: Id | null) => void;
  setSignedIn: (signedIn: boolean) => void;
}

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      role: 'citizen',
      citizen: 'uxia',
      staff: 'carme',
      tenantId: null,
      signedIn: false,
      setRole: (role) => {
        set({ role });
      },
      setCitizen: (citizen) => {
        set({ citizen });
      },
      setStaff: (staff) => {
        set({ staff });
      },
      setTenantId: (tenantId) => {
        set({ tenantId });
      },
      setSignedIn: (signedIn) => {
        set({ signedIn });
      },
    }),
    {
      name: `${APP_NAME}.demo`,
      partialize: ({ role, citizen, staff, signedIn }) => ({
        role,
        citizen,
        staff,
        signedIn,
      }),
    },
  ),
);

/** The user the simulated server sees as signed in. */
export function sessionUserId({ role, citizen, staff, tenantId, signedIn } = useDemo.getState()) {
  if (!tenantId || role === 'deputacion' || (role === 'citizen' && !signedIn)) return null;
  return personaUserId(tenantId, role === 'citizen' ? citizen : staff);
}

/** What the simulated server reads from the authentication token. */
export function currentSession(state = useDemo.getState()) {
  if (state.role === 'deputacion') {
    return { userId: DEPUTACION_STAFF_ID, deputacionId: DEPUTACION.id };
  }
  const userId = sessionUserId(state);
  return userId ? { userId } : null;
}

interface PreferencesState extends AccessibilityPreferences {
  update: (patch: Partial<AccessibilityPreferences>) => void;
}

export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      textSize: 'normal',
      highContrast: false,
      reducedMotion: false,
      update: (patch) => {
        set(patch);
      },
    }),
    { name: `${APP_NAME}.preferences` },
  ),
);

interface TourState {
  /** Roles whose guided tour has already been offered, so it only opens by itself once. */
  seen: DemoRole[];
  /** `returnTo`: id of the control that gets the focus back when the tour ends. */
  active: { role: DemoRole; step: number; returnTo?: string | undefined } | null;
  start: (role: DemoRole, returnTo?: string) => void;
  go: (step: number) => void;
  stop: () => void;
}

export const useTour = create<TourState>()(
  persist(
    (set) => ({
      seen: [],
      active: null,
      start: (role, returnTo) => {
        set(({ seen }) => ({
          active: { role, step: 0, returnTo },
          seen: seen.includes(role) ? seen : [...seen, role],
        }));
      },
      go: (step) => {
        set(({ active }) => (active ? { active: { ...active, step } } : {}));
      },
      stop: () => {
        set({ active: null });
      },
    }),
    { name: `${APP_NAME}.tours`, partialize: ({ seen }) => ({ seen }) },
  ),
);
