// SPDX-License-Identifier: EUPL-1.2
import type { Language } from '../config/app';

export type Id = string;
/** Calendar date in the tenant's time zone: `YYYY-MM-DD`. */
export type IsoDate = string;
/** Wall-clock time in the tenant's time zone: `HH:mm`. */
export type Time = string;
/** ISO 8601 instant, e.g. `2026-10-15T10:30:00.000Z`. */
export type Instant = string;
/** ISO weekday: 1 = Monday … 7 = Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type Cents = number;
export type LocalizedText = Record<Language, string>;

export interface TimeRange {
  start: Time;
  end: Time;
}

export interface DateRange {
  from: IsoDate;
  to: IsoDate;
}

// Booking rules

export type Eligibility = 'everyone' | 'residents' | 'entities';

export interface NoShowPolicy {
  strikesForSuspension: number;
  windowDays: number;
  suspensionDays: number;
}

export interface BookingRules {
  minAdvanceHours: number;
  maxAdvanceDays: number;
  minDurationMinutes: number;
  maxDurationMinutes: number;
  maxBookingsPerWeek: number;
  freeCancellationHours: number;
  noShow: NoShowPolicy;
  eligibility: Eligibility;
}

// Tenants

export type Emblem = 'tower' | 'bridge' | 'oak' | 'wave';

export interface Deputacion {
  id: Id;
  name: string;
}

export interface Tenant {
  id: Id;
  slug: string;
  name: string;
  deputacionId?: Id;
  primaryColor: string;
  emblem: Emblem;
  languages: Language[];
  timeZone: string;
  legal: {
    legalNotice: LocalizedText;
    privacy: LocalizedText;
    accessibility: LocalizedText;
  };
  defaultRules: BookingRules;
}

// Facilities

export type FacilityType =
  | 'sportsHall'
  | 'paddleCourt'
  | 'tennisCourt'
  | 'footballPitch'
  | 'swimmingPool'
  | 'multipurposeRoom'
  | 'gym';

export type AccessibilityFeature =
  'stepFreeAccess' | 'adaptedChangingRoom' | 'adaptedToilet' | 'reservedParking' | 'hearingLoop';

export type Concession = 'minor' | 'senior' | 'disability' | 'largeFamily';

export interface Pricing {
  /** Price of one slot (the schedule's `slotMinutes`). */
  residentCents: Cents;
  nonResidentCents: Cents;
  /** Discount percentage per concession; only the best one applies. */
  concessions: Partial<Record<Concession, number>>;
  entitiesFree: boolean;
}

export interface Subspace {
  id: Id;
  name: string;
  /** Simultaneous bookings allowed (gym places); 1 means exclusive use. */
  capacity: number;
  /** Subspaces this one also occupies, e.g. the whole pitch contains both halves. */
  contains: Id[];
}

export interface Photo {
  id: Id;
  alt: LocalizedText;
}

export type FacilityStatus = 'active' | 'inactive';

export interface Facility {
  id: Id;
  tenantId: Id;
  name: string;
  type: FacilityType;
  description: LocalizedText;
  address: string;
  coordinates: { lat: number; lng: number };
  capacity: number;
  subspaces: Subspace[];
  accessibility: AccessibilityFeature[];
  photos: Photo[];
  usageRules: LocalizedText;
  status: FacilityStatus;
  /** Overrides of the tenant's default rules. */
  rules: Partial<BookingRules>;
  pricing: Pricing;
}

// Schedules

export type SlotMinutes = 30 | 60 | 90;

export interface ScheduleException {
  date: IsoDate;
  /** Empty means closed all day. */
  ranges: TimeRange[];
  reason: string;
}

export interface Schedule {
  tenantId: Id;
  facilityId: Id;
  slotMinutes: SlotMinutes;
  weekly: Record<Weekday, TimeRange[]>;
  exceptions: ScheduleException[];
}

export interface Holiday {
  id: Id;
  tenantId: Id;
  date: IsoDate;
  name: LocalizedText;
}

export type BlockReason = 'maintenance' | 'event' | 'other';

export interface Block {
  id: Id;
  tenantId: Id;
  facilityId: Id;
  /** `null` blocks every subspace. */
  subspaceId: Id | null;
  dates: DateRange;
  times: TimeRange;
  reason: BlockReason;
  note: string;
  createdAt: Instant;
  createdBy: Id;
}

// People

export type Role = 'citizen' | 'staff' | 'admin';
export type TextSize = 'normal' | 'large' | 'xlarge';
export type NotificationChannel = 'app' | 'email' | 'sms';

export interface AccessibilityPreferences {
  textSize: TextSize;
  highContrast: boolean;
  reducedMotion: boolean;
}

export interface User {
  id: Id;
  tenantId: Id;
  firstName: string;
  lastName: string;
  maskedDni: string;
  email: string;
  phone: string;
  resident: boolean;
  concessions: Concession[];
  role: Role;
  preferences: {
    language: Language;
    channels: NotificationChannel[];
    accessibility: AccessibilityPreferences;
  };
}

export type EntityKind = 'club' | 'association';

export interface Entity {
  id: Id;
  tenantId: Id;
  name: string;
  kind: EntityKind;
  registryNumber: string;
  contactName: string;
  phone: string;
  email: string;
}

// Reservations

export interface Slot {
  facilityId: Id;
  subspaceId: Id;
  date: IsoDate;
  start: Time;
  end: Time;
}

export type Holder = { kind: 'user'; userId: Id } | { kind: 'entity'; entityId: Id };
export type ReservationStatus = 'confirmed' | 'cancelled' | 'completed' | 'noShow';
export type Channel = 'web' | 'phone' | 'inPerson';
export type PaymentStatus = 'free' | 'pending' | 'paid';

export interface ReservationEvent {
  at: Instant;
  by: Id;
  type: 'created' | 'rescheduled' | 'cancelled' | 'checkedIn' | 'noShow';
  detail?: string;
}

export interface Reservation extends Slot {
  id: Id;
  tenantId: Id;
  /** Short human-readable code, e.g. `QDA-7K3M`. */
  code: string;
  holder: Holder;
  status: ReservationStatus;
  channel: Channel;
  amountCents: Cents;
  payment: PaymentStatus;
  notes: string;
  createdAt: Instant;
  createdBy: Id;
  recurringBookingId?: Id;
  checkedInAt?: Instant;
  history: ReservationEvent[];
}

export interface RecurringBooking {
  id: Id;
  tenantId: Id;
  entityId: Id;
  facilityId: Id;
  subspaceId: Id;
  weekday: Weekday;
  times: TimeRange;
  season: DateRange;
  /** Dates skipped on purpose, e.g. to resolve a conflict. */
  exceptions: IsoDate[];
  createdAt: Instant;
}

// Notifications and audit

export type NotificationType =
  'confirmation' | 'reminder' | 'change' | 'cancellation' | 'councilNotice' | 'slotReleased';

export interface Notification {
  id: Id;
  tenantId: Id;
  userId: Id;
  type: NotificationType;
  channel: NotificationChannel;
  createdAt: Instant;
  readAt?: Instant;
  reservationId?: Id;
}

export type AuditAction =
  'create' | 'update' | 'delete' | 'cancel' | 'reschedule' | 'checkIn' | 'noShow';

export type AuditSubject =
  'tenant' | 'facility' | 'schedule' | 'block' | 'reservation' | 'recurringBooking' | 'user';

export interface AuditEntry {
  id: Id;
  tenantId: Id;
  at: Instant;
  actorId: Id;
  action: AuditAction;
  subject: AuditSubject;
  subjectId: Id;
  summary: string;
}
