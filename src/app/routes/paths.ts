// SPDX-License-Identifier: EUPL-1.2
import type { DemoRole } from '../state';

export const ADMIN_PATH = 'xestion';
export const DEPUTACION_PATH = 'deputacion';

export const roleHome = (role: DemoRole, tenantSlug: string) =>
  role === 'deputacion'
    ? `/${DEPUTACION_PATH}`
    : role === 'staff'
      ? `/${tenantSlug}/${ADMIN_PATH}`
      : `/${tenantSlug}`;
