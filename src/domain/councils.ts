// SPDX-License-Identifier: EUPL-1.2
import type { Language } from '../config/app';
import { isHexColor, type FieldProblem } from './validation';
import type {
  BookingRules,
  Emblem,
  Facility,
  FacilityType,
  Id,
  LocalizedText,
  Pricing,
  Schedule,
  SlotMinutes,
  Subspace,
  Tenant,
  TimeRange,
  Weekday,
} from './types';

/** What a deputación provides to sign up a council in its shared instance. */
export interface NewCouncil {
  name: string;
  slug: string;
  languages: Language[];
  emblem: Emblem;
  primaryColor: string;
  facilityTypes: FacilityType[];
  /** Where the starter facilities are, until the council edits each one. */
  address: string;
}

/** Where new facilities appear on the map until the council places them. */
export const DEFAULT_COORDINATES = { lat: 42.88, lng: -8.54 };

/** Top-level paths that are not councils. */
export const RESERVED_SLUGS = ['deputacion'] as const;

export const DEFAULT_RULES: BookingRules = {
  minAdvanceHours: 2,
  maxAdvanceDays: 14,
  minDurationMinutes: 60,
  maxDurationMinutes: 120,
  maxBookingsPerWeek: 3,
  freeCancellationHours: 24,
  noShow: { strikesForSuspension: 3, windowDays: 60, suspensionDays: 14 },
  eligibility: 'everyone',
};

const text = (gl: string, es: string): LocalizedText => ({ gl, es });

export const subspace = (
  id: string,
  gl: string,
  es: string,
  extra: Partial<Subspace> = {},
): Subspace => ({ id, name: text(gl, es), capacity: 1, contains: [], ...extra });

export const HALL_SPACES = [
  subspace('court-1', 'Pista 1', 'Pista 1'),
  subspace('court-2', 'Pista 2', 'Pista 2'),
  subspace('full', 'Pista completa', 'Pista completa', { contains: ['court-1', 'court-2'] }),
];

export const PITCH_SPACES = [
  subspace('half-a', 'Medio campo A', 'Medio campo A'),
  subspace('half-b', 'Medio campo B', 'Medio campo B'),
  subspace('full', 'Campo completo', 'Campo completo', { contains: ['half-a', 'half-b'] }),
];

export const legalTexts = (council: string): Tenant['legal'] => ({
  legalNotice: text(
    `Texto de exemplo. Este sitio web é titularidade do ${council}. O seu uso implica a aceptación destas condicións.`,
    `Texto de ejemplo. Este sitio web es titularidad del ${council}. Su uso implica la aceptación de estas condiciones.`,
  ),
  privacy: text(
    `Texto de exemplo. O ${council} trata os teus datos para xestionar as reservas, con base no exercicio de poderes públicos. Podes exercer os teus dereitos de acceso, rectificación e supresión.`,
    `Texto de ejemplo. El ${council} trata tus datos para gestionar las reservas, con base en el ejercicio de poderes públicos. Puedes ejercer tus derechos de acceso, rectificación y supresión.`,
  ),
  accessibility: text(
    `Texto de exemplo. O ${council} comprométese a facer accesible este sitio web conforme ao Real decreto 1112/2018.`,
    `Texto de ejemplo. El ${council} se compromete a hacer accesible este sitio web conforme al Real Decreto 1112/2018.`,
  ),
});

const COUNCIL_PREFIX = /^concello\s+(de|da|do|das|dos)\s+/;

/** A web address for the council from its name, e.g. «Concello da Pobra» → `pobra`. */
export const suggestSlug = (name: string) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(COUNCIL_PREFIX, '')
    .replace(/^concello\s+(de|da|do|das|dos)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function validateNewCouncil(council: NewCouncil, takenSlugs: string[]): FieldProblem[] {
  const problems: FieldProblem[] = [];
  const add = (field: string, code: FieldProblem['code']) => problems.push({ field, code });
  const slug = council.slug.trim();

  if (council.name.trim() === '') add('name', 'required');
  if (slug === '') add('slug', 'required');
  else if (!SLUG.test(slug)) add('slug', 'format');
  else if ([...takenSlugs, ...RESERVED_SLUGS].includes(slug)) add('slug', 'taken');
  if (council.languages.length === 0) add('languages', 'required');
  if (!isHexColor(council.primaryColor)) add('primaryColor', 'format');
  if (council.facilityTypes.length === 0) add('facilityTypes', 'required');
  if (council.address.trim() === '') add('address', 'required');
  return problems;
}

export function newTenant(id: Id, council: NewCouncil, deputacionId: Id): Tenant {
  const name = council.name.trim();
  return {
    id,
    slug: council.slug.trim(),
    name,
    deputacionId,
    primaryColor: council.primaryColor,
    emblem: council.emblem,
    languages: council.languages,
    timeZone: 'Europe/Madrid',
    legal: legalTexts(name),
    defaultRules: DEFAULT_RULES,
  };
}

const range = (start: string, end: string): TimeRange => ({ start, end });

const week = (
  weekdays: TimeRange[],
  saturday: TimeRange[],
  sunday: TimeRange[],
): Record<Weekday, TimeRange[]> => ({
  1: weekdays,
  2: weekdays,
  3: weekdays,
  4: weekdays,
  5: weekdays,
  6: saturday,
  7: sunday,
});

const INDOOR = week(
  [range('09:00', '14:00'), range('16:00', '22:00')],
  [range('10:00', '14:00')],
  [],
);
const OUTDOOR = week(
  [range('16:00', '22:00')],
  [range('10:00', '14:00')],
  [range('10:00', '14:00')],
);
const EARLY = week([range('07:00', '22:00')], [range('09:00', '14:00')], []);

const CONCESSIONS: Pricing['concessions'] = {
  minor: 30,
  senior: 50,
  disability: 50,
  largeFamily: 20,
};

interface Template {
  name: string;
  description: LocalizedText;
  capacity: number;
  subspaces: Subspace[];
  weekly: Record<Weekday, TimeRange[]>;
  slotMinutes: SlotMinutes;
  residentCents: number;
}

const TEMPLATES: Record<FacilityType, Template> = {
  sportsHall: {
    name: 'Pavillón polideportivo',
    description: text(
      'Pavillón cuberto con pista divisible en dúas.',
      'Pabellón cubierto con pista divisible en dos.',
    ),
    capacity: 100,
    subspaces: HALL_SPACES,
    weekly: INDOOR,
    slotMinutes: 60,
    residentCents: 1000,
  },
  paddleCourt: {
    name: 'Pista de pádel',
    description: text('Pista de pádel con iluminación.', 'Pista de pádel con iluminación.'),
    capacity: 4,
    subspaces: [subspace('main', 'Pista', 'Pista')],
    weekly: OUTDOOR,
    slotMinutes: 90,
    residentCents: 600,
  },
  tennisCourt: {
    name: 'Pista de tenis',
    description: text('Pista de tenis exterior.', 'Pista de tenis exterior.'),
    capacity: 4,
    subspaces: [subspace('main', 'Pista', 'Pista')],
    weekly: OUTDOOR,
    slotMinutes: 60,
    residentCents: 500,
  },
  footballPitch: {
    name: 'Campo de fútbol',
    description: text(
      'Campo de herba artificial que se pode reservar enteiro ou por medios.',
      'Campo de césped artificial que se puede reservar entero o por mitades.',
    ),
    capacity: 30,
    subspaces: PITCH_SPACES,
    weekly: OUTDOOR,
    slotMinutes: 90,
    residentCents: 2500,
  },
  swimmingPool: {
    name: 'Piscina municipal',
    description: text('Piscina cuberta de catro rúas.', 'Piscina cubierta de cuatro calles.'),
    capacity: 40,
    subspaces: [1, 2, 3, 4].map((n) =>
      subspace(`lane-${String(n)}`, `Rúa ${String(n)}`, `Calle ${String(n)}`),
    ),
    weekly: EARLY,
    slotMinutes: 60,
    residentCents: 400,
  },
  multipurposeRoom: {
    name: 'Sala multiusos',
    description: text(
      'Sala para actividades dirixidas e reunións.',
      'Sala para actividades dirigidas y reuniones.',
    ),
    capacity: 30,
    subspaces: [subspace('main', 'Sala', 'Sala')],
    weekly: INDOOR,
    slotMinutes: 60,
    residentCents: 800,
  },
  gym: {
    name: 'Ximnasio municipal',
    description: text('Sala de musculación e cardio.', 'Sala de musculación y cardio.'),
    capacity: 12,
    subspaces: [subspace('main', 'Ximnasio', 'Gimnasio', { capacity: 12 })],
    weekly: EARLY,
    slotMinutes: 60,
    residentCents: 250,
  },
};

const USAGE_RULES = text(
  'Respecta a hora de remate e deixa a instalación recollida.',
  'Respeta la hora de fin y deja la instalación recogida.',
);

/** A ready-to-book facility of each type, which the council can then complete. */
export function starterFacility(
  type: FacilityType,
  address: string,
): {
  facility: Omit<Facility, 'id' | 'tenantId'>;
  schedule: Pick<Schedule, 'slotMinutes' | 'weekly' | 'exceptions'>;
} {
  const template = TEMPLATES[type];
  return {
    facility: {
      name: template.name,
      type,
      description: template.description,
      address: address.trim(),
      coordinates: DEFAULT_COORDINATES,
      capacity: template.capacity,
      subspaces: structuredClone(template.subspaces),
      accessibility: [],
      photos: [],
      usageRules: USAGE_RULES,
      status: 'active',
      rules: {},
      pricing: {
        residentCents: template.residentCents,
        nonResidentCents: template.residentCents * 2,
        concessions: CONCESSIONS,
        entitiesFree: true,
      },
    },
    schedule: { slotMinutes: template.slotMinutes, weekly: template.weekly, exceptions: [] },
  };
}
