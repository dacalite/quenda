// SPDX-License-Identifier: EUPL-1.2
import type { Id, IsoDate, Time } from '../../domain/types';
import type { DemoRole } from '../state';

export const ADMIN_PATH = 'xestion';
export const DEPUTACION_PATH = 'deputacion';

export const roleHome = (role: DemoRole, tenantSlug: string) =>
  role === 'deputacion'
    ? `/${DEPUTACION_PATH}`
    : role === 'staff'
      ? `/${tenantSlug}/${ADMIN_PATH}`
      : `/${tenantSlug}`;

const query = (params: Record<string, string | undefined>) => {
  const search = new URLSearchParams(
    Object.entries(params).filter((entry): entry is [string, string] => Boolean(entry[1])),
  ).toString();
  return search ? `?${search}` : '';
};

export interface BookingParams {
  facilityId: Id;
  subspaceId: Id;
  date: IsoDate;
  start: Time;
  end: Time;
  replaces?: Id | undefined;
}

export const LEGAL_PAGES = {
  'aviso-legal': 'legalNotice',
  privacidade: 'privacy',
  accesibilidade: 'accessibility',
} as const;

/** URLs in Galician, the default language of the service. */
export const citizenPaths = (slug: string) => ({
  home: `/${slug}`,
  facilities: (filters: Record<string, string | undefined> = {}) =>
    `/${slug}/instalacions${query(filters)}`,
  facility: (id: Id) => `/${slug}/instalacions/${id}`,
  availability: (
    id: Id,
    options: { date?: IsoDate; subspaceId?: Id; replaces?: Id; week?: boolean } = {},
  ) =>
    `/${slug}/instalacions/${id}/reservar${query({
      data: options.date,
      espazo: options.subspaceId,
      cambiar: options.replaces,
      vista: options.week ? 'semana' : undefined,
    })}`,
  booking: (params: BookingParams) =>
    `/${slug}/reservar${query({
      instalacion: params.facilityId,
      espazo: params.subspaceId,
      data: params.date,
      inicio: params.start,
      fin: params.end,
      cambiar: params.replaces,
    })}`,
  reservations: `/${slug}/reservas`,
  reservation: (id: Id, flag?: 'nova' | 'cambiada') =>
    `/${slug}/reservas/${id}${flag ? `?${flag}=1` : ''}`,
  notifications: `/${slug}/avisos`,
  calendar: `/${slug}/calendario`,
  profile: `/${slug}/perfil`,
  signIn: (back?: string) => `/${slug}/acceder${query({ volver: back })}`,
  provider: (provider: 'clave' | 'chave365', back?: string) =>
    `/${slug}/acceder/${provider}${query({ volver: back })}`,
  legal: (page: keyof typeof LEGAL_PAGES) => `/${slug}/${page}`,
});

/** Only paths inside the app are accepted as a return address, never another site. */
export const safeReturnPath = (value: string | null, fallback: string) =>
  value?.startsWith('/') && !value.startsWith('//') ? value : fallback;

export const adminPaths = (slug: string) => {
  const base = `/${slug}/${ADMIN_PATH}`;
  return {
    home: base,
    agenda: (options: { date?: IsoDate; facilityId?: Id; week?: boolean } = {}) =>
      `${base}/axenda${query({
        data: options.date,
        instalacion: options.facilityId,
        vista: options.week ? 'semana' : undefined,
      })}`,
    newBooking: (slot: Partial<Omit<BookingParams, 'replaces'>> = {}) =>
      `${base}/nova-reserva${query({
        instalacion: slot.facilityId,
        espazo: slot.subspaceId,
        data: slot.date,
        inicio: slot.start,
        fin: slot.end,
      })}`,
    reservation: (id: Id) => `${base}/reservas/${id}`,
    access: `${base}/acceso`,
    facilities: `${base}/instalacions`,
    newFacility: `${base}/instalacions/nova`,
    facility: (id: Id) => `${base}/instalacions/${id}`,
    schedule: (id: Id) => `${base}/instalacions/${id}/horario`,
    blocks: `${base}/bloqueos`,
    seasons: `${base}/tempada`,
    newSeason: `${base}/tempada/nova`,
    indicators: `${base}/indicadores`,
    settings: `${base}/configuracion`,
    activity: `${base}/actividade`,
  };
};
