// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { makeFacility, makeSchedule, RULES } from './rules/fixtures.test-utils';
import { isHexColor, validateFacility, validateSchedule, validateTenant } from './validation';

const fields = (problems: { field: string; code: string }[]) =>
  problems.map((p) => `${p.field} ${p.code}`);

describe('validateFacility', () => {
  it('accepts a complete facility', () => {
    const { id: _id, tenantId: _tenantId, ...facility } = makeFacility();
    expect(validateFacility(facility)).toEqual([]);
  });

  it('names every field that needs fixing', () => {
    const {
      id: _id,
      tenantId: _tenantId,
      ...facility
    } = makeFacility({
      name: ' ',
      address: '',
      capacity: 0,
      coordinates: { lat: 95, lng: -200 },
      subspaces: [{ id: 's', name: { gl: '', es: '' }, capacity: 0, contains: [] }],
      pricing: {
        residentCents: -1,
        nonResidentCents: 1.5,
        concessions: { senior: 120 },
        entitiesFree: true,
      },
      rules: { minDurationMinutes: 120, maxDurationMinutes: 60, maxAdvanceDays: -2 },
    });
    expect(fields(validateFacility(facility))).toEqual([
      'name required',
      'address required',
      'capacity positive',
      'coordinates.lat range',
      'coordinates.lng range',
      'subspaces.0.name.gl required',
      'subspaces.0.name.es required',
      'subspaces.0.capacity positive',
      'pricing.residentCents range',
      'pricing.nonResidentCents range',
      'pricing.concessions.senior range',
      'rules.maxAdvanceDays range',
      'rules.maxDurationMinutes order',
    ]);
  });

  it('asks for the alternative text of every photo in each language', () => {
    const {
      id: _id,
      tenantId: _tenantId,
      ...facility
    } = makeFacility({
      photos: [{ id: 'p', url: 'photos/pista.jpg', alt: { gl: 'Pista de pádel', es: ' ' } }],
    });
    expect(fields(validateFacility(facility))).toEqual(['photos.0.alt.es required']);
  });

  it('requires at least one bookable space', () => {
    const { id: _id, tenantId: _tenantId, ...facility } = makeFacility({ subspaces: [] });
    expect(fields(validateFacility(facility))).toEqual(['subspaces required']);
  });
});

describe('validateSchedule', () => {
  it('accepts the regular schedule', () => {
    expect(validateSchedule(makeSchedule())).toEqual([]);
  });

  it('rejects reversed and overlapping hours, and exceptions without a reason', () => {
    const schedule = makeSchedule({
      weekly: {
        ...makeSchedule().weekly,
        1: [
          { start: '09:00', end: '14:00' },
          { start: '13:00', end: '15:00' },
        ],
        2: [{ start: '18:00', end: '10:00' }],
      },
      exceptions: [{ date: '2026-10-21', ranges: [], reason: '' }],
    });
    expect(fields(validateSchedule(schedule))).toEqual([
      'weekly.1 overlap',
      'weekly.2.0 order',
      'exceptions.0.reason required',
    ]);
  });
});

describe('validateTenant', () => {
  it('checks the name, the colour, the languages and the default rules', () => {
    expect(
      validateTenant({
        name: 'Concello',
        primaryColor: '#1a5e9a',
        languages: ['gl'],
        defaultRules: RULES,
      }),
    ).toEqual([]);
    expect(
      fields(
        validateTenant({
          name: '',
          primaryColor: 'azul',
          languages: [],
          defaultRules: {
            ...RULES,
            maxAdvanceDays: Number.NaN,
            noShow: { ...RULES.noShow, windowDays: -1 },
          },
        }),
      ),
    ).toEqual([
      'name required',
      'primaryColor format',
      'languages required',
      'defaultRules.maxAdvanceDays required',
      'defaultRules.noShow.windowDays range',
    ]);
  });

  it('recognises six-digit hex colours only', () => {
    expect(['#ABCDEF', '#123abc'].every(isHexColor)).toBe(true);
    expect(['#abc', '123456', '#12345g'].some(isHexColor)).toBe(false);
  });
});
