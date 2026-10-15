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
  read(): Database;
  commit(): void;
  reset(): void;
}

export function createLocalDatabase(
  storage: Storage | null,
  key: string,
  seed: () => Database,
): LocalDatabase {
  let data: Database | null = null;

  const load = (): Database => {
    try {
      const stored = storage?.getItem(key);
      const parsed = stored ? (JSON.parse(stored) as Database) : null;
      if (parsed?.version === SCHEMA_VERSION) return parsed;
    } catch {
      // Corrupt or unreadable data: start again from the seed.
    }
    return seed();
  };

  const commit = () => {
    try {
      storage?.setItem(key, JSON.stringify(data));
    } catch {
      // Quota exceeded or storage blocked: keep working in memory for this visit.
    }
  };

  return {
    read: () => {
      if (!data) {
        data = load();
        commit();
      }
      return data;
    },
    commit,
    reset: () => {
      data = seed();
      commit();
    },
  };
}
