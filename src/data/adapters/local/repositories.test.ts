// SPDX-License-Identifier: EUPL-1.2
import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAvailability } from '../../../domain/rules/availability';
import { addDays } from '../../../domain/time';
import type { Holder, IsoDate, Slot } from '../../../domain/types';
import { ConflictError, NotFoundError, RuleViolationError } from '../../ports/errors';
import { generateSeed, personaUserId } from '../../seed/generate';
import { createRandom } from '../../seed/random';
import { createLocalDatabase, type Database } from './database';
import { createLocalRepositories } from './repositories';

const TODAY = '2026-10-15';
const NOW = new Date('2026-10-15T08:00:00Z'); // 10:00 in Galicia
const TOMORROW = addDays(TODAY, 1);
const SEED = generateSeed(TODAY);
const A = 'bouzalonga';
const B = 'ribasmeiras';

class MemoryStorage implements Storage {
  #items = new Map<string, string>();
  get length() {
    return this.#items.size;
  }
  clear() {
    this.#items.clear();
  }
  getItem(key: string) {
    return this.#items.get(key) ?? null;
  }
  key(index: number) {
    return [...this.#items.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.#items.delete(key);
  }
  setItem(key: string, value: string) {
    this.#items.set(key, value);
  }
}

function setup({ userId = personaUserId(B, 'uxia'), storage = new MemoryStorage() } = {}) {
  let session = { userId };
  const db = createLocalDatabase(storage, 'test.db', () => structuredClone(SEED));
  const repos = createLocalRepositories({
    db,
    session: () => session,
    now: () => NOW,
    latency: false,
    random: createRandom(7).next,
  });
  return {
    repos,
    db,
    actAs: (id: string) => {
      session = { userId: id };
    },
  };
}

function freeSlot(db: Database, facilityId: string, date: IsoDate, exclude: Slot[] = []): Slot {
  const facility = db.facilities.find((f) => f.id === facilityId);
  const schedule = db.schedules.find((s) => s.facilityId === facilityId);
  if (!facility || !schedule) throw new Error(`No facility ${facilityId}`);
  const slot = getAvailability(
    {
      facility,
      schedule,
      holidays: db.holidays,
      blocks: db.blocks,
      reservations: db.reservations,
      now: { date: TODAY, time: '12:00' },
    },
    date,
  ).find(
    (s) =>
      s.status === 'free' &&
      !exclude.some((e) => e.subspaceId === s.subspaceId && e.start === s.start),
  );
  if (!slot) throw new Error(`No free slot in ${facilityId} on ${date}`);
  return {
    facilityId: slot.facilityId,
    subspaceId: slot.subspaceId,
    date: slot.date,
    start: slot.start,
    end: slot.end,
  };
}

const uxia: Holder = { kind: 'user', userId: personaUserId(B, 'uxia') };
const manuel: Holder = { kind: 'user', userId: personaUserId(B, 'manuel') };

afterEach(() => {
  vi.useRealTimers();
});

describe('tenant isolation', () => {
  it('never returns rows that belong to another council', async () => {
    const { repos } = setup();
    const lists = await Promise.all([
      repos.facilities.list(A),
      repos.reservations.list(A),
      repos.users.list(A),
      repos.entities.list(A),
      repos.schedules.listHolidays(A),
      repos.schedules.listBlocks(A),
      repos.recurringBookings.list(A),
      repos.audit.list(A),
      repos.notifications.list(A, personaUserId(A, 'uxia')),
    ]);
    for (const rows of lists) {
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.every((row) => row.tenantId === A)).toBe(true);
    }
  });

  it('answers "not found" when asked for another council’s row by id or code', async () => {
    const { repos, db } = setup();
    const data = db.read();
    const foreign = <T extends { tenantId: string }>(rows: T[]) => {
      const row = rows.find((r) => r.tenantId === B);
      if (!row) throw new Error('missing fixture');
      return row;
    };
    const facility = foreign(data.facilities);
    const reservation = foreign(data.reservations);

    await expect(repos.facilities.get(A, facility.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos.schedules.get(A, facility.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos.reservations.get(A, reservation.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos.reservations.getByCode(A, reservation.code)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(repos.reservations.cancel(A, reservation.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(repos.users.get(A, foreign(data.users).id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos.entities.get(A, foreign(data.entities).id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
    await expect(
      repos.notifications.markRead(A, foreign(data.notifications).id),
    ).rejects.toBeInstanceOf(NotFoundError);
    await expect(repos.schedules.deleteBlock(A, foreign(data.blocks).id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('refuses to book another council’s facility or on behalf of its residents', async () => {
    const { repos, db } = setup();
    const foreignSlot = freeSlot(db.read(), `${B}-tenis`, TOMORROW);
    await expect(
      repos.reservations.create(A, { ...foreignSlot, holder: uxia, channel: 'web' }),
    ).rejects.toBeInstanceOf(NotFoundError);

    const localSlot = freeSlot(db.read(), `${A}-tenis`, TOMORROW);
    await expect(
      repos.reservations.create(A, { ...localSlot, holder: uxia, channel: 'web' }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });
});

describe('reservations', () => {
  it('creates a priced, notified and audited reservation', async () => {
    const { repos, db } = setup();
    const slot = freeSlot(db.read(), `${B}-tenis`, TOMORROW);
    const reservation = await repos.reservations.create(B, {
      ...slot,
      holder: uxia,
      channel: 'web',
    });

    expect(reservation).toMatchObject({
      ...slot,
      status: 'confirmed',
      amountCents: 350,
      payment: 'pending',
      createdBy: uxia.userId,
    });
    expect(reservation.code).toMatch(/^QDA-[A-Z2-9]{4}$/);
    expect(await repos.reservations.getByCode(B, reservation.code.toLowerCase())).toEqual(
      reservation,
    );

    const notifications = await repos.notifications.list(B, uxia.userId);
    expect(notifications.find((n) => n.reservationId === reservation.id)?.type).toBe(
      'confirmation',
    );
    const audit = await repos.audit.list(B);
    expect(audit.find((e) => e.subjectId === reservation.id)?.action).toBe('create');
  });

  it('rejects a taken slot with a conflict and broken rules with their reasons', async () => {
    const { repos, db } = setup();
    const slot = freeSlot(db.read(), `${B}-tenis`, TOMORROW);
    await repos.reservations.create(B, { ...slot, holder: uxia, channel: 'web' });
    await expect(
      repos.reservations.create(B, { ...slot, holder: manuel, channel: 'phone' }),
    ).rejects.toBeInstanceOf(ConflictError);

    const brais: Holder = { kind: 'user', userId: personaUserId(B, 'brais') };
    const pool = freeSlot(db.read(), `${B}-piscina`, TOMORROW);
    const error: unknown = await repos.reservations
      .create(B, { ...pool, holder: brais, channel: 'web' })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(RuleViolationError);
    expect((error as RuleViolationError).violations).toEqual([{ code: 'residentsOnly' }]);
  });

  it('reschedules and cancels, keeping history and notifying the holder', async () => {
    const { repos, db } = setup();
    const first = freeSlot(db.read(), `${B}-tenis`, addDays(TODAY, 3));
    const reservation = await repos.reservations.create(B, {
      ...first,
      holder: uxia,
      channel: 'web',
    });
    const second = freeSlot(db.read(), `${B}-tenis`, addDays(TODAY, 4));

    const moved = await repos.reservations.reschedule(B, reservation.id, second);
    expect(moved).toMatchObject({ date: second.date, start: second.start });
    expect(moved.history.map((e) => e.type)).toEqual(['created', 'rescheduled']);

    const cancelled = await repos.reservations.cancel(B, reservation.id);
    expect(cancelled.status).toBe('cancelled');
    const types = (await repos.notifications.list(B, uxia.userId)).map((n) => n.type);
    expect(types).toEqual(expect.arrayContaining(['confirmation', 'change', 'cancellation']));

    await expect(repos.reservations.cancel(B, reservation.id)).rejects.toBeInstanceOf(
      RuleViolationError,
    );
  });

  it('tells the holder when the council cancels for them', async () => {
    const { repos, db, actAs } = setup();
    const slot = freeSlot(db.read(), `${B}-tenis`, addDays(TODAY, 3));
    const reservation = await repos.reservations.create(B, {
      ...slot,
      holder: uxia,
      channel: 'web',
    });
    actAs(personaUserId(B, 'carme'));
    await repos.reservations.cancel(B, reservation.id);
    const types = (await repos.notifications.list(B, uxia.userId))
      .filter((n) => n.reservationId === reservation.id)
      .map((n) => n.type);
    expect(types.sort()).toEqual(['confirmation', 'councilNotice']);
  });

  it('checks in today’s reservations and marks no-shows', async () => {
    const { repos, db } = setup();
    const first = freeSlot(db.read(), `${B}-tenis`, TODAY);
    const checkedIn = await repos.reservations.create(B, {
      ...first,
      holder: uxia,
      channel: 'web',
    });
    const absent = await repos.reservations.create(B, {
      ...freeSlot(db.read(), `${B}-tenis`, TODAY, [first]),
      holder: manuel,
      channel: 'phone',
    });

    expect((await repos.reservations.checkIn(B, checkedIn.id)).checkedInAt).toBeDefined();
    await expect(repos.reservations.markNoShow(B, checkedIn.id)).rejects.toBeInstanceOf(
      ConflictError,
    );
    expect((await repos.reservations.markNoShow(B, absent.id)).status).toBe('noShow');
    await expect(repos.reservations.checkIn(B, absent.id)).rejects.toBeInstanceOf(ConflictError);
  });

  it('filters by facility, holder, dates and status', async () => {
    const { repos } = setup();
    const own = await repos.reservations.list(B, {
      holder: uxia,
      from: TODAY,
      status: ['confirmed'],
    });
    expect(own.length).toBeGreaterThan(0);
    expect(own.every((r) => r.date >= TODAY && r.status === 'confirmed')).toBe(true);

    const pool = await repos.reservations.list(B, { facilityId: `${B}-piscina`, to: TODAY });
    expect(pool.length).toBeGreaterThan(0);
    expect(pool.every((r) => r.facilityId === `${B}-piscina` && r.date <= TODAY)).toBe(true);
  });
});

describe('recurring bookings', () => {
  const pattern = (subspaceId: string, start: string, end: string) => ({
    entityId: `${B}-patinaxe`,
    facilityId: `${B}-pavillon`,
    subspaceId,
    weekday: 1 as const,
    times: { start, end },
    season: { from: '2026-09-01', to: '2026-12-31' },
    exceptions: [],
  });

  it('previews the clashes with existing season bookings', async () => {
    const { repos } = setup();
    const conflicts = await repos.recurringBookings.preview(B, pattern('full', '18:00', '20:00'));
    expect(conflicts.length).toBeGreaterThan(5);
    expect(conflicts.every((c) => c.problem === 'booked' || c.problem === 'closed')).toBe(true);
  });

  it('books every date without a conflict, for free', async () => {
    const { repos } = setup({ userId: personaUserId(B, 'carme') });
    const input = pattern('court-1', '09:00', '10:00');
    const conflicts = await repos.recurringBookings.preview(B, input);
    const booking = await repos.recurringBookings.create(B, input);
    const instances = (await repos.reservations.list(B)).filter(
      (r) => r.recurringBookingId === booking.id,
    );
    expect(instances.length).toBeGreaterThan(5);
    expect(instances.some((r) => conflicts.some((c) => c.date === r.date))).toBe(false);
    expect(instances.every((r) => r.amountCents === 0 && r.payment === 'free')).toBe(true);
    expect(await repos.recurringBookings.list(B, { entityId: `${B}-patinaxe` })).toContainEqual(
      booking,
    );
  });
});

describe('other repositories', () => {
  it('finds residents by name or phone, and staff by role', async () => {
    const { repos } = setup();
    const [byName] = await repos.users.list(B, { search: 'manuel castro' });
    expect(byName?.id).toBe(manuel.userId);
    const byPhone = await repos.users.list(B, { search: '600100871' });
    expect(byPhone.map((u) => u.id)).toEqual([manuel.userId]);
    expect(await repos.users.list(B, { roles: ['staff', 'admin'] })).toHaveLength(2);
  });

  it('creates and updates council data, leaving an audit trail', async () => {
    const { repos } = setup({ userId: personaUserId(B, 'carme') });
    const [template] = await repos.facilities.list(B);
    if (!template) throw new Error('missing fixture');
    const { id: templateId, tenantId: _tenantId, ...input } = template;

    const created = await repos.facilities.create(B, { ...input, name: 'Nova pista' });
    const updated = await repos.facilities.update(B, created.id, { status: 'inactive' });
    expect(updated).toMatchObject({ name: 'Nova pista', status: 'inactive', tenantId: B });

    const schedule = await repos.schedules.get(B, templateId);
    await repos.schedules.save(B, { ...schedule, slotMinutes: 30 });
    expect((await repos.schedules.get(B, templateId)).slotMinutes).toBe(30);

    const block = await repos.schedules.createBlock(B, {
      facilityId: templateId,
      subspaceId: null,
      dates: { from: TOMORROW, to: TOMORROW },
      times: { start: '09:00', end: '10:00' },
      reason: 'event',
      note: 'Torneo escolar',
    });
    expect(
      await repos.schedules.listBlocks(B, { facilityId: templateId, from: TODAY, to: TOMORROW }),
    ).toContainEqual(block);
    await repos.schedules.deleteBlock(B, block.id);

    await repos.tenants.update(B, { primaryColor: '#123456' });
    expect((await repos.tenants.getBySlug('ribasmeiras')).primaryColor).toBe('#123456');
    await expect(repos.tenants.getBySlug('non-existe')).rejects.toBeInstanceOf(NotFoundError);

    const { id: _uxiaId, tenantId: _t, ...person } = await repos.users.get(B, uxia.userId);
    const user = await repos.users.create(B, { ...person, firstName: 'Nova' });
    const phone = (await repos.users.update(B, user.id, { phone: '600 000 000' })).phone;
    expect(phone).toBe('600 000 000');

    const actions = (await repos.audit.list(B)).map((e) => `${e.action} ${e.subject}`);
    expect(actions).toEqual(
      expect.arrayContaining([
        'create facility',
        'update facility',
        'update schedule',
        'create block',
        'delete block',
        'update tenant',
        'create user',
      ]),
    );
  });

  it('marks notifications as read only once', async () => {
    const { repos } = setup();
    const [notification] = await repos.notifications.list(B, uxia.userId);
    if (!notification) throw new Error('missing fixture');
    const read = await repos.notifications.markRead(B, notification.id);
    expect(read.readAt).toBeDefined();
    expect((await repos.notifications.markRead(B, notification.id)).readAt).toBe(read.readAt);
  });
});

describe('adapter behaviour', () => {
  it('returns copies, so callers cannot change stored data by accident', async () => {
    const { repos } = setup();
    const [facility] = await repos.facilities.list(B);
    if (!facility) throw new Error('missing fixture');
    facility.name = 'Cambiado';
    expect((await repos.facilities.get(B, facility.id)).name).not.toBe('Cambiado');
  });

  it('persists changes and restores the seed on reset', async () => {
    const storage = new MemoryStorage();
    const first = setup({ storage });
    const slot = freeSlot(first.db.read(), `${B}-tenis`, TOMORROW);
    const reservation = await first.repos.reservations.create(B, {
      ...slot,
      holder: uxia,
      channel: 'web',
    });

    const second = setup({ storage });
    expect((await second.repos.reservations.get(B, reservation.id)).code).toBe(reservation.code);

    second.db.reset();
    await expect(second.repos.reservations.get(B, reservation.id)).rejects.toBeInstanceOf(
      NotFoundError,
    );
  });

  it('starts again from the seed when stored data is corrupt or outdated', async () => {
    const storage = new MemoryStorage();
    storage.setItem('test.db', '{not json');
    expect(await setup({ storage }).repos.tenants.list()).toHaveLength(2);
    storage.setItem('test.db', JSON.stringify({ version: 0 }));
    expect(await setup({ storage }).repos.tenants.list()).toHaveLength(2);
  });

  it('keeps working in memory when storage is full', async () => {
    const storage = new MemoryStorage();
    storage.setItem = () => {
      throw new DOMException('Quota exceeded', 'QuotaExceededError');
    };
    expect(await setup({ storage }).repos.tenants.list()).toHaveLength(2);
  });

  it('simulates network latency', async () => {
    vi.useFakeTimers();
    const repos = createLocalRepositories({
      db: createLocalDatabase(null, 'latency', () => structuredClone(SEED)),
      session: () => null,
      latency: { min: 150, max: 400 },
      random: () => 0.5,
    });
    let settled = false;
    const pending = repos.tenants.list().then(() => {
      settled = true;
    });
    await vi.advanceTimersByTimeAsync(274);
    expect(settled).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await pending;
    expect(settled).toBe(true);
  });
});
