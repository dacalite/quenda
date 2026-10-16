// SPDX-License-Identifier: EUPL-1.2
import {
  canBook,
  resolveRules,
  type BookingContext,
  type BookingHolder,
} from '../../../domain/rules/booking';
import { computeIndicators } from '../../../domain/analytics/indicators';
import { attendanceOf, canCheckIn } from '../../../domain/rules/attendance';
import { affectedByBlock } from '../../../domain/rules/blocks';
import { canCancel, canModify } from '../../../domain/rules/cancellation';
import { occupancyByStart, recommendSlots } from '../../../domain/recommendations/recommend';
import { getAvailability } from '../../../domain/rules/availability';
import { computePrice, initialPaymentStatus } from '../../../domain/rules/pricing';
import { detectConflicts, expandRecurring } from '../../../domain/rules/recurring';
import { reservationCode } from '../../../domain/reservationCode';
import { toMinutes, zonedNow, type LocalDateTime } from '../../../domain/time';
import {
  validateFacility,
  validateSchedule,
  validateTenant,
  type FieldProblem,
} from '../../../domain/validation';
import type {
  AuditAction,
  AuditSubject,
  Facility,
  Holder,
  Id,
  Notification,
  NotificationChannel,
  NotificationType,
  Reservation,
  ReservationEvent,
  Schedule,
  Slot,
  Tenant,
} from '../../../domain/types';
import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
  RuleViolationError,
  ValidationError,
} from '../../ports/errors';
import type { BlockInput, RecurringBookingInput, Repositories } from '../../ports/repositories';
import type { LocalDatabase } from './database';

export interface Session {
  userId: Id;
}

export interface LocalAdapterOptions {
  db: LocalDatabase;
  /** Who is acting, as the server would read it from the authentication token. */
  session: () => Session | null;
  now?: () => Date;
  /** Simulated network latency in ms; `false` in tests. */
  latency?: { min: number; max: number } | false;
  random?: () => number;
}

type Row = { id: Id; tenantId: Id };

const valid = (problems: FieldProblem[]) => {
  if (problems.length > 0) throw new ValidationError(problems);
};

// New facilities open on weekdays and Saturday mornings until the council edits the schedule.
const defaultSchedule = (tenantId: Id, facilityId: Id): Schedule => {
  const weekday = [{ start: '09:00', end: '22:00' }];
  return {
    tenantId,
    facilityId,
    slotMinutes: 60,
    weekly: {
      1: weekday,
      2: weekday,
      3: weekday,
      4: weekday,
      5: weekday,
      6: [{ start: '10:00', end: '14:00' }],
      7: [],
    },
    exceptions: [],
  };
};

const holderKey = (holder: Holder) =>
  holder.kind === 'user' ? `user:${holder.userId}` : `entity:${holder.entityId}`;

export function createLocalRepositories({
  db,
  session,
  now = () => new Date(),
  latency = { min: 150, max: 400 },
  random = Math.random,
}: LocalAdapterOptions): Repositories {
  const data = () => db.read();

  // Every call resolves asynchronously with a copy, like a response body would.
  const respond = async <T>(produce: () => T): Promise<T> => {
    if (latency) {
      const ms = latency.min + random() * (latency.max - latency.min);
      await new Promise((resolve) => setTimeout(resolve, ms));
    }
    return structuredClone(produce());
  };

  const actorId = () => session()?.userId ?? 'anonymous';
  const instant = () => now().toISOString();
  const newId = (prefix: string) =>
    `${prefix}-${Date.now().toString(36)}${Math.floor(random() * 1e6).toString(36)}`;

  const scoped = <T extends { tenantId: Id }>(rows: T[], tenantId: Id) =>
    rows.filter((row) => row.tenantId === tenantId);

  const findIn = <T extends Row>(rows: T[], tenantId: Id, id: Id, resource: string): T => {
    const row = rows.find((r) => r.id === id && r.tenantId === tenantId);
    if (!row) throw new NotFoundError(resource, id);
    return row;
  };

  const tenantOf = (tenantId: Id): Tenant => {
    const tenant = data().tenants.find((t) => t.id === tenantId);
    if (!tenant) throw new NotFoundError('tenant', tenantId);
    return tenant;
  };

  const localNow = (tenantId: Id): LocalDateTime => zonedNow(now(), tenantOf(tenantId).timeZone);

  const audit = (
    tenantId: Id,
    action: AuditAction,
    subject: AuditSubject,
    subjectId: Id,
    label: string,
  ) => {
    data().audit.push({
      id: newId('audit'),
      tenantId,
      at: instant(),
      actorId: actorId(),
      action,
      subject,
      subjectId,
      label,
    });
  };

  const notify = (
    reservation: Reservation,
    type: NotificationType,
    channel: NotificationChannel = 'app',
  ) => {
    if (reservation.holder.kind !== 'user') return;
    const notification: Notification = {
      id: newId('notification'),
      tenantId: reservation.tenantId,
      userId: reservation.holder.userId,
      type,
      channel,
      createdAt: instant(),
      reservationId: reservation.id,
    };
    data().notifications.push(notification);
  };

  const holderOf = (tenantId: Id, holder: Holder): BookingHolder =>
    holder.kind === 'user'
      ? { kind: 'user', user: findIn(data().users, tenantId, holder.userId, 'user') }
      : { kind: 'entity', entity: findIn(data().entities, tenantId, holder.entityId, 'entity') };

  const scheduleOf = (tenantId: Id, facilityId: Id) => {
    const schedule = data().schedules.find(
      (s) => s.tenantId === tenantId && s.facilityId === facilityId,
    );
    if (!schedule) throw new NotFoundError('schedule', facilityId);
    return schedule;
  };

  const facilityContext = (tenantId: Id, facility: Facility) => ({
    facility,
    schedule: scheduleOf(tenantId, facility.id),
    holidays: scoped(data().holidays, tenantId),
    blocks: scoped(data().blocks, tenantId).filter((b) => b.facilityId === facility.id),
    reservations: scoped(data().reservations, tenantId).filter((r) => r.facilityId === facility.id),
    now: localNow(tenantId),
  });

  const bookingContext = (tenantId: Id, facilityId: Id, holder: Holder): BookingContext => {
    const facility = findIn(data().facilities, tenantId, facilityId, 'facility');
    return {
      ...facilityContext(tenantId, facility),
      rules: resolveRules(tenantOf(tenantId).defaultRules, facility.rules),
      holderReservations: scoped(data().reservations, tenantId).filter(
        (r) => holderKey(r.holder) === holderKey(holder),
      ),
    };
  };

  // The server knows who is calling from the session: staff see their whole council,
  // residents only their own data, and anonymous visitors only public information.
  const caller = (tenantId: Id) => {
    const id = session()?.userId;
    return id ? data().users.find((u) => u.id === id && u.tenantId === tenantId) : undefined;
  };
  const isStaff = (tenantId: Id) => {
    const role = caller(tenantId)?.role;
    return role === 'staff' || role === 'admin';
  };
  const requireStaff = (tenantId: Id) => {
    if (!isStaff(tenantId)) throw new ForbiddenError('Only council staff can do this');
  };
  const requireAdmin = (tenantId: Id) => {
    if (caller(tenantId)?.role !== 'admin') {
      throw new ForbiddenError('Only council administrators can do this');
    }
  };
  /** The resident's own id, `null` for staff, or a 403 for anonymous callers. */
  const ownerScope = (tenantId: Id): Id | null => {
    const user = caller(tenantId);
    if (!user) throw new ForbiddenError('Sign in first');
    return user.role === 'citizen' ? user.id : null;
  };
  const ownsReservation = (tenantId: Id, reservation: Reservation) => {
    const owner = ownerScope(tenantId);
    return (
      owner === null || (reservation.holder.kind === 'user' && reservation.holder.userId === owner)
    );
  };
  const visibleReservation = (tenantId: Id, id: Id) => {
    const reservation = findIn(data().reservations, tenantId, id, 'reservation');
    if (!ownsReservation(tenantId, reservation)) throw new NotFoundError('reservation', id);
    return reservation;
  };
  const requireSelfOrStaff = (tenantId: Id, userId: Id) => {
    const owner = ownerScope(tenantId);
    if (owner !== null && owner !== userId) throw new NotFoundError('user', userId);
  };
  const requireHolderAllowed = (tenantId: Id, holder: Holder) => {
    const owner = ownerScope(tenantId);
    if (owner !== null && (holder.kind !== 'user' || holder.userId !== owner)) {
      throw new ForbiddenError('Residents can only book for themselves');
    }
  };

  const reject = (violations: ConstructorParameters<typeof RuleViolationError>[0]): never => {
    if (violations.every((v) => v.code === 'unavailable')) {
      throw new ConflictError('The selected time is no longer available');
    }
    throw new RuleViolationError(violations);
  };

  const price = (tenantId: Id, slot: Slot, holder: BookingHolder) => {
    const facility = findIn(data().facilities, tenantId, slot.facilityId, 'facility');
    const { slotMinutes } = scheduleOf(tenantId, facility.id);
    return computePrice(
      holder,
      facility.pricing,
      slotMinutes,
      toMinutes(slot.end) - toMinutes(slot.start),
    );
  };

  const event = (type: ReservationEvent['type'], detail?: string): ReservationEvent => ({
    at: instant(),
    by: actorId(),
    type,
    ...(detail ? { detail } : {}),
  });

  const uniqueCode = (tenantId: Id) => {
    const taken = new Set(scoped(data().reservations, tenantId).map((r) => r.code));
    let code = reservationCode(random);
    while (taken.has(code)) code = reservationCode(random);
    return code;
  };

  const mutateReservation = (tenantId: Id, id: Id, change: (r: Reservation) => void) => {
    const reservation = visibleReservation(tenantId, id);
    change(reservation);
    db.commit();
    return reservation;
  };

  const blockImpact = (tenantId: Id, input: BlockInput) => {
    const facility = findIn(data().facilities, tenantId, input.facilityId, 'facility');
    return {
      facility,
      affected: affectedByBlock(
        facility,
        input,
        scoped(data().reservations, tenantId),
        localNow(tenantId),
      ),
    };
  };

  const recurringConflicts = (tenantId: Id, input: RecurringBookingInput) => {
    const facility = findIn(data().facilities, tenantId, input.facilityId, 'facility');
    const context = facilityContext(tenantId, facility);
    const from = context.now.date > input.season.from ? context.now.date : input.season.from;
    return { context, dates: expandRecurring(input, { from, to: input.season.to }) };
  };

  const repositories: Repositories = {
    tenants: {
      list: () => respond(() => data().tenants),
      getBySlug: (slug) =>
        respond(() => {
          const tenant = data().tenants.find((t) => t.slug === slug);
          if (!tenant) throw new NotFoundError('tenant', slug);
          return tenant;
        }),
      update: (tenantId, patch) =>
        respond(() => {
          requireAdmin(tenantId);
          const tenant = tenantOf(tenantId);
          valid(validateTenant({ ...tenant, ...patch }));
          Object.assign(tenant, patch);
          audit(tenantId, 'update', 'tenant', tenantId, tenant.name);
          db.commit();
          return tenant;
        }),
    },

    facilities: {
      list: (tenantId) => respond(() => scoped(data().facilities, tenantId)),
      get: (tenantId, id) => respond(() => findIn(data().facilities, tenantId, id, 'facility')),
      create: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          valid(validateFacility(input));
          const facility: Facility = { ...input, id: newId('facility'), tenantId };
          data().facilities.push(facility);
          data().schedules.push(defaultSchedule(tenantId, facility.id));
          audit(tenantId, 'create', 'facility', facility.id, facility.name);
          db.commit();
          return facility;
        }),
      update: (tenantId, id, patch) =>
        respond(() => {
          requireAdmin(tenantId);
          const facility = findIn(data().facilities, tenantId, id, 'facility');
          valid(validateFacility({ ...facility, ...patch }));
          Object.assign(facility, patch);
          audit(tenantId, 'update', 'facility', id, facility.name);
          db.commit();
          return facility;
        }),
      availability: (tenantId, facilityId, date) =>
        respond(() => {
          const facility = findIn(data().facilities, tenantId, facilityId, 'facility');
          return getAvailability(facilityContext(tenantId, facility), date);
        }),
      recommendations: (tenantId, facilityId, date) =>
        respond(() => {
          const facility = findIn(data().facilities, tenantId, facilityId, 'facility');
          const context = facilityContext(tenantId, facility);
          return recommendSlots(getAvailability(context, date), occupancyByStart(context, date));
        }),
    },

    schedules: {
      get: (tenantId, facilityId) => respond(() => scheduleOf(tenantId, facilityId)),
      save: (tenantId, schedule) =>
        respond(() => {
          requireAdmin(tenantId);
          const facility = findIn(data().facilities, tenantId, schedule.facilityId, 'facility');
          const stored = scheduleOf(tenantId, facility.id);
          valid(validateSchedule(schedule));
          Object.assign(stored, { ...schedule, tenantId });
          audit(tenantId, 'update', 'schedule', facility.id, facility.name);
          db.commit();
          return stored;
        }),
      listHolidays: (tenantId) =>
        respond(() =>
          scoped(data().holidays, tenantId).sort((a, b) => a.date.localeCompare(b.date)),
        ),
      createHoliday: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          if (scoped(data().holidays, tenantId).some((h) => h.date === input.date)) {
            throw new ConflictError('There is already a holiday on that date');
          }
          const holiday = { ...input, id: newId('holiday'), tenantId };
          data().holidays.push(holiday);
          audit(tenantId, 'create', 'schedule', holiday.id, input.date);
          db.commit();
          return holiday;
        }),
      deleteHoliday: (tenantId, id) =>
        respond(() => {
          requireAdmin(tenantId);
          const holiday = findIn(data().holidays, tenantId, id, 'holiday');
          data().holidays = data().holidays.filter((h) => h !== holiday);
          audit(tenantId, 'delete', 'schedule', id, holiday.date);
          db.commit();
        }),
      listBlocks: (tenantId, filter = {}) =>
        respond(() =>
          scoped(data().blocks, tenantId).filter(
            (b) =>
              (!filter.facilityId || b.facilityId === filter.facilityId) &&
              (!filter.from || b.dates.to >= filter.from) &&
              (!filter.to || b.dates.from <= filter.to),
          ),
        ),
      previewBlock: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          return blockImpact(tenantId, input).affected;
        }),
      createBlock: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          const { facility, affected } = blockImpact(tenantId, input);
          for (const reservation of affected) {
            reservation.status = 'cancelled';
            reservation.history.push(event('cancelled', input.note || undefined));
            notify(reservation, 'councilNotice');
            audit(tenantId, 'cancel', 'reservation', reservation.id, reservation.code);
          }
          const block = {
            ...input,
            id: newId('block'),
            tenantId,
            createdAt: instant(),
            createdBy: actorId(),
          };
          data().blocks.push(block);
          audit(tenantId, 'create', 'block', block.id, facility.name);
          db.commit();
          return block;
        }),
      deleteBlock: (tenantId, id) =>
        respond(() => {
          requireAdmin(tenantId);
          const block = findIn(data().blocks, tenantId, id, 'block');
          data().blocks = data().blocks.filter((b) => b !== block);
          audit(tenantId, 'delete', 'block', id, block.note);
          db.commit();
        }),
    },

    reservations: {
      list: (tenantId, filter = {}) =>
        respond(() =>
          scoped(data().reservations, tenantId).filter(
            (r) =>
              ownsReservation(tenantId, r) &&
              (!filter.facilityId || r.facilityId === filter.facilityId) &&
              (!filter.holder || holderKey(r.holder) === holderKey(filter.holder)) &&
              (!filter.from || r.date >= filter.from) &&
              (!filter.to || r.date <= filter.to) &&
              (!filter.status || filter.status.includes(r.status)),
          ),
        ),
      get: (tenantId, id) => respond(() => visibleReservation(tenantId, id)),
      getByCode: (tenantId, code) =>
        respond(() => {
          const normalized = code.trim().toUpperCase();
          const reservation = scoped(data().reservations, tenantId).find(
            (r) => r.code === normalized,
          );
          if (!reservation || !ownsReservation(tenantId, reservation)) {
            throw new NotFoundError('reservation', code);
          }
          return reservation;
        }),
      quote: (tenantId, input, replaces) =>
        respond(() => {
          const {
            holder,
            channel: _channel,
            notes: _notes,
            confirmBy: _confirmBy,
            ...slot
          } = input;
          requireHolderAllowed(tenantId, holder);
          const bookingHolder = holderOf(tenantId, holder);
          const context = bookingContext(tenantId, slot.facilityId, holder);
          const decision = replaces
            ? canModify(context, bookingHolder, visibleReservation(tenantId, replaces), slot)
            : canBook(context, bookingHolder, slot);
          return {
            price: price(tenantId, slot, bookingHolder),
            violations: decision.ok ? [] : decision.violations,
          };
        }),
      create: (tenantId, input) =>
        respond(() => {
          const { holder, channel, notes = '', confirmBy, ...slot } = input;
          requireHolderAllowed(tenantId, holder);
          const bookingHolder = holderOf(tenantId, holder);
          const decision = canBook(
            bookingContext(tenantId, slot.facilityId, holder),
            bookingHolder,
            slot,
          );
          if (!decision.ok) reject(decision.violations);

          const quote = price(tenantId, slot, bookingHolder);
          const reservation: Reservation = {
            ...slot,
            id: newId('reservation'),
            tenantId,
            code: uniqueCode(tenantId),
            holder,
            status: 'confirmed',
            channel,
            amountCents: quote.totalCents,
            payment: initialPaymentStatus(quote),
            notes,
            createdAt: instant(),
            createdBy: actorId(),
            history: [event('created')],
          };
          data().reservations.push(reservation);
          notify(reservation, 'confirmation', confirmBy);
          audit(tenantId, 'create', 'reservation', reservation.id, reservation.code);
          db.commit();
          return reservation;
        }),
      reschedule: (tenantId, id, slot) =>
        respond(() => {
          const reservation = visibleReservation(tenantId, id);
          const bookingHolder = holderOf(tenantId, reservation.holder);
          const decision = canModify(
            bookingContext(tenantId, slot.facilityId, reservation.holder),
            bookingHolder,
            reservation,
            slot,
          );
          if (!decision.ok) reject(decision.violations);

          const before = `${reservation.date} ${reservation.start}`;
          Object.assign(reservation, slot, {
            amountCents: price(tenantId, slot, bookingHolder).totalCents,
          });
          reservation.history.push(event('rescheduled', before));
          notify(reservation, 'change');
          audit(tenantId, 'reschedule', 'reservation', id, reservation.code);
          db.commit();
          return reservation;
        }),
      cancel: (tenantId, id) =>
        respond(() =>
          mutateReservation(tenantId, id, (reservation) => {
            const decision = canCancel(
              reservation,
              resolveRules(
                tenantOf(tenantId).defaultRules,
                findIn(data().facilities, tenantId, reservation.facilityId, 'facility').rules,
              ),
              localNow(tenantId),
            );
            if (!decision.ok) reject(decision.violations);
            reservation.status = 'cancelled';
            reservation.history.push(event('cancelled'));
            notify(reservation, isStaff(tenantId) ? 'councilNotice' : 'cancellation');
            audit(tenantId, 'cancel', 'reservation', id, reservation.code);
          }),
        ),
      checkIn: (tenantId, id) =>
        respond(() => {
          requireStaff(tenantId);
          return mutateReservation(tenantId, id, (reservation) => {
            if (!canCheckIn(reservation, localNow(tenantId))) {
              throw new ConflictError('Check-in is only open on the day, until the booking ends');
            }
            reservation.checkedInAt = instant();
            reservation.history.push(event('checkedIn'));
            audit(tenantId, 'checkIn', 'reservation', id, reservation.code);
          });
        }),
      markNoShow: (tenantId, id) =>
        respond(() => {
          requireStaff(tenantId);
          return mutateReservation(tenantId, id, (reservation) => {
            if (attendanceOf(reservation, localNow(tenantId)) !== 'unrecorded') {
              throw new ConflictError('Only finished bookings without a check-in can be no-shows');
            }
            reservation.status = 'noShow';
            reservation.history.push(event('noShow'));
            audit(tenantId, 'noShow', 'reservation', id, reservation.code);
          });
        }),
    },

    recurringBookings: {
      list: (tenantId, filter = {}) =>
        respond(() =>
          scoped(data().recurringBookings, tenantId).filter(
            (b) =>
              (!filter.entityId || b.entityId === filter.entityId) &&
              (!filter.facilityId || b.facilityId === filter.facilityId),
          ),
        ),
      preview: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          findIn(data().entities, tenantId, input.entityId, 'entity');
          const { context, dates } = recurringConflicts(tenantId, input);
          return detectConflicts(context, input, dates);
        }),
      create: (tenantId, input) =>
        respond(() => {
          requireAdmin(tenantId);
          const entity = findIn(data().entities, tenantId, input.entityId, 'entity');
          const { context, dates } = recurringConflicts(tenantId, input);
          const conflicts = new Set(detectConflicts(context, input, dates).map((c) => c.date));
          const booking = { ...input, id: newId('recurring'), tenantId, createdAt: instant() };
          data().recurringBookings.push(booking);

          const holder: Holder = { kind: 'entity', entityId: entity.id };
          const quote = price(
            tenantId,
            { ...input, ...input.times, date: input.season.from },
            holderOf(tenantId, holder),
          );
          for (const date of dates.filter((d) => !conflicts.has(d))) {
            data().reservations.push({
              id: newId('reservation'),
              tenantId,
              code: uniqueCode(tenantId),
              facilityId: input.facilityId,
              subspaceId: input.subspaceId,
              date,
              ...input.times,
              holder,
              status: 'confirmed',
              channel: 'inPerson',
              amountCents: quote.totalCents,
              payment: initialPaymentStatus(quote),
              notes: '',
              createdAt: instant(),
              createdBy: actorId(),
              recurringBookingId: booking.id,
              history: [event('created')],
            });
          }
          audit(tenantId, 'create', 'recurringBooking', booking.id, entity.name);
          db.commit();
          return booking;
        }),
    },

    users: {
      list: (tenantId, filter = {}) =>
        respond(() => {
          requireStaff(tenantId);
          const search = filter.search?.trim().toLowerCase();
          const digits = search?.replace(/\D/g, '');
          return scoped(data().users, tenantId).filter(
            (u) =>
              (!filter.roles || filter.roles.includes(u.role)) &&
              (!search ||
                `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search) ||
                (!!digits && u.phone.replace(/\D/g, '').includes(digits))),
          );
        }),
      get: (tenantId, id) =>
        respond(() => {
          requireSelfOrStaff(tenantId, id);
          return findIn(data().users, tenantId, id, 'user');
        }),
      create: (tenantId, input) =>
        respond(() => {
          requireStaff(tenantId);
          const user = { ...input, id: newId('user'), tenantId };
          data().users.push(user);
          audit(tenantId, 'create', 'user', user.id, `${user.firstName} ${user.lastName}`);
          db.commit();
          return user;
        }),
      update: (tenantId, id, patch) =>
        respond(() => {
          requireSelfOrStaff(tenantId, id);
          const user = findIn(data().users, tenantId, id, 'user');
          Object.assign(user, patch);
          db.commit();
          return user;
        }),
    },

    entities: {
      list: (tenantId) => respond(() => scoped(data().entities, tenantId)),
      get: (tenantId, id) => respond(() => findIn(data().entities, tenantId, id, 'entity')),
    },

    notifications: {
      list: (tenantId, userId) =>
        respond(() => {
          requireSelfOrStaff(tenantId, userId);
          return scoped(data().notifications, tenantId)
            .filter((n) => n.userId === userId)
            .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }),
      markRead: (tenantId, id) =>
        respond(() => {
          const notification = findIn(data().notifications, tenantId, id, 'notification');
          requireSelfOrStaff(tenantId, notification.userId);
          notification.readAt ??= instant();
          db.commit();
          return notification;
        }),
    },

    indicators: {
      get: (tenantId, range) =>
        respond(() => {
          requireStaff(tenantId);
          const facilities = scoped(data().facilities, tenantId);
          return computeIndicators(
            {
              facilities: facilities.map((facility) => ({
                facility,
                schedule: scheduleOf(tenantId, facility.id),
              })),
              holidays: scoped(data().holidays, tenantId),
              blocks: scoped(data().blocks, tenantId),
              reservations: scoped(data().reservations, tenantId),
            },
            range,
          );
        }),
    },

    audit: {
      list: (tenantId) =>
        respond(() => {
          requireAdmin(tenantId);
          return scoped(data().audit, tenantId).sort((a, b) => b.at.localeCompare(a.at));
        }),
    },
  };

  return repositories;
}
