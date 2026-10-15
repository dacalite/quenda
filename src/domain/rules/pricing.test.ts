// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import type { Entity } from '../types';
import { makeFacility, makeUser } from './fixtures.test-utils';
import { computePrice, initialPaymentStatus } from './pricing';

const { pricing } = makeFacility();
const club: Entity = {
  id: 'club',
  tenantId: 't1',
  name: 'Club',
  kind: 'club',
  registryNumber: 'R-1',
  contactName: '',
  phone: '',
  email: '',
};

describe('computePrice', () => {
  it('charges residents the resident rate per slot', () => {
    const quote = computePrice({ kind: 'user', user: makeUser() }, pricing, 60, 120);
    expect(quote).toEqual({
      tariff: 'resident',
      units: 2,
      unitCents: 400,
      concession: null,
      discountPercent: 0,
      totalCents: 800,
    });
    expect(initialPaymentStatus(quote)).toBe('pending');
  });

  it('charges non-residents their own rate', () => {
    const quote = computePrice(
      { kind: 'user', user: makeUser({ resident: false }) },
      pricing,
      60,
      60,
    );
    expect(quote).toMatchObject({ tariff: 'nonResident', totalCents: 800 });
  });

  it('applies only the best concession and rounds to cents', () => {
    const user = makeUser({ concessions: ['minor', 'senior', 'largeFamily'] });
    const quote = computePrice({ kind: 'user', user }, { ...pricing, residentCents: 333 }, 60, 60);
    expect(quote).toMatchObject({ concession: 'senior', discountPercent: 50, totalCents: 167 });
  });

  it('makes entities free when the tenant says so, or charges the resident rate', () => {
    const free = computePrice({ kind: 'entity', entity: club }, pricing, 60, 120);
    expect(free).toMatchObject({ tariff: 'entity', totalCents: 0 });
    expect(initialPaymentStatus(free)).toBe('free');

    const paid = computePrice(
      { kind: 'entity', entity: club },
      { ...pricing, entitiesFree: false },
      60,
      120,
    );
    expect(paid.totalCents).toBe(800);
  });

  it('rounds partial slots up', () => {
    expect(computePrice({ kind: 'user', user: makeUser() }, pricing, 60, 90).units).toBe(2);
  });
});
