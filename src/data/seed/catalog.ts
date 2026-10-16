// SPDX-License-Identifier: EUPL-1.2
import type {
  AccessibilityFeature,
  BookingRules,
  Concession,
  Deputacion,
  EntityKind,
  Facility,
  LocalizedText,
  Role,
  SlotMinutes,
  Tenant,
  TextSize,
  TimeRange,
  Weekday,
} from '../../domain/types';

import { HALL_SPACES, legalTexts, PITCH_SPACES, subspace } from '../../domain/councils';

// Fictional councils, facilities, clubs and people. Any resemblance to real ones is unintended.

const text = (gl: string, es: string): LocalizedText => ({ gl, es });
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

const HALL_HOURS = week(
  [range('09:00', '14:00'), range('16:00', '23:00')],
  [range('09:00', '14:00'), range('16:00', '20:00')],
  [range('10:00', '14:00')],
);
const PITCH_HOURS = week(
  [range('16:00', '23:30')],
  [range('10:00', '14:30'), range('16:00', '20:30')],
  [range('10:00', '14:30')],
);
const POOL_HOURS = week(
  [range('07:00', '22:00')],
  [range('09:00', '14:00'), range('16:00', '20:00')],
  [range('10:00', '14:00')],
);
const ROOM_HOURS = week(
  [range('09:00', '14:00'), range('16:00', '22:00')],
  [range('10:00', '14:00')],
  [],
);
const GYM_HOURS = week(
  [range('07:00', '23:00')],
  [range('09:00', '14:00'), range('16:00', '20:00')],
  [range('10:00', '14:00')],
);

export interface FacilitySeed {
  key: string;
  facility: Omit<Facility, 'id' | 'tenantId'>;
  slotMinutes: SlotMinutes;
  weekly: Record<Weekday, TimeRange[]>;
  /** Relative popularity used to generate the booking history. */
  demand: number;
}

type FacilityTemplate = Omit<FacilitySeed['facility'], 'status' | 'rules' | 'photos'> & {
  photoAlt: LocalizedText;
  rules?: Partial<BookingRules>;
};

const facility = (
  key: string,
  slotMinutes: SlotMinutes,
  weekly: Record<Weekday, TimeRange[]>,
  demand: number,
  { photoAlt, rules = {}, ...data }: FacilityTemplate,
): FacilitySeed => ({
  key,
  slotMinutes,
  weekly,
  demand,
  facility: { ...data, status: 'active', rules, photos: [{ id: `${key}-photo`, alt: photoAlt }] },
});

const ALL_FEATURES: AccessibilityFeature[] = [
  'stepFreeAccess',
  'adaptedChangingRoom',
  'adaptedToilet',
  'reservedParking',
  'hearingLoop',
];

const HALL_RULES = text(
  'Calzado deportivo de sola clara obrigatorio. Deixa a pista recollida ao rematar. Non se permite comer nas gradas.',
  'Calzado deportivo de suela clara obligatorio. Deja la pista recogida al terminar. No se permite comer en las gradas.',
);
const COURT_RULES = text(
  'Máximo catro persoas por pista. Respecta a hora de remate: a quenda seguinte agarda.',
  'Máximo cuatro personas por pista. Respeta la hora de fin: el turno siguiente espera.',
);
const PITCH_RULES = text(
  'Só calzado de multitaco ou tacos de goma. Prohibido o acceso de animais ao terreo de xogo.',
  'Solo calzado de multitaco o tacos de goma. Prohibido el acceso de animales al terreno de juego.',
);

export interface EntitySeed {
  key: string;
  name: string;
  kind: EntityKind;
  registryNumber: string;
  contactName: string;
}

export interface RecurringSeed {
  entityKey: string;
  facilityKey: string;
  subspaceId: string;
  weekdays: Weekday[];
  times: TimeRange;
}

export interface TenantSeed {
  tenant: Omit<Tenant, 'deputacionId'>;
  facilities: FacilitySeed[];
  entities: EntitySeed[];
  recurring: RecurringSeed[];
  localHoliday: { monthDay: string; name: LocalizedText };
  /** Facility each citizen persona usually books. */
  personaFacility: Record<'uxia' | 'manuel' | 'brais', string>;
  /** A maintenance block next week, so affected bookings can be shown. */
  block: { facilityKey: string; weekday: Weekday; times: TimeRange; note: string };
}

export const DEPUTACION: Deputacion = { id: 'deputacion-exemplo', name: 'Deputación de Exemplo' };

export const TENANTS: TenantSeed[] = [
  {
    tenant: {
      id: 'bouzalonga',
      slug: 'bouzalonga',
      name: 'Concello de Bouzalonga',
      primaryColor: '#1f6f43',
      emblem: 'oak',
      languages: ['gl', 'es'],
      timeZone: 'Europe/Madrid',
      legal: legalTexts('Concello de Bouzalonga'),
      defaultRules: {
        minAdvanceHours: 1,
        maxAdvanceDays: 7,
        minDurationMinutes: 60,
        maxDurationMinutes: 120,
        maxBookingsPerWeek: 3,
        freeCancellationHours: 12,
        noShow: { strikesForSuspension: 3, windowDays: 60, suspensionDays: 14 },
        eligibility: 'everyone',
      },
    },
    facilities: [
      facility('pavillon', 60, HALL_HOURS, 0.6, {
        name: 'Pavillón polideportivo de Bouzalonga',
        type: 'sportsHall',
        description: text(
          'Pavillón cuberto con pista central divisible en dúas, gradas para 200 persoas e vestiarios.',
          'Pabellón cubierto con pista central divisible en dos, gradas para 200 personas y vestuarios.',
        ),
        address: 'Rúa do Campo da Feira, 4, Bouzalonga',
        coordinates: { lat: 42.7612, lng: -8.1934 },
        capacity: 200,
        subspaces: HALL_SPACES,
        accessibility: [
          'stepFreeAccess',
          'adaptedChangingRoom',
          'adaptedToilet',
          'reservedParking',
        ],
        usageRules: HALL_RULES,
        pricing: {
          residentCents: 1000,
          nonResidentCents: 2000,
          concessions: { minor: 50, senior: 50, disability: 100, largeFamily: 25 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Pista interior do pavillón con liñas de baloncesto e fútbol sala e gradas ao fondo.',
          'Pista interior del pabellón con líneas de baloncesto y fútbol sala y gradas al fondo.',
        ),
      }),
      facility('padel', 60, HALL_HOURS, 1, {
        name: 'Pista de pádel do Campo da Feira',
        type: 'paddleCourt',
        description: text(
          'Pista de pádel exterior cuberta, con céspede artificial e iluminación.',
          'Pista de pádel exterior cubierta, con césped artificial e iluminación.',
        ),
        address: 'Rúa do Campo da Feira, 6, Bouzalonga',
        coordinates: { lat: 42.7615, lng: -8.1929 },
        capacity: 4,
        subspaces: [subspace('main', 'Pista', 'Pista')],
        accessibility: ['stepFreeAccess'],
        usageRules: COURT_RULES,
        pricing: {
          residentCents: 300,
          nonResidentCents: 600,
          concessions: { minor: 50, senior: 50, disability: 100, largeFamily: 25 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Pista de pádel con paredes de vidro baixo unha cuberta metálica.',
          'Pista de pádel con paredes de cristal bajo una cubierta metálica.',
        ),
      }),
      facility('tenis', 60, HALL_HOURS, 0.5, {
        name: 'Pista de tenis do Souto',
        type: 'tennisCourt',
        description: text(
          'Pista de tenis exterior de resina, xunto ao parque do Souto.',
          'Pista de tenis exterior de resina, junto al parque del Souto.',
        ),
        address: 'Camiño do Souto, s/n, Bouzalonga',
        coordinates: { lat: 42.7598, lng: -8.1951 },
        capacity: 4,
        subspaces: [subspace('main', 'Pista', 'Pista')],
        accessibility: [],
        usageRules: COURT_RULES,
        pricing: {
          residentCents: 200,
          nonResidentCents: 400,
          concessions: { minor: 50, senior: 50, disability: 100, largeFamily: 25 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Pista de tenis verde con rede central e árbores arredor.',
          'Pista de tenis verde con red central y árboles alrededor.',
        ),
      }),
      facility('campo', 90, PITCH_HOURS, 0.5, {
        name: 'Campo de fútbol municipal',
        type: 'footballPitch',
        description: text(
          'Campo de herba artificial de fútbol 11, divisible en dous campos de fútbol 7.',
          'Campo de césped artificial de fútbol 11, divisible en dos campos de fútbol 7.',
        ),
        address: 'Lugar da Veiga, 12, Bouzalonga',
        coordinates: { lat: 42.7581, lng: -8.1887 },
        capacity: 300,
        subspaces: PITCH_SPACES,
        accessibility: ['stepFreeAccess', 'adaptedToilet', 'reservedParking'],
        usageRules: PITCH_RULES,
        pricing: {
          residentCents: 2500,
          nonResidentCents: 4500,
          concessions: { minor: 50, senior: 50, disability: 100, largeFamily: 25 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Campo de herba artificial visto desde a bancada, coas porterías nos extremos.',
          'Campo de césped artificial visto desde la grada, con las porterías en los extremos.',
        ),
      }),
      facility('sala', 60, ROOM_HOURS, 0.35, {
        name: 'Sala multiusos da Casa da Cultura',
        type: 'multipurposeRoom',
        description: text(
          'Sala con chan de madeira e espellos, para ximnasia de mantemento, baile ou ioga.',
          'Sala con suelo de madera y espejos, para gimnasia de mantenimiento, baile o yoga.',
        ),
        address: 'Praza do Concello, 1, Bouzalonga',
        coordinates: { lat: 42.7605, lng: -8.1912 },
        capacity: 25,
        subspaces: [subspace('main', 'Sala', 'Sala')],
        accessibility: ALL_FEATURES,
        usageRules: text(
          'Entra descalzo ou con calzado limpo. Recolle as colchonetas ao rematar.',
          'Entra descalzo o con calzado limpio. Recoge las colchonetas al terminar.',
        ),
        pricing: {
          residentCents: 500,
          nonResidentCents: 1000,
          concessions: { minor: 50, senior: 50, disability: 100, largeFamily: 25 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Sala ampla con chan de madeira, espellos nunha parede e colchonetas apiladas.',
          'Sala amplia con suelo de madera, espejos en una pared y colchonetas apiladas.',
        ),
      }),
    ],
    entities: [
      {
        key: 'futsal',
        name: 'Club Fútbol Sala Bouzalonga',
        kind: 'club',
        registryNumber: 'RME-BZ-014',
        contactName: 'Antía Lorenzo Méndez',
      },
      {
        key: 'maiores',
        name: 'Asociación de Maiores A Lareira',
        kind: 'association',
        registryNumber: 'RME-BZ-031',
        contactName: 'Xoán Freire Couto',
      },
    ],
    recurring: [
      {
        entityKey: 'futsal',
        facilityKey: 'pavillon',
        subspaceId: 'full',
        weekdays: [2, 4],
        times: range('19:00', '21:00'),
      },
      {
        entityKey: 'maiores',
        facilityKey: 'sala',
        subspaceId: 'main',
        weekdays: [1, 3],
        times: range('10:00', '12:00'),
      },
    ],
    localHoliday: {
      monthDay: '11-11',
      name: text('Festa de San Martiño', 'Fiesta de San Martiño'),
    },
    personaFacility: { uxia: 'padel', manuel: 'sala', brais: 'tenis' },
    block: {
      facilityKey: 'campo',
      weekday: 3,
      times: range('16:00', '23:30'),
      note: 'Mantemento da herba artificial',
    },
  },
  {
    tenant: {
      id: 'ribasmeiras',
      slug: 'ribasmeiras',
      name: 'Concello de Ribasmeiras',
      primaryColor: '#0b5cad',
      emblem: 'bridge',
      languages: ['gl', 'es'],
      timeZone: 'Europe/Madrid',
      legal: legalTexts('Concello de Ribasmeiras'),
      defaultRules: {
        minAdvanceHours: 2,
        maxAdvanceDays: 14,
        minDurationMinutes: 60,
        maxDurationMinutes: 120,
        maxBookingsPerWeek: 2,
        freeCancellationHours: 24,
        noShow: { strikesForSuspension: 2, windowDays: 30, suspensionDays: 14 },
        eligibility: 'everyone',
      },
    },
    facilities: [
      facility('pavillon', 60, HALL_HOURS, 0.6, {
        name: 'Pavillón municipal da Ribeira',
        type: 'sportsHall',
        description: text(
          'Pavillón con pista central divisible en dúas, rocódromo e gradas para 600 persoas.',
          'Pabellón con pista central divisible en dos, rocódromo y gradas para 600 personas.',
        ),
        address: 'Avenida da Ribeira, 22, Ribasmeiras',
        coordinates: { lat: 42.5531, lng: -8.7512 },
        capacity: 600,
        subspaces: HALL_SPACES,
        accessibility: ALL_FEATURES,
        usageRules: HALL_RULES,
        pricing: {
          residentCents: 1500,
          nonResidentCents: 3000,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Pavillón amplo con pista azul, canastras recollidas e gradas laterais.',
          'Pabellón amplio con pista azul, canastas recogidas y gradas laterales.',
        ),
      }),
      facility('padel', 60, HALL_HOURS, 1, {
        name: 'Pistas de pádel do Malecón',
        type: 'paddleCourt',
        description: text(
          'Dúas pistas de pádel cubertas xunto ao paseo do río.',
          'Dos pistas de pádel cubiertas junto al paseo del río.',
        ),
        address: 'Paseo do Malecón, 3, Ribasmeiras',
        coordinates: { lat: 42.5544, lng: -8.7489 },
        capacity: 8,
        subspaces: [
          subspace('court-1', 'Pista 1', 'Pista 1'),
          subspace('court-2', 'Pista 2', 'Pista 2'),
        ],
        accessibility: ['stepFreeAccess', 'adaptedToilet'],
        usageRules: COURT_RULES,
        pricing: {
          residentCents: 450,
          nonResidentCents: 900,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Dúas pistas de pádel contiguas con céspede azul baixo unha cuberta.',
          'Dos pistas de pádel contiguas con césped azul bajo una cubierta.',
        ),
      }),
      facility('tenis', 60, HALL_HOURS, 0.6, {
        name: 'Pista de tenis do Malecón',
        type: 'tennisCourt',
        description: text(
          'Pista de tenis exterior con iluminación nocturna.',
          'Pista de tenis exterior con iluminación nocturna.',
        ),
        address: 'Paseo do Malecón, 5, Ribasmeiras',
        coordinates: { lat: 42.5547, lng: -8.7481 },
        capacity: 4,
        subspaces: [subspace('main', 'Pista', 'Pista')],
        accessibility: ['stepFreeAccess'],
        usageRules: COURT_RULES,
        pricing: {
          residentCents: 350,
          nonResidentCents: 700,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Pista de tenis de cor terra con focos altos.',
          'Pista de tenis de color tierra con focos altos.',
        ),
      }),
      facility('campo', 90, PITCH_HOURS, 0.55, {
        name: 'Estadio municipal de Ribasmeiras',
        type: 'footballPitch',
        description: text(
          'Campo de herba artificial de fútbol 11, divisible en dous de fútbol 7, con pista de atletismo.',
          'Campo de césped artificial de fútbol 11, divisible en dos de fútbol 7, con pista de atletismo.',
        ),
        address: 'Rúa do Estadio, s/n, Ribasmeiras',
        coordinates: { lat: 42.5498, lng: -8.7563 },
        capacity: 1500,
        subspaces: PITCH_SPACES,
        accessibility: [
          'stepFreeAccess',
          'adaptedChangingRoom',
          'adaptedToilet',
          'reservedParking',
        ],
        usageRules: PITCH_RULES,
        pricing: {
          residentCents: 3500,
          nonResidentCents: 6000,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Estadio con campo de herba artificial rodeado por unha pista de atletismo vermella.',
          'Estadio con campo de césped artificial rodeado por una pista de atletismo roja.',
        ),
      }),
      facility('piscina', 60, POOL_HOURS, 0.4, {
        name: 'Piscina municipal cuberta',
        type: 'swimmingPool',
        description: text(
          'Vaso de 25 metros con seis rúas, auga climatizada e guindastre de acceso.',
          'Vaso de 25 metros con seis calles, agua climatizada y grúa de acceso.',
        ),
        address: 'Rúa da Fonte, 9, Ribasmeiras',
        coordinates: { lat: 42.5522, lng: -8.7534 },
        capacity: 60,
        subspaces: [1, 2, 3, 4, 5, 6].map((n) =>
          subspace(`lane-${String(n)}`, `Rúa ${String(n)}`, `Calle ${String(n)}`),
        ),
        accessibility: ALL_FEATURES,
        usageRules: text(
          'Gorro de baño obrigatorio. Ducha antes de entrar no vaso. Nadar sempre pola dereita da rúa.',
          'Gorro de baño obligatorio. Ducha antes de entrar en el vaso. Nadar siempre por la derecha de la calle.',
        ),
        rules: { eligibility: 'residents', maxDurationMinutes: 60 },
        pricing: {
          residentCents: 400,
          nonResidentCents: 800,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Piscina cuberta de seis rúas separadas por cordas, con grandes ventás.',
          'Piscina cubierta de seis calles separadas por corcheras, con grandes ventanales.',
        ),
      }),
      facility('sala', 60, ROOM_HOURS, 0.3, {
        name: 'Sala multiusos do Centro Social',
        type: 'multipurposeRoom',
        description: text(
          'Sala polivalente para actividades dirixidas, reunións de clubs e obradoiros.',
          'Sala polivalente para actividades dirigidas, reuniones de clubs y talleres.',
        ),
        address: 'Rúa Nova, 15, Ribasmeiras',
        coordinates: { lat: 42.5509, lng: -8.7501 },
        capacity: 40,
        subspaces: [subspace('main', 'Sala', 'Sala')],
        accessibility: ALL_FEATURES,
        usageRules: text(
          'Deixa o mobiliario como o atopaches. Aforo máximo de 40 persoas.',
          'Deja el mobiliario como lo encontraste. Aforo máximo de 40 personas.',
        ),
        pricing: {
          residentCents: 800,
          nonResidentCents: 1600,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Sala luminosa con cadeiras apiladas e un proxector no teito.',
          'Sala luminosa con sillas apiladas y un proyector en el techo.',
        ),
      }),
      facility('ximnasio', 60, GYM_HOURS, 0.25, {
        name: 'Ximnasio municipal',
        type: 'gym',
        description: text(
          'Sala de musculación e cardio con monitor nas horas de maior afluencia.',
          'Sala de musculación y cardio con monitor en las horas de mayor afluencia.',
        ),
        address: 'Avenida da Ribeira, 22, Ribasmeiras',
        coordinates: { lat: 42.5532, lng: -8.7515 },
        capacity: 12,
        subspaces: [subspace('main', 'Ximnasio', 'Gimnasio', { capacity: 12 })],
        accessibility: ['stepFreeAccess', 'adaptedChangingRoom', 'adaptedToilet'],
        usageRules: text(
          'Toalla obrigatoria. Limpa as máquinas despois de usalas.',
          'Toalla obligatoria. Limpia las máquinas después de usarlas.',
        ),
        rules: { maxDurationMinutes: 60 },
        pricing: {
          residentCents: 250,
          nonResidentCents: 500,
          concessions: { minor: 30, senior: 50, disability: 50, largeFamily: 20 },
          entitiesFree: true,
        },
        photoAlt: text(
          'Ximnasio con cintas de correr diante dunha cristaleira e zona de pesos.',
          'Gimnasio con cintas de correr delante de una cristalera y zona de pesas.',
        ),
      }),
    ],
    entities: [
      {
        key: 'baloncesto',
        name: 'Club Baloncesto Ribasmeiras',
        kind: 'club',
        registryNumber: 'RME-RB-007',
        contactName: 'Sabela Mosquera Vilar',
      },
      {
        key: 'patinaxe',
        name: 'Club Patinaxe Artística Ribasmeiras',
        kind: 'club',
        registryNumber: 'RME-RB-019',
        contactName: 'Iria Barreiro Doval',
      },
      {
        key: 'atletismo',
        name: 'Club Atletismo Ribasmeiras',
        kind: 'club',
        registryNumber: 'RME-RB-023',
        contactName: 'Roi Outeiro Graña',
      },
      {
        key: 'natacion',
        name: 'Club Natación Ribasmeiras',
        kind: 'club',
        registryNumber: 'RME-RB-028',
        contactName: 'Olalla Piñeiro Calvo',
      },
    ],
    recurring: [
      {
        entityKey: 'baloncesto',
        facilityKey: 'pavillon',
        subspaceId: 'full',
        weekdays: [1, 3],
        times: range('18:00', '20:00'),
      },
      {
        entityKey: 'patinaxe',
        facilityKey: 'pavillon',
        subspaceId: 'court-2',
        weekdays: [2, 4],
        times: range('17:00', '19:00'),
      },
      {
        entityKey: 'atletismo',
        facilityKey: 'campo',
        subspaceId: 'full',
        weekdays: [6],
        times: range('10:00', '11:30'),
      },
      {
        entityKey: 'natacion',
        facilityKey: 'piscina',
        subspaceId: 'lane-1',
        weekdays: [1, 3, 5],
        times: range('18:00', '20:00'),
      },
      {
        entityKey: 'natacion',
        facilityKey: 'piscina',
        subspaceId: 'lane-2',
        weekdays: [1, 3, 5],
        times: range('18:00', '20:00'),
      },
    ],
    localHoliday: { monthDay: '09-08', name: text('Festas patronais', 'Fiestas patronales') },
    personaFacility: { uxia: 'padel', manuel: 'piscina', brais: 'tenis' },
    block: {
      facilityKey: 'padel',
      weekday: 2,
      times: range('09:00', '14:00'),
      note: 'Substitución da rede da pista',
    },
  },
];

export const REGIONAL_HOLIDAYS: { monthDay: string; name: LocalizedText }[] = [
  { monthDay: '01-01', name: text('Aninovo', 'Año Nuevo') },
  { monthDay: '01-06', name: text('Epifanía do Señor', 'Epifanía del Señor') },
  { monthDay: '05-01', name: text('Festa do Traballo', 'Fiesta del Trabajo') },
  { monthDay: '05-17', name: text('Día das Letras Galegas', 'Día de las Letras Gallegas') },
  { monthDay: '07-25', name: text('Día Nacional de Galicia', 'Día Nacional de Galicia') },
  { monthDay: '08-15', name: text('Asunción da Virxe', 'Asunción de la Virgen') },
  { monthDay: '10-12', name: text('Festa Nacional de España', 'Fiesta Nacional de España') },
  { monthDay: '11-01', name: text('Todos os Santos', 'Todos los Santos') },
  { monthDay: '12-06', name: text('Día da Constitución', 'Día de la Constitución') },
  { monthDay: '12-08', name: text('Inmaculada Concepción', 'Inmaculada Concepción') },
  { monthDay: '12-25', name: text('Nadal', 'Navidad') },
];

export type PersonaKey = 'uxia' | 'manuel' | 'brais' | 'carme' | 'xose';

export interface PersonaSeed {
  key: PersonaKey;
  firstName: string;
  lastName: string;
  role: Role;
  resident: boolean;
  concessions: Concession[];
  textSize: TextSize;
  maskedDni: string;
  phone: string;
}

export const PERSONAS: PersonaSeed[] = [
  {
    key: 'uxia',
    firstName: 'Uxía',
    lastName: 'Varela Pena',
    role: 'citizen',
    resident: true,
    concessions: [],
    textSize: 'normal',
    maskedDni: '***4521**',
    phone: '600 100 234',
  },
  {
    key: 'manuel',
    firstName: 'Manuel',
    lastName: 'Castro Iglesias',
    role: 'citizen',
    resident: true,
    concessions: ['senior'],
    textSize: 'large',
    maskedDni: '***1187**',
    phone: '600 100 871',
  },
  {
    key: 'brais',
    firstName: 'Brais',
    lastName: 'Fernández Lago',
    role: 'citizen',
    resident: false,
    concessions: [],
    textSize: 'normal',
    maskedDni: '***9032**',
    phone: '600 100 552',
  },
  {
    key: 'carme',
    firstName: 'Carme',
    lastName: 'Seoane Rey',
    role: 'admin',
    resident: true,
    concessions: [],
    textSize: 'normal',
    maskedDni: '***3310**',
    phone: '600 100 410',
  },
  {
    key: 'xose',
    firstName: 'Xosé',
    lastName: 'Otero Vidal',
    role: 'staff',
    resident: true,
    concessions: [],
    textSize: 'normal',
    maskedDni: '***7764**',
    phone: '600 100 693',
  },
];

export const FIRST_NAMES = [
  'Antía',
  'Iria',
  'Noa',
  'Sabela',
  'Lucía',
  'Carla',
  'Xiana',
  'Alba',
  'Rosa',
  'Pilar',
  'Maruxa',
  'Olalla',
  'Martiño',
  'Xabier',
  'Iago',
  'Roi',
  'Hugo',
  'Breixo',
  'Daniel',
  'Pablo',
  'Ramón',
  'Celso',
  'Lois',
  'Anxo',
];

export const LAST_NAMES = [
  'Varela',
  'Rial',
  'Souto',
  'Pena',
  'Castro',
  'Iglesias',
  'Lago',
  'Seoane',
  'Rey',
  'Otero',
  'Vidal',
  'Freire',
  'Couto',
  'Lorenzo',
  'Méndez',
  'Mosquera',
  'Barreiro',
  'Outeiro',
  'Vilar',
  'Doval',
  'Graña',
  'Piñeiro',
  'Calvo',
  'Ferreiro',
];
