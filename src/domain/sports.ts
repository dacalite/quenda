// SPDX-License-Identifier: EUPL-1.2
import type { Facility, Sport, Subspace } from './types';

/** Every sport a space can offer, in the order they are listed. */
export const SPORTS: readonly Sport[] = [
  'football',
  'futsal',
  'basketball',
  'volleyball',
  'handball',
  'badminton',
  'padel',
  'tennis',
  'swimming',
  'skating',
];

/** Sports a facility can be booked for, in catalogue order. */
export function facilitySports(facility: Pick<Facility, 'subspaces'>): Sport[] {
  return SPORTS.filter((sport) => facility.subspaces.some((s) => s.sports.includes(sport)));
}

/** A booking names its sport only when the space offers more than one. */
export function needsSport(subspace: Subspace): boolean {
  return subspace.sports.length > 1;
}

export type SportProblem = 'sportRequired' | 'sportNotOffered';

export function sportProblem(subspace: Subspace, sport: Sport | undefined): SportProblem | null {
  if (sport) return subspace.sports.includes(sport) ? null : 'sportNotOffered';
  return needsSport(subspace) ? 'sportRequired' : null;
}
