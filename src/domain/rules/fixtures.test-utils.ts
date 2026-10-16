// SPDX-License-Identifier: EUPL-1.2
import type { LocalDateTime } from '../time';
import type { Block, BookingRules, Facility, Reservation, Schedule, User } from '../types';
import type { BookingContext } from './booking';

/** Monday 19 October 2026, 10:00. */
export const NOW: LocalDateTime = { date: '2026-10-19', time: '10:00' };

export const RULES: BookingRules = {
  minAdvanceHours: 2,
  maxAdvanceDays: 7,
  minDurationMinutes: 60,
  maxDurationMinutes: 120,
  maxBookingsPerWeek: 2,
  freeCancellationHours: 24,
  noShow: { strikesForSuspension: 2, windowDays: 30, suspensionDays: 14 },
  eligibility: 'everyone',
};

const text = (value: string) => ({ gl: value, es: value });

export function makeFacility(overrides: Partial<Facility> = {}): Facility {
  return {
    id: 'pitch',
    tenantId: 't1',
    name: 'Campo municipal',
    type: 'footballPitch',
    description: text(''),
    address: 'Rúa do Campo, 1',
    coordinates: { lat: 0, lng: 0 },
    capacity: 22,
    subspaces: [
      { id: 'half-a', name: text('Medio campo A'), capacity: 1, contains: [] },
      { id: 'half-b', name: text('Medio campo B'), capacity: 1, contains: [] },
      { id: 'whole', name: text('Campo enteiro'), capacity: 1, contains: ['half-a', 'half-b'] },
    ],
    accessibility: [],
    photos: [],
    usageRules: text(''),
    status: 'active',
    rules: {},
    pricing: {
      residentCents: 400,
      nonResidentCents: 800,
      concessions: { minor: 30, senior: 50 },
      entitiesFree: true,
    },
    ...overrides,
  };
}

export function makeSchedule(overrides: Partial<Schedule> = {}): Schedule {
  const weekday = [
    { start: '09:00', end: '14:00' },
    { start: '16:00', end: '22:00' },
  ];
  return {
    tenantId: 't1',
    facilityId: 'pitch',
    slotMinutes: 60,
    weekly: {
      1: weekday,
      2: weekday,
      3: weekday,
      4: weekday,
      5: weekday,
      6: [{ start: '09:00', end: '14:00' }],
      7: [],
    },
    exceptions: [],
    ...overrides,
  };
}

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'u1',
    tenantId: 't1',
    firstName: 'Proba',
    lastName: 'Usuaria',
    maskedDni: '***1234*',
    email: 'proba@example.org',
    phone: '600000000',
    resident: true,
    concessions: [],
    role: 'citizen',
    preferences: {
      language: 'gl',
      channels: ['app'],
      accessibility: { textSize: 'normal', highContrast: false, reducedMotion: false },
    },
    ...overrides,
  };
}

let sequence = 0;

export function makeReservation(overrides: Partial<Reservation> = {}): Reservation {
  sequence += 1;
  return {
    id: `r${String(sequence)}`,
    tenantId: 't1',
    code: 'QDA-TEST',
    facilityId: 'pitch',
    subspaceId: 'half-a',
    date: '2026-10-20',
    start: '18:00',
    end: '19:00',
    holder: { kind: 'user', userId: 'u1' },
    status: 'confirmed',
    channel: 'web',
    amountCents: 400,
    payment: 'pending',
    notes: '',
    createdAt: '2026-10-01T10:00:00.000Z',
    createdBy: 'u1',
    history: [],
    ...overrides,
  };
}

export function makeBlock(overrides: Partial<Block> = {}): Block {
  return {
    id: 'b1',
    tenantId: 't1',
    facilityId: 'pitch',
    subspaceId: null,
    dates: { from: '2026-10-20', to: '2026-10-20' },
    times: { start: '09:00', end: '11:00' },
    reason: 'maintenance',
    note: '',
    createdAt: '2026-10-01T10:00:00.000Z',
    createdBy: 'admin',
    ...overrides,
  };
}

export function makeContext(overrides: Partial<BookingContext> = {}): BookingContext {
  return {
    facility: makeFacility(),
    schedule: makeSchedule(),
    holidays: [],
    blocks: [],
    reservations: [],
    holderReservations: [],
    rules: RULES,
    now: NOW,
    ...overrides,
  };
}
