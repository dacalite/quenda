// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { facilitySports, needsSport, sportProblem } from './sports';
import type { Subspace } from './types';

const space = (sports: Subspace['sports']): Subspace => ({
  id: 'court',
  name: { gl: 'Pista', es: 'Pista' },
  capacity: 1,
  contains: [],
  sports,
});

describe('sports', () => {
  it('lists the sports of every space once, in catalogue order', () => {
    const facility = {
      subspaces: [space(['volleyball', 'basketball']), space(['basketball', 'futsal']), space([])],
    };
    expect(facilitySports(facility)).toEqual(['futsal', 'basketball', 'volleyball']);
  });

  it('asks for a sport only where the space offers more than one', () => {
    expect(needsSport(space(['futsal', 'handball']))).toBe(true);
    expect(needsSport(space(['padel']))).toBe(false);
    expect(needsSport(space([]))).toBe(false);
  });

  it('requires a sport the space offers', () => {
    const shared = space(['futsal', 'handball']);
    expect(sportProblem(shared, undefined)).toBe('sportRequired');
    expect(sportProblem(shared, 'handball')).toBeNull();
    expect(sportProblem(shared, 'tennis')).toBe('sportNotOffered');
    expect(sportProblem(space(['padel']), undefined)).toBeNull();
    expect(sportProblem(space([]), 'padel')).toBe('sportNotOffered');
  });
});
