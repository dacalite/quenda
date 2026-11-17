// SPDX-License-Identifier: EUPL-1.2
import { ageOn } from '../time';
import type { Cents, Concession, IsoDate, PaymentStatus, Pricing } from '../types';
import type { BookingHolder } from './booking';

export interface PriceQuote {
  tariff: 'resident' | 'nonResident' | 'entity';
  units: number;
  unitCents: Cents;
  concession: Concession | null;
  discountPercent: number;
  totalCents: Cents;
}

export const ADULT_AGE = 18;

/** A minor in someone's care gets the minor concession and shares a large-family one. */
function concessionsOf(holder: BookingHolder & { kind: 'user' }, date: IsoDate | undefined) {
  if (!holder.dependent) return holder.user.concessions;
  const minor = !date || ageOn(holder.dependent.birthDate, date) < ADULT_AGE;
  return [
    ...(minor ? (['minor'] as const) : []),
    ...holder.user.concessions.filter((c) => c === 'largeFamily'),
  ];
}

/** `date` counts the age of a minor booked for; without it they count as a minor. */
export function computePrice(
  holder: BookingHolder,
  pricing: Pricing,
  slotMinutes: number,
  durationMinutes: number,
  date?: IsoDate,
): PriceQuote {
  const units = Math.ceil(durationMinutes / slotMinutes);

  if (holder.kind === 'entity') {
    const unitCents = pricing.entitiesFree ? 0 : pricing.residentCents;
    return {
      tariff: 'entity',
      units,
      unitCents,
      concession: null,
      discountPercent: 0,
      totalCents: units * unitCents,
    };
  }

  const { user } = holder;
  const unitCents = user.resident ? pricing.residentCents : pricing.nonResidentCents;
  let concession: Concession | null = null;
  let discountPercent = 0;
  for (const candidate of concessionsOf(holder, date)) {
    const percent = pricing.concessions[candidate] ?? 0;
    if (percent > discountPercent) {
      concession = candidate;
      discountPercent = percent;
    }
  }

  return {
    tariff: user.resident ? 'resident' : 'nonResident',
    units,
    unitCents,
    concession,
    discountPercent,
    totalCents: Math.round((units * unitCents * (100 - discountPercent)) / 100),
  };
}

export const initialPaymentStatus = (quote: PriceQuote): PaymentStatus =>
  quote.totalCents === 0 ? 'free' : 'pending';
