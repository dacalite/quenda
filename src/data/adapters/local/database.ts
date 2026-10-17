// SPDX-License-Identifier: EUPL-1.2
import type {
  AuditEntry,
  Block,
  Deputacion,
  Entity,
  Facility,
  Holiday,
  IsoDate,
  Notification,
  RecurringBooking,
  Reservation,
  Schedule,
  Tenant,
  User,
} from '../../../domain/types';

export const SCHEMA_VERSION = 1;

/** Everything the prototype stores: the rows the real system keeps in PostgreSQL. */
export interface Database {
  version: number;
  generatedFor: IsoDate;
  deputacions: Deputacion[];
  tenants: Tenant[];
  facilities: Facility[];
  schedules: Schedule[];
  holidays: Holiday[];
  blocks: Block[];
  reservations: Reservation[];
  recurringBookings: RecurringBooking[];
  users: User[];
  entities: Entity[];
  notifications: Notification[];
  audit: AuditEntry[];
}

export interface LocalDatabase {
  /** Settles once the data has been read from storage or, on a first visit, generated. */
  ready(): Promise<void>;
  /** The data itself: only after `ready`, unless the seed is synchronous. */
  read(): Database;
  commit(): void;
  reset(): Promise<void>;
}

export function createLocalDatabase(
  storage: Storage | null,
  key: string,
  seed: () => Database | Promise<Database>,
  /** Stored data that should be replaced by a fresh seed, e.g. a demo opened weeks later. */
  isStale: (db: Database) => boolean = () => false,
): LocalDatabase {
  let data: Database | null = null;
  let pending: Promise<void> | null = null;

  const stored = (): Database | null => {
    try {
      const text = storage?.getItem(key);
      const parsed = text ? (JSON.parse(text) as Database) : null;
      if (parsed?.version === SCHEMA_VERSION && !isStale(parsed)) return parsed;
    } catch {
      // Corrupt or unreadable data: start again from the seed.
    }
    return null;
  };

  const commit = () => {
    try {
      storage?.setItem(key, JSON.stringify(data));
    } catch {
      // Quota exceeded or storage blocked: keep working in memory for this visit.
    }
  };

  // Saving a fresh seed takes a while; doing it later keeps the first screen responsive.
  const settle = (fresh: Database) => {
    data = fresh;
    setTimeout(commit, 0);
  };

  /** Loads in place when it can, so a synchronous seed is readable straight away. */
  const load = (): Promise<void> => {
    const found = stored();
    if (found) {
      data = found;
      return Promise.resolve();
    }
    const fresh = seed();
    if (fresh instanceof Promise) return fresh.then(settle);
    settle(fresh);
    return Promise.resolve();
  };

  const ready = () => (pending ??= load());

  return {
    ready,
    read: () => {
      if (!data) void ready();
      if (!data) throw new Error('The demo data is still being generated');
      return data;
    },
    commit,
    reset: () => {
      data = null;
      pending = Promise.resolve(seed()).then((fresh) => {
        data = fresh;
        commit();
      });
      return pending;
    },
  };
}
