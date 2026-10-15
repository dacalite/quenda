// SPDX-License-Identifier: EUPL-1.2

const HEX = /^#([0-9a-f]{6})$/i;

function channels(hex: string): [number, number, number] {
  const match = HEX.exec(hex);
  if (!match?.[1]) throw new Error(`Expected a #rrggbb colour, got ${hex}`);
  const value = parseInt(match[1], 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

const toHex = (rgb: number[]) =>
  `#${rgb.map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

export function relativeLuminance(hex: string) {
  const [r, g, b] = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  }) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, from 1 to 21. */
export function contrastRatio(a: string, b: string) {
  const [light, dark] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x) as [
    number,
    number,
  ];
  return (light + 0.05) / (dark + 0.05);
}

/** The colour itself if it reaches `minimum` against `background`, otherwise the closest darker shade that does. */
export function accessibleColor(hex: string, background = '#ffffff', minimum = 4.5) {
  const rgb = channels(hex);
  for (let step = 0; step <= 20; step++) {
    const candidate = toHex(rgb.map((c) => c * (1 - step / 20)));
    if (contrastRatio(candidate, background) >= minimum) return candidate;
  }
  return '#000000';
}
