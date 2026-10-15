// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { resources } from '.';

function flatten(tree: object, prefix = ''): [string, unknown][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'object' && value !== null
      ? flatten(value as object, `${prefix}${key}.`)
      : [[`${prefix}${key}`, value] as [string, unknown]],
  );
}

describe('translations', () => {
  const gl = flatten(resources.gl);
  const es = flatten(resources.es);

  it('have the same keys in Galician and Spanish', () => {
    expect(es.map(([key]) => key).sort()).toEqual(gl.map(([key]) => key).sort());
  });

  it('have no empty texts', () => {
    const empty = [...gl, ...es].filter(([, text]) => typeof text !== 'string' || !text.trim());
    expect(empty).toEqual([]);
  });
});
