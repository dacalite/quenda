// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import {
  DEFAULT_RULES,
  newTenant,
  starterFacility,
  suggestSlug,
  validateNewCouncil,
  type NewCouncil,
} from './councils';
import { validateFacility, validateSchedule, validateTenant } from './validation';
import type { FacilityType } from './types';

const council = (patch: Partial<NewCouncil> = {}): NewCouncil => ({
  name: 'Concello de Vilarmoura',
  slug: 'vilarmoura',
  languages: ['gl', 'es'],
  emblem: 'bridge',
  primaryColor: '#7a2e8c',
  facilityTypes: ['sportsHall', 'paddleCourt'],
  address: 'Praza do Concello, 1, Vilarmoura',
  ...patch,
});

const fields = (problems: { field: string; code: string }[]) =>
  problems.map((p) => `${p.field} ${p.code}`);

const TYPES: FacilityType[] = [
  'sportsHall',
  'paddleCourt',
  'tennisCourt',
  'footballPitch',
  'swimmingPool',
  'multipurposeRoom',
  'gym',
];

describe('suggestSlug', () => {
  it('drops the council prefix, accents and spaces', () => {
    expect(suggestSlug('Concello de Vilarmoura')).toBe('vilarmoura');
    expect(suggestSlug('Concello da Pobra do Río')).toBe('pobra-do-rio');
    expect(suggestSlug('  Santa Uxía de Arriba ')).toBe('santa-uxia-de-arriba');
  });

  it('keeps digits and collapses symbols', () => {
    expect(suggestSlug('Concello de A Ponte (2)')).toBe('a-ponte-2');
    expect(suggestSlug('Concello de')).toBe('');
  });
});

describe('validateNewCouncil', () => {
  it('accepts a complete council', () => {
    expect(validateNewCouncil(council(), ['bouzalonga'])).toEqual([]);
  });

  it('names every field that needs fixing', () => {
    expect(
      fields(
        validateNewCouncil(
          council({
            name: ' ',
            slug: 'Vila Moura',
            languages: [],
            primaryColor: 'purple',
            facilityTypes: [],
            address: '',
          }),
          [],
        ),
      ),
    ).toEqual([
      'name required',
      'slug format',
      'languages required',
      'primaryColor format',
      'facilityTypes required',
      'address required',
    ]);
  });

  it('rejects an empty, taken or reserved address', () => {
    expect(fields(validateNewCouncil(council({ slug: '' }), []))).toEqual(['slug required']);
    expect(fields(validateNewCouncil(council(), ['vilarmoura']))).toEqual(['slug taken']);
    expect(fields(validateNewCouncil(council({ slug: 'deputacion' }), []))).toEqual(['slug taken']);
  });
});

describe('newTenant', () => {
  it('builds a valid council of the deputación with the default rules and sample legal texts', () => {
    const tenant = newTenant('t-1', council(), 'dep-1');
    expect(tenant).toMatchObject({
      id: 't-1',
      slug: 'vilarmoura',
      name: 'Concello de Vilarmoura',
      deputacionId: 'dep-1',
      timeZone: 'Europe/Madrid',
      defaultRules: DEFAULT_RULES,
    });
    expect(tenant.legal.privacy.gl).toContain('Concello de Vilarmoura');
    expect(validateTenant(tenant)).toEqual([]);
  });

  it('trims the name and address', () => {
    expect(newTenant('t-1', council({ name: '  Concello X ' }), 'dep-1').name).toBe('Concello X');
  });
});

describe('starterFacility', () => {
  it.each(TYPES)('gives a %s that passes validation, with its schedule', (type) => {
    const { facility, schedule } = starterFacility(type, 'Praza do Concello, 1');
    expect(facility.type).toBe(type);
    expect(facility.address).toBe('Praza do Concello, 1');
    expect(facility.status).toBe('active');
    expect(validateFacility(facility)).toEqual([]);
    expect(validateSchedule(schedule)).toEqual([]);
  });

  it('splits halls and pitches and gives each lane of the pool', () => {
    expect(starterFacility('sportsHall', 'x').facility.subspaces.map((s) => s.id)).toEqual([
      'court-1',
      'court-2',
      'full',
    ]);
    expect(starterFacility('swimmingPool', 'x').facility.subspaces).toHaveLength(4);
    expect(starterFacility('gym', 'x').facility.subspaces[0]?.capacity).toBeGreaterThan(1);
  });
});
