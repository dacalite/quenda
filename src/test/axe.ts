// SPDX-License-Identifier: EUPL-1.2
import axe from 'axe-core';
import { expect } from 'vitest';

/**
 * Runs axe on the whole document, so portalled overlays are included.
 * Colour contrast needs real layout (checked in e2e and by tokens.test.ts); landmarks are page-level.
 */
export async function expectNoAxeViolations() {
  const { violations } = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  });
  expect(
    violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
  ).toEqual([]);
}
