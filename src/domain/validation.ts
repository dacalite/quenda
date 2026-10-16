// SPDX-License-Identifier: EUPL-1.2
import { toMinutes } from './time';
import type { BookingRules, Facility, Schedule, Tenant, TimeRange } from './types';

export type ProblemCode = 'required' | 'positive' | 'range' | 'order' | 'overlap' | 'format';

/** A field path such as `subspaces.0.name.gl`, with what is wrong with it. */
export interface FieldProblem {
  field: string;
  code: ProblemCode;
}

const NUMERIC_RULES = [
  'minAdvanceHours',
  'maxAdvanceDays',
  'minDurationMinutes',
  'maxDurationMinutes',
  'maxBookingsPerWeek',
  'freeCancellationHours',
] as const;

const blank = (text: string) => text.trim() === '';
const isCount = (value: number) => Number.isInteger(value) && value >= 0;
// An emptied number field arrives as NaN.
const countProblem = (value: number): ProblemCode => (Number.isNaN(value) ? 'required' : 'range');

export function validateRules(rules: Partial<BookingRules>, prefix = 'rules'): FieldProblem[] {
  const problems: FieldProblem[] = [];
  for (const key of NUMERIC_RULES) {
    const value = rules[key];
    if (value !== undefined && !isCount(value)) {
      problems.push({ field: `${prefix}.${key}`, code: countProblem(value) });
    }
  }
  const { minDurationMinutes: min, maxDurationMinutes: max } = rules;
  if (min !== undefined && max !== undefined && min > max) {
    problems.push({ field: `${prefix}.maxDurationMinutes`, code: 'order' });
  }
  if (rules.noShow) {
    for (const key of ['strikesForSuspension', 'windowDays', 'suspensionDays'] as const) {
      const value = rules.noShow[key];
      if (!isCount(value))
        problems.push({ field: `${prefix}.noShow.${key}`, code: countProblem(value) });
    }
  }
  return problems;
}

export function validateFacility(facility: Omit<Facility, 'id' | 'tenantId'>): FieldProblem[] {
  const problems: FieldProblem[] = [];
  const add = (field: string, code: ProblemCode) => problems.push({ field, code });

  if (blank(facility.name)) add('name', 'required');
  if (blank(facility.address)) add('address', 'required');
  if (!Number.isInteger(facility.capacity) || facility.capacity < 1) add('capacity', 'positive');
  if (Math.abs(facility.coordinates.lat) > 90) add('coordinates.lat', 'range');
  if (Math.abs(facility.coordinates.lng) > 180) add('coordinates.lng', 'range');
  if (facility.subspaces.length === 0) add('subspaces', 'required');
  facility.subspaces.forEach((subspace, i) => {
    if (blank(subspace.name.gl)) add(`subspaces.${String(i)}.name.gl`, 'required');
    if (blank(subspace.name.es)) add(`subspaces.${String(i)}.name.es`, 'required');
    if (!Number.isInteger(subspace.capacity) || subspace.capacity < 1) {
      add(`subspaces.${String(i)}.capacity`, 'positive');
    }
  });
  if (!isCount(facility.pricing.residentCents)) add('pricing.residentCents', 'range');
  if (!isCount(facility.pricing.nonResidentCents)) add('pricing.nonResidentCents', 'range');
  for (const [concession, percent] of Object.entries(facility.pricing.concessions)) {
    if (!(percent >= 0 && percent <= 100)) add(`pricing.concessions.${concession}`, 'range');
  }
  return [...problems, ...validateRules(facility.rules)];
}

function validateRanges(ranges: TimeRange[], field: string): FieldProblem[] {
  const problems: FieldProblem[] = [];
  ranges.forEach((range, i) => {
    if (toMinutes(range.start) >= toMinutes(range.end)) {
      problems.push({ field: `${field}.${String(i)}`, code: 'order' });
    }
  });
  const sorted = ranges.toSorted((a, b) => a.start.localeCompare(b.start));
  if (sorted.some((range, i) => i > 0 && range.start < (sorted[i - 1]?.end ?? ''))) {
    problems.push({ field, code: 'overlap' });
  }
  return problems;
}

export function validateSchedule(
  schedule: Pick<Schedule, 'weekly' | 'exceptions'>,
): FieldProblem[] {
  return [
    ...Object.entries(schedule.weekly).flatMap(([day, ranges]) =>
      validateRanges(ranges, `weekly.${day}`),
    ),
    ...schedule.exceptions.flatMap((exception, i) => [
      ...(blank(exception.reason)
        ? [{ field: `exceptions.${String(i)}.reason`, code: 'required' as const }]
        : []),
      ...validateRanges(exception.ranges, `exceptions.${String(i)}.ranges`),
    ]),
  ];
}

export const isHexColor = (value: string) => /^#[0-9a-f]{6}$/i.test(value);

export function validateTenant(
  tenant: Pick<Tenant, 'name' | 'primaryColor' | 'languages' | 'defaultRules'>,
): FieldProblem[] {
  return [
    ...(blank(tenant.name) ? [{ field: 'name', code: 'required' as const }] : []),
    ...(isHexColor(tenant.primaryColor)
      ? []
      : [{ field: 'primaryColor', code: 'format' as const }]),
    ...(tenant.languages.length === 0 ? [{ field: 'languages', code: 'required' as const }] : []),
    ...validateRules(tenant.defaultRules, 'defaultRules'),
  ];
}
