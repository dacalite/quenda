// SPDX-License-Identifier: EUPL-1.2
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { TENANTS } from '../data/seed/catalog';
import { accessibleColor, contrastRatio } from './contrast';

const tokensCss = readFileSync('src/ui/tokens.css', 'utf8');

function readTokens(selector: string) {
  const start = tokensCss.indexOf(`${selector} {`);
  const block = tokensCss.slice(start, tokensCss.indexOf('}', start));
  return Object.fromEntries(
    [...block.matchAll(/--(color-[a-z-]+):\s*(?:var\(--[a-z-]+,\s*)?(#[0-9a-f]{6})\)?;/gi)].map(
      ([, name, value]) => [name, value],
    ),
  ) as Record<string, string>;
}

const base = readTokens(':root');
const theme = (selector: string) => ({ ...base, ...readTokens(selector) });

const PAIRS: [string, string, number][] = [
  ['color-text', 'color-background', 7],
  ['color-text', 'color-surface', 7],
  ['color-text', 'color-surface-strong', 7],
  ['color-text-muted', 'color-background', 4.5],
  ['color-text-muted', 'color-surface', 4.5],
  ['color-border', 'color-background', 3],
  ['color-border', 'color-surface', 3],
  ['color-focus', 'color-background', 3],
  ['color-primary', 'color-background', 4.5],
  ['color-on-primary', 'color-primary', 4.5],
  ['color-success', 'color-success-surface', 4.5],
  ['color-warning', 'color-warning-surface', 4.5],
  ['color-danger', 'color-danger-surface', 4.5],
  ['color-info', 'color-info-surface', 4.5],
  ['color-success', 'color-background', 4.5],
  ['color-warning', 'color-background', 4.5],
  ['color-danger', 'color-background', 4.5],
];

describe.each([
  ['default theme', theme(':root'), false],
  ['high contrast', theme(":root[data-contrast='high']"), true],
])('%s', (_name, colours, high) => {
  it.each(PAIRS)('%s on %s', (foreground, background, minimum) => {
    const fg = colours[foreground];
    const bg = colours[background];
    expect(fg, foreground).toBeDefined();
    expect(bg, background).toBeDefined();
    expect(contrastRatio(fg ?? '', bg ?? '')).toBeGreaterThanOrEqual(high ? 7 : minimum);
  });
});

describe('tenant colours', () => {
  it.each(TENANTS.map((t) => [t.tenant.name, t.tenant.primaryColor]))(
    '%s is readable as text and as a button background',
    (_name, colour) => {
      expect(contrastRatio(accessibleColor(colour), '#ffffff')).toBeGreaterThanOrEqual(4.5);
    },
  );
});
