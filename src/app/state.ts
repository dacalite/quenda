// SPDX-License-Identifier: EUPL-1.2
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { APP_NAME } from '../config/app';
import type { PersonaKey } from '../data/seed/catalog';
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
  collapsed: boolean;
  setRole: (role: DemoRole) => void;
  setCitizen: (persona: CitizenPersona) => void;
  setStaff: (persona: StaffPersona) => void;
  setTenantId: (tenantId: Id | null) => void;
  setCollapsed: (collapsed: boolean) => void;
}

export const useDemo = create<DemoState>()(
  persist(
    (set) => ({
      role: 'citizen',
      citizen: 'uxia',
      staff: 'carme',
      tenantId: null,
      collapsed: false,
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
      setCollapsed: (collapsed) => {
        set({ collapsed });
      },
    }),
    {
      name: `${APP_NAME}.demo`,
      partialize: ({ role, citizen, staff, collapsed }) => ({ role, citizen, staff, collapsed }),
    },
  ),
);

/** The user the simulated server sees as signed in. */
export function sessionUserId({ role, citizen, staff, tenantId } = useDemo.getState()) {
  if (!tenantId || role === 'deputacion') return null;
  return personaUserId(tenantId, role === 'citizen' ? citizen : staff);
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
