// SPDX-License-Identifier: EUPL-1.2
import type { Cents, Concession, PaymentStatus, Pricing } from '../types';
import type { BookingHolder } from './booking';

export interface PriceQuote {
  tariff: 'resident' | 'nonResident' | 'entity';
  units: number;
  unitCents: Cents;
  concession: Concession | null;
  discountPercent: number;
  totalCents: Cents;
}

export function computePrice(
  holder: BookingHolder,
  pricing: Pricing,
  slotMinutes: number,
  durationMinutes: number,
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
  for (const candidate of user.concessions) {
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
