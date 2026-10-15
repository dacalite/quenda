// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { accessibleColor, contrastRatio, relativeLuminance } from './contrast';

describe('contrast', () => {
  it('matches the WCAG reference values', () => {
    expect(relativeLuminance('#ffffff')).toBe(1);
    expect(relativeLuminance('#000000')).toBe(0);
    expect(contrastRatio('#000000', '#ffffff')).toBe(21);
    expect(contrastRatio('#ffffff', '#767676')).toBeCloseTo(4.54, 2);
    expect(contrastRatio('#777777', '#ffffff')).toBeLessThan(4.5);
  });

  it('keeps colours that already pass and darkens those that do not', () => {
    expect(accessibleColor('#0b5cad')).toBe('#0b5cad');
    for (const colour of ['#ffcc00', '#7fd1ae', '#ff6600', '#e0e0e0', '#ffffff']) {
      const fixed = accessibleColor(colour);
      expect(contrastRatio(fixed, '#ffffff')).toBeGreaterThanOrEqual(4.5);
      expect(fixed).not.toBe(colour);
    }
    expect(
      contrastRatio(accessibleColor('#ffcc00', '#ffffff', 7), '#ffffff'),
    ).toBeGreaterThanOrEqual(7);
  });

  it('rejects colours it cannot read', () => {
    expect(() => contrastRatio('red', '#ffffff')).toThrow();
  });
});
