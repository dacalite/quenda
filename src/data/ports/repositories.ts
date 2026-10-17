// SPDX-License-Identifier: EUPL-1.2
import type { Indicators } from '../../domain/analytics/indicators';
import type { NewCouncil } from '../../domain/councils';
import type { Recommendation } from '../../domain/recommendations/recommend';
import type { AvailabilitySlot } from '../../domain/rules/availability';
import type { RuleViolation } from '../../domain/rules/booking';
import type { ModifyViolation } from '../../domain/rules/cancellation';
import type { PriceQuote } from '../../domain/rules/pricing';
import type { RecurringConflict } from '../../domain/rules/recurring';
import type {
  AuditEntry,
  Block,
  Channel,
  DateRange,
  Deputacion,
  Entity,
  Facility,
  Holder,
  Holiday,
  Id,
  IsoDate,
  Notification,
  NotificationChannel,
  RecurringBooking,
  Reservation,
  ReservationStatus,
  Role,
  Schedule,
  Slot,
  Tenant,
  User,
} from '../../domain/types';

// Contracts of the future REST API. Every call is scoped by tenant and may reject with the errors in ./errors.
// Residents only reach their own bookings, profile and notifications; council staff reach everything in their council,
// and only administrators change the configuration or read the audit log. A deputación sees its councils as a whole.

export interface TenantRepository {
  list(): Promise<Tenant[]>;
  getBySlug(slug: string): Promise<Tenant>;
  update(tenantId: Id, patch: Partial<Omit<Tenant, 'id' | 'slug'>>): Promise<Tenant>;
}

export type FacilityInput = Omit<Facility, 'id' | 'tenantId'>;

export interface FacilityRepository {
  list(tenantId: Id): Promise<Facility[]>;
  get(tenantId: Id, id: Id): Promise<Facility>;
  create(tenantId: Id, input: FacilityInput): Promise<Facility>;
  update(tenantId: Id, id: Id, patch: Partial<FacilityInput>): Promise<Facility>;
  /** Stores an image for a facility photo and returns where it is served from. */
  uploadPhoto(tenantId: Id, image: Blob): Promise<{ url: string }>;
  /** Public: the status of every slot, without revealing who booked what. */
  availability(tenantId: Id, facilityId: Id, date: IsoDate): Promise<AvailabilitySlot[]>;
  /** Public: free slots that are usually quiet on that weekday. */
  recommendations(tenantId: Id, facilityId: Id, date: IsoDate): Promise<Recommendation[]>;
}

export interface BlockFilter {
  facilityId?: Id;
  from?: IsoDate;
  to?: IsoDate;
}

export type BlockInput = Pick<
  Block,
  'facilityId' | 'subspaceId' | 'dates' | 'times' | 'reason' | 'note'
>;

export type HolidayInput = Pick<Holiday, 'date' | 'name'>;

export interface ScheduleRepository {
  get(tenantId: Id, facilityId: Id): Promise<Schedule>;
  save(tenantId: Id, schedule: Schedule): Promise<Schedule>;
  listHolidays(tenantId: Id): Promise<Holiday[]>;
  createHoliday(tenantId: Id, input: HolidayInput): Promise<Holiday>;
  deleteHoliday(tenantId: Id, id: Id): Promise<void>;
  listBlocks(tenantId: Id, filter?: BlockFilter): Promise<Block[]>;
  /** Upcoming bookings the block would cancel, without saving anything. */
  previewBlock(tenantId: Id, input: BlockInput): Promise<Reservation[]>;
  /** Saves the block, cancels the affected bookings and tells each person, offering another time. */
  createBlock(tenantId: Id, input: BlockInput): Promise<Block>;
  deleteBlock(tenantId: Id, id: Id): Promise<void>;
}

export interface ReservationFilter {
  facilityId?: Id;
  holder?: Holder;
  from?: IsoDate;
  to?: IsoDate;
  status?: ReservationStatus[];
}

export interface ReservationInput extends Slot {
  holder: Holder;
  channel: Channel;
  notes?: string;
  /** Staff bookings can send the confirmation by text or email (simulated). */
  confirmBy?: Exclude<NotificationChannel, 'app'>;
}

export interface ReservationQuote {
  price: PriceQuote;
  /** Empty when the booking can go ahead. */
  violations: (RuleViolation | ModifyViolation)[];
}

export interface ReservationRepository {
  list(tenantId: Id, filter?: ReservationFilter): Promise<Reservation[]>;
  get(tenantId: Id, id: Id): Promise<Reservation>;
  getByCode(tenantId: Id, code: string): Promise<Reservation>;
  /** Price and rule check without booking anything; `replaces` quotes a change of an existing booking. */
  quote(tenantId: Id, input: ReservationInput, replaces?: Id): Promise<ReservationQuote>;
  create(tenantId: Id, input: ReservationInput): Promise<Reservation>;
  reschedule(tenantId: Id, id: Id, slot: Slot): Promise<Reservation>;
  cancel(tenantId: Id, id: Id): Promise<Reservation>;
  checkIn(tenantId: Id, id: Id): Promise<Reservation>;
  markNoShow(tenantId: Id, id: Id): Promise<Reservation>;
}

export type RecurringBookingInput = Omit<RecurringBooking, 'id' | 'tenantId' | 'createdAt'>;

export interface RecurringBookingRepository {
  list(tenantId: Id, filter?: { entityId?: Id; facilityId?: Id }): Promise<RecurringBooking[]>;
  /** Conflicts the booking would have, without saving it. */
  preview(tenantId: Id, input: RecurringBookingInput): Promise<RecurringConflict[]>;
  /** Saves the booking and books every date without a conflict. */
  create(tenantId: Id, input: RecurringBookingInput): Promise<RecurringBooking>;
}

export interface UserFilter {
  roles?: Role[];
  /** Matches name, phone or email. */
  search?: string;
}

export type UserInput = Omit<User, 'id' | 'tenantId'>;

export interface UserRepository {
  list(tenantId: Id, filter?: UserFilter): Promise<User[]>;
  get(tenantId: Id, id: Id): Promise<User>;
  create(tenantId: Id, input: UserInput): Promise<User>;
  update(tenantId: Id, id: Id, patch: Partial<UserInput>): Promise<User>;
}

export interface EntityRepository {
  list(tenantId: Id): Promise<Entity[]>;
  get(tenantId: Id, id: Id): Promise<Entity>;
}

export interface NotificationRepository {
  list(tenantId: Id, userId: Id): Promise<Notification[]>;
  markRead(tenantId: Id, id: Id): Promise<Notification>;
}

export interface AuditLogRepository {
  list(tenantId: Id): Promise<AuditEntry[]>;
}

export interface IndicatorRepository {
  get(tenantId: Id, range: DateRange): Promise<Indicators>;
}

export interface CouncilIndicators {
  tenantId: Id;
  indicators: Indicators;
}

export interface DeputacionIndicators {
  councils: CouncilIndicators[];
  /** The figures of every council together, as if they were one. */
  total: Indicators;
}

/** The back office of a deputación that runs a shared instance for its councils. */
export interface DeputacionRepository {
  get(deputacionId: Id): Promise<Deputacion>;
  listCouncils(deputacionId: Id): Promise<Tenant[]>;
  indicators(deputacionId: Id, range: DateRange): Promise<DeputacionIndicators>;
  /** Signs a council up with its starter facilities, ready to take bookings. */
  createCouncil(deputacionId: Id, input: NewCouncil): Promise<Tenant>;
}

export interface Repositories {
  tenants: TenantRepository;
  facilities: FacilityRepository;
  schedules: ScheduleRepository;
  reservations: ReservationRepository;
  recurringBookings: RecurringBookingRepository;
  users: UserRepository;
  entities: EntityRepository;
  notifications: NotificationRepository;
  audit: AuditLogRepository;
  indicators: IndicatorRepository;
  deputacions: DeputacionRepository;
}
