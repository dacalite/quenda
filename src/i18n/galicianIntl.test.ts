// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { createGalicianIntl, hasNativeGalician } from './galicianIntl';

// Node ships full ICU, so the patched classes are tested directly, as Chrome would use them.
const gl = createGalicianIntl(Intl);
const tuesday = new Date('2026-10-20T12:00:00Z');

describe('Galician Intl fallback', () => {
  it('writes Galician month and weekday names in every width', () => {
    const long = new gl.DateTimeFormat('gl-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    });
    expect(long.format(tuesday)).toBe('martes, 20 de outubro');
    expect(long.resolvedOptions().locale).toBe('gl-ES');

    const short = new gl.DateTimeFormat('gl', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    });
    expect(short.format(new Date('2026-07-15T12:00:00Z'))).toMatch(/^mér\.,? 15 xul\.$/);
    expect(
      new gl.DateTimeFormat('gl', { weekday: 'narrow', timeZone: 'UTC' }).format(tuesday),
    ).toBe('M');
    expect(
      new gl.DateTimeFormat('gl', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
        new Date('2026-06-01T12:00:00Z'),
      ),
    ).toBe('xuño de 2026');
  });

  it('says «ás» before the time, as Galician does', () => {
    const withTime = new gl.DateTimeFormat('gl', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'UTC',
    });
    // ICU versions differ: «15 de outubro, 22:53» (Node) or «… a las 22:53» (Chrome) in Spanish.
    expect(withTime.format(new Date('2026-10-15T22:53:00Z'))).toMatch(
      /^15 de outubro(, | ás )22:53$/,
    );
  });

  it('respects the time zone when choosing the day', () => {
    const madrid = new gl.DateTimeFormat('gl', { weekday: 'long', timeZone: 'Europe/Madrid' });
    expect(madrid.format(new Date('2026-10-19T22:30:00Z'))).toBe('martes');
  });

  it('formats prices, percentages and plurals like Galician', () => {
    expect(new gl.NumberFormat('gl-ES', { style: 'currency', currency: 'EUR' }).format(4)).toMatch(
      /^4,00\s€$/,
    );
    expect(new gl.NumberFormat('gl', { style: 'percent' }).format(0.12)).toMatch(/^12\s%$/);
    const plural = new gl.PluralRules('gl');
    expect([plural.select(1), plural.select(2)]).toEqual(['one', 'other']);
  });

  it('joins lists with «e» and «ou»', () => {
    expect(new gl.ListFormat('gl', { type: 'conjunction' }).format(['11:00', '15:00'])).toBe(
      '11:00 e 15:00',
    );
    expect(new gl.ListFormat('gl', { type: 'disjunction' }).format(['a', 'b'])).toBe('a ou b');
  });

  it('names date fields in Galician for screen readers', () => {
    const names = new gl.DisplayNames('gl-ES', { type: 'dateTimeField' });
    expect(['year', 'month', 'day'].map((f) => names.of(f))).toEqual(['ano', 'mes', 'día']);
  });

  it('leaves Spanish untouched', () => {
    expect(new gl.DateTimeFormat('es-ES', { month: 'long', timeZone: 'UTC' }).format(tuesday)).toBe(
      'octubre',
    );
    expect(new gl.ListFormat('es', { type: 'conjunction' }).format(['a', 'b'])).toBe('a y b');
  });

  it('detects browsers that already speak Galician', () => {
    expect(hasNativeGalician()).toBe(true);
  });
});
