// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { reservationCode } from './reservationCode';

describe('reservationCode', () => {
  it('builds a short code without ambiguous characters', () => {
    expect(reservationCode(() => 0)).toBe('QDA-AAAA');
    expect(reservationCode(() => 0.9999)).toBe('QDA-9999');
    for (let seed = 0; seed < 50; seed++) {
      expect(reservationCode(Math.random)).toMatch(/^QDA-[A-HJ-NP-Z2-9]{4}$/);
    }
  });
});
