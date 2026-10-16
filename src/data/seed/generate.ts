// SPDX-License-Identifier: EUPL-1.2
import { subspacesOverlap } from '../../domain/rules/availability';
import { computePrice, initialPaymentStatus } from '../../domain/rules/pricing';
import { expandRecurring } from '../../domain/rules/recurring';
import { reservationCode } from '../../domain/reservationCode';
import { addDays, fromMinutes, startOfWeek, toMinutes, weekdayOf } from '../../domain/time';
import type {
  Channel,
  Concession,
  DateRange,
  Entity,
  Facility,
  Holder,
  IsoDate,
  Reservation,
  ReservationStatus,
  User,
  Weekday,
} from '../../domain/types';
import { SCHEMA_VERSION, type Database } from '../adapters/local/database';
import {
  DEPUTACION,
  FIRST_NAMES,
  LAST_NAMES,
  PERSONAS,
  REGIONAL_HOLIDAYS,
  TENANTS,
  type FacilitySeed,
  type PersonaKey,
  type TenantSeed,
} from './catalog';
import { createRandom, type Random } from './random';

const SEED = 20261203;
const RESIDENTS_PER_TENANT = 40;
const HISTORY_WEEKS = 8;
const FUTURE_DAYS = 14;

export const personaUserId = (tenantId: string, persona: PersonaKey) => `${tenantId}-${persona}`;

const asciiSlug = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '');

type UserData = Pick<
  User,
  'firstName' | 'lastName' | 'role' | 'resident' | 'concessions' | 'maskedDni' | 'phone'
>;

function buildUser(
  tenantId: string,
  id: string,
  data: UserData,
  textSize: User['preferences']['accessibility']['textSize'] = 'normal',
): User {
  return {
    ...data,
    id,
    tenantId,
    email: `${asciiSlug(data.firstName)}.${asciiSlug(data.lastName.split(' ')[0] ?? '')}${id.slice(-3).replace(/\D/g, '')}@example.org`,
    preferences: {
      language: 'gl',
      channels: ['app', 'email'],
      accessibility: { textSize, highContrast: false, reducedMotion: false },
    },
  };
}

/** The demo people, with an account in every council so any of them can be tried anywhere. */
export const personaUsers = (tenantId: string): User[] =>
  PERSONAS.map(({ key, textSize, ...data }) =>
    buildUser(tenantId, personaUserId(tenantId, key), data, textSize),
  );

const pad = (value: number) => String(value).padStart(2, '0');

/** Typical demand by hour: quiet mornings, busy evenings, livelier weekend mornings. */
function hourlyDemand(hour: number, weekday: Weekday) {
  if (weekday >= 6) return hour < 14 ? 0.45 : 0.3;
  if (hour < 14) return 0.1;
  if (hour < 18) return 0.3;
  if (hour < 22) return 0.8;
  return 0.35;
}

function schoolSeason(today: IsoDate): DateRange {
  const year = Number(today.slice(0, 4));
  const startYear = Number(today.slice(5, 7)) >= 9 ? year : year - 1;
  return { from: `${String(startYear)}-09-01`, to: `${String(startYear + 1)}-06-30` };
}

interface Occupied {
  subspaceId: string;
  start: number;
  end: number;
  blocking: boolean;
}

function seedTenant(
  db: Database,
  seed: TenantSeed,
  today: IsoDate,
  window: DateRange,
  random: Random,
) {
  const tenantId = seed.tenant.id;
  const facilityId = (key: string) => `${tenantId}-${key}`;
  const admin = personaUserId(tenantId, 'carme');
  const desk = personaUserId(tenantId, 'xose');
  const thisMonday = startOfWeek(today);
  const season = schoolSeason(today);

  db.tenants.push({ ...seed.tenant, deputacionId: DEPUTACION.id });

  const facilities = new Map<string, { facility: Facility; seed: FacilitySeed }>();
  for (const f of seed.facilities) {
    const facility: Facility = { ...f.facility, id: facilityId(f.key), tenantId };
    facilities.set(f.key, { facility, seed: f });
    db.facilities.push(facility);
    db.schedules.push({
      tenantId,
      facilityId: facility.id,
      slotMinutes: f.slotMinutes,
      weekly: f.weekly,
      exceptions: [],
    });
  }
  const facilityOf = (key: string) => {
    const entry = facilities.get(key);
    if (!entry) throw new Error(`Unknown facility ${key} in ${tenantId}`);
    return entry;
  };

  const holidayDates = new Set<IsoDate>();
  for (let year = Number(window.from.slice(0, 4)); year <= Number(season.to.slice(0, 4)); year++) {
    for (const holiday of [...REGIONAL_HOLIDAYS, seed.localHoliday]) {
      const date = `${String(year)}-${holiday.monthDay}`;
      holidayDates.add(date);
      db.holidays.push({ id: `${tenantId}-${date}`, tenantId, date, name: holiday.name });
    }
  }

  const newUser = (id: string, data: UserData) => buildUser(tenantId, id, data);

  const users = new Map(personaUsers(tenantId).map((user) => [user.id, user]));
  const residents: User[] = [];
  for (let i = 1; i <= RESIDENTS_PER_TENANT; i++) {
    const concessions: Concession[] = [];
    if (random.chance(0.15)) concessions.push('senior');
    else if (random.chance(0.1)) concessions.push('minor');
    if (random.chance(0.05)) concessions.push('largeFamily');
    if (random.chance(0.04)) concessions.push('disability');
    const user = newUser(`${tenantId}-u${pad(i)}`, {
      firstName: random.pick(FIRST_NAMES),
      lastName: `${random.pick(LAST_NAMES)} ${random.pick(LAST_NAMES)}`,
      role: 'citizen',
      resident: random.chance(0.85),
      concessions,
      maskedDni: `***${String(random.int(1000, 9999))}**`,
      phone: `6${String(random.int(10, 99))} ${String(random.int(100, 999))} ${String(random.int(100, 999))}`,
    });
    residents.push(user);
    users.set(user.id, user);
  }
  db.users.push(...users.values());

  const entities = new Map<string, Entity>();
  const entitiesById = new Map<string, Entity>();
  for (const e of seed.entities) {
    const contact = asciiSlug(e.contactName.split(' ')[0] ?? 'contacto');
    const entity: Entity = {
      id: `${tenantId}-${e.key}`,
      tenantId,
      name: e.name,
      kind: e.kind,
      registryNumber: e.registryNumber,
      contactName: e.contactName,
      phone: `6${String(random.int(10, 99))} ${String(random.int(100, 999))} ${String(random.int(100, 999))}`,
      email: `${contact}.${e.key}@example.org`,
    };
    entities.set(e.key, entity);
    entitiesById.set(entity.id, entity);
    db.entities.push(entity);
  }

  // Occupancy per facility and day, so generated bookings never overlap.
  const occupancy = new Map<string, Occupied[]>();
  const occupiedOn = (facility: Facility, date: IsoDate) => {
    const key = `${facility.id}|${date}`;
    let rows = occupancy.get(key);
    if (!rows) occupancy.set(key, (rows = []));
    return rows;
  };
  const isFree = (
    facility: Facility,
    date: IsoDate,
    subspaceId: string,
    start: number,
    end: number,
  ) => {
    const subspace = facility.subspaces.find((s) => s.id === subspaceId);
    const overlapping = occupiedOn(facility, date).filter(
      (o) =>
        o.start < end &&
        start < o.end &&
        (o.blocking || subspacesOverlap(facility, o.subspaceId, subspaceId)),
    );
    if (overlapping.some((o) => o.blocking || o.subspaceId !== subspaceId)) return false;
    return overlapping.length < (subspace?.capacity ?? 1);
  };

  const block = seed.block;
  const blocked = facilityOf(block.facilityKey).facility;
  const blockDate = addDays(thisMonday, 7 + block.weekday - 1);
  occupiedOn(blocked, blockDate).push({
    subspaceId: '*',
    start: toMinutes(block.times.start),
    end: toMinutes(block.times.end),
    blocking: true,
  });
  db.blocks.push({
    id: `${tenantId}-block-1`,
    tenantId,
    facilityId: blocked.id,
    subspaceId: null,
    dates: { from: blockDate, to: blockDate },
    times: block.times,
    reason: 'maintenance',
    note: block.note,
    createdAt: `${addDays(today, -1)}T08:30:00.000Z`,
    createdBy: admin,
  });
  db.audit.push({
    id: `${tenantId}-audit-block-1`,
    tenantId,
    at: `${addDays(today, -1)}T08:30:00.000Z`,
    actorId: admin,
    action: 'create',
    subject: 'block',
    subjectId: `${tenantId}-block-1`,
    label: blocked.name,
  });

  const codes = new Set(db.reservations.map((r) => r.code));
  const addReservation = (input: {
    facility: Facility;
    slotMinutes: number;
    subspaceId: string;
    date: IsoDate;
    start: number;
    end: number;
    holder: Holder;
    status: ReservationStatus;
    channel: Channel;
    recurringBookingId?: string;
  }) => {
    const { facility, holder, status, date } = input;
    let code = reservationCode(random.next);
    while (codes.has(code)) code = reservationCode(random.next);
    codes.add(code);

    const bookingHolder =
      holder.kind === 'user'
        ? { kind: 'user' as const, user: users.get(holder.userId) as User }
        : { kind: 'entity' as const, entity: entitiesById.get(holder.entityId) as Entity };
    const quote = computePrice(
      bookingHolder,
      facility.pricing,
      input.slotMinutes,
      input.end - input.start,
    );
    const past = date < today;
    const payment =
      quote.totalCents === 0
        ? 'free'
        : past || random.chance(0.4)
          ? 'paid'
          : initialPaymentStatus(quote);

    const createdDate = addDays(date, -random.int(0, 6));
    const latest = addDays(today, -1);
    const createdAt = `${createdDate < latest ? createdDate : latest}T${pad(random.int(7, 9))}:${pad(random.int(0, 59))}:00.000Z`;
    const createdBy = input.recurringBookingId
      ? admin
      : input.channel === 'web' && holder.kind === 'user'
        ? holder.userId
        : desk;

    const reservation: Reservation = {
      id: `${tenantId}-r${String(db.reservations.length + 1)}`,
      tenantId,
      code,
      facilityId: facility.id,
      subspaceId: input.subspaceId,
      date,
      start: fromMinutes(input.start),
      end: fromMinutes(input.end),
      holder,
      status,
      channel: input.channel,
      amountCents: quote.totalCents,
      payment,
      notes: '',
      createdAt,
      createdBy,
      history: status === 'cancelled' ? [{ at: createdAt, by: createdBy, type: 'cancelled' }] : [],
      ...(input.recurringBookingId ? { recurringBookingId: input.recurringBookingId } : {}),
    };
    db.reservations.push(reservation);
    if (status !== 'cancelled') {
      occupiedOn(facility, date).push({
        subspaceId: input.subspaceId,
        start: input.start,
        end: input.end,
        blocking: false,
      });
    }
    return reservation;
  };

  let recurringCount = 0;
  for (const pattern of seed.recurring) {
    const { facility, seed: facilitySeed } = facilityOf(pattern.facilityKey);
    const entity = entities.get(pattern.entityKey);
    if (!entity) throw new Error(`Unknown entity ${pattern.entityKey}`);
    for (const weekday of pattern.weekdays) {
      recurringCount += 1;
      const id = `${tenantId}-rb${String(recurringCount)}`;
      const booking = {
        id,
        tenantId,
        entityId: entity.id,
        facilityId: facility.id,
        subspaceId: pattern.subspaceId,
        weekday,
        times: pattern.times,
        season,
        exceptions: [],
        createdAt: `${season.from}T09:00:00.000Z`,
      };
      db.recurringBookings.push(booking);
      db.audit.push({
        id: `${tenantId}-audit-${id}`,
        tenantId,
        at: booking.createdAt,
        actorId: admin,
        action: 'create',
        subject: 'recurringBooking',
        subjectId: id,
        label: entity.name,
      });
      const start = toMinutes(pattern.times.start);
      const end = toMinutes(pattern.times.end);
      for (const date of expandRecurring(booking, { from: window.from, to: season.to })) {
        if (holidayDates.has(date) || !isFree(facility, date, pattern.subspaceId, start, end))
          continue;
        addReservation({
          facility,
          slotMinutes: facilitySeed.slotMinutes,
          subspaceId: pattern.subspaceId,
          date,
          start,
          end,
          holder: { kind: 'entity', entityId: entity.id },
          status: date < today ? 'completed' : 'confirmed',
          channel: 'inPerson',
          recurringBookingId: id,
        });
      }
    }
  }

  // A council closure cancelled one of Uxía's bookings next week; her notices offer to move it.
  {
    const { facility, seed: facilitySeed } = facilityOf(seed.personaFacility.uxia);
    const subspace = facility.subspaces[0];
    const date = addDays(thisMonday, 7 + 3 - 1);
    const uxiaId = personaUserId(tenantId, 'uxia');
    if (subspace && !holidayDates.has(date)) {
      const note = 'Reparación do valado da pista';
      const at = `${addDays(today, -1)}T09:15:00.000Z`;
      const blockId = `${tenantId}-block-2`;
      db.blocks.push({
        id: blockId,
        tenantId,
        facilityId: facility.id,
        subspaceId: subspace.id,
        dates: { from: date, to: date },
        times: { start: '16:00', end: '20:00' },
        reason: 'maintenance',
        note,
        createdAt: at,
        createdBy: admin,
      });
      occupiedOn(facility, date).push({
        subspaceId: '*',
        start: toMinutes('16:00'),
        end: toMinutes('20:00'),
        blocking: true,
      });
      const cancelled = addReservation({
        facility,
        slotMinutes: facilitySeed.slotMinutes,
        subspaceId: subspace.id,
        date,
        start: toMinutes('18:00'),
        end: toMinutes('18:00') + facilitySeed.slotMinutes,
        holder: { kind: 'user', userId: uxiaId },
        status: 'cancelled',
        channel: 'web',
      });
      cancelled.createdAt = `${addDays(today, -3)}T18:00:00.000Z`;
      cancelled.history = [{ at, by: admin, type: 'cancelled', detail: note }];
      db.notifications.push({
        id: `${tenantId}-notice-1`,
        tenantId,
        userId: uxiaId,
        type: 'councilNotice',
        channel: 'app',
        createdAt: at,
        reservationId: cancelled.id,
      });
      db.audit.push(
        {
          id: `${tenantId}-audit-${blockId}`,
          tenantId,
          at,
          actorId: admin,
          action: 'create',
          subject: 'block',
          subjectId: blockId,
          label: facility.name,
        },
        {
          id: `${tenantId}-audit-${cancelled.id}`,
          tenantId,
          at,
          actorId: admin,
          action: 'cancel',
          subject: 'reservation',
          subjectId: cancelled.id,
          label: cancelled.code,
        },
      );
    }
  }

  // Each citizen persona has a short, readable history and one booking next week.
  const plans: {
    key: 'uxia' | 'manuel' | 'brais';
    weekday: Weekday;
    nextWeekday: Weekday;
    time: string;
    past: number[];
    noShow: number[];
    channel: Channel;
  }[] = [
    {
      key: 'uxia',
      weekday: 4,
      nextWeekday: 5,
      time: '19:00',
      past: [1, 2, 3, 4],
      noShow: [],
      channel: 'web',
    },
    {
      key: 'manuel',
      weekday: 2,
      nextWeekday: 4,
      time: '11:00',
      past: [1, 2, 3, 5],
      noShow: [],
      channel: 'phone',
    },
    {
      key: 'brais',
      weekday: 5,
      nextWeekday: 1,
      time: '19:00',
      past: [2, 3],
      noShow: [1],
      channel: 'web',
    },
  ];
  for (const plan of plans) {
    const { facility, seed: facilitySeed } = facilityOf(seed.personaFacility[plan.key]);
    const holder: Holder = { kind: 'user', userId: personaUserId(tenantId, plan.key) };
    const start = toMinutes(plan.time);
    const end = start + facilitySeed.slotMinutes;
    const book = (date: IsoDate, status: ReservationStatus) => {
      if (holidayDates.has(date)) return;
      const subspace = facility.subspaces.find((s) => isFree(facility, date, s.id, start, end));
      if (subspace) {
        addReservation({
          facility,
          slotMinutes: facilitySeed.slotMinutes,
          subspaceId: subspace.id,
          date,
          start,
          end,
          holder,
          status,
          channel: plan.channel,
        });
      }
    };
    for (const weeks of plan.past)
      book(addDays(thisMonday, -7 * weeks + plan.weekday - 1), 'completed');
    for (const weeks of plan.noShow)
      book(addDays(thisMonday, -7 * weeks + plan.weekday - 1), 'noShow');
    book(addDays(thisMonday, 7 + plan.nextWeekday - 1), 'confirmed');
  }

  for (const { facility, seed: facilitySeed } of facilities.values()) {
    const step = facilitySeed.slotMinutes;
    for (let date = window.from; date <= window.to; date = addDays(date, 1)) {
      if (holidayDates.has(date)) continue;
      const weekday = weekdayOf(date);
      for (const subspace of facility.subspaces) {
        const wholeSpace = subspace.contains.length > 0 ? 0.35 : 1;
        for (const range of facilitySeed.weekly[weekday]) {
          for (
            let start = toMinutes(range.start);
            start + step <= toMinutes(range.end);
            start += step
          ) {
            const probability =
              hourlyDemand(start / 60, weekday) * facilitySeed.demand * wholeSpace;
            const attempts = subspace.capacity > 1 ? subspace.capacity : 1;
            for (let attempt = 0; attempt < attempts; attempt++) {
              if (
                !random.chance(probability) ||
                !isFree(facility, date, subspace.id, start, start + step)
              ) {
                continue;
              }
              const roll = random.next();
              const status: ReservationStatus =
                date < today
                  ? roll < 0.08
                    ? 'cancelled'
                    : roll < 0.12
                      ? 'noShow'
                      : 'completed'
                  : roll < 0.07
                    ? 'cancelled'
                    : 'confirmed';
              const channelRoll = random.next();
              addReservation({
                facility,
                slotMinutes: step,
                subspaceId: subspace.id,
                date,
                start,
                end: start + step,
                holder: { kind: 'user', userId: random.pick(residents).id },
                status,
                channel: channelRoll < 0.65 ? 'web' : channelRoll < 0.9 ? 'phone' : 'inPerson',
              });
            }
          }
        }
      }
    }
  }

  const personaIds = new Set(PERSONAS.map((p) => personaUserId(tenantId, p.key)));
  for (const reservation of db.reservations) {
    const { holder } = reservation;
    if (
      reservation.tenantId === tenantId &&
      reservation.status === 'confirmed' &&
      holder.kind === 'user' &&
      personaIds.has(holder.userId)
    ) {
      db.notifications.push({
        id: `${tenantId}-n${String(db.notifications.length + 1)}`,
        tenantId,
        userId: holder.userId,
        type: 'confirmation',
        channel: 'app',
        createdAt: reservation.createdAt,
        reservationId: reservation.id,
      });
    }
  }
}

/** Deterministic demo data: the same `today` always produces the same database. */
export function generateSeed(today: IsoDate): Database {
  const random = createRandom(SEED);
  const db: Database = {
    version: SCHEMA_VERSION,
    generatedFor: today,
    deputacions: [DEPUTACION],
    tenants: [],
    facilities: [],
    schedules: [],
    holidays: [],
    blocks: [],
    reservations: [],
    recurringBookings: [],
    users: [],
    entities: [],
    notifications: [],
    audit: [],
  };
  const window = {
    from: addDays(startOfWeek(today), -7 * HISTORY_WEEKS),
    to: addDays(today, FUTURE_DAYS),
  };
  for (const tenant of TENANTS) seedTenant(db, tenant, today, window, random);
  return db;
}
