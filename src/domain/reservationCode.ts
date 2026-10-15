// SPDX-License-Identifier: EUPL-1.2

// No 0/O or 1/I, so the code can be read aloud or typed without ambiguity.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export function reservationCode(random: () => number): string {
  let suffix = '';
  for (let i = 0; i < 4; i++) suffix += ALPHABET.charAt(Math.floor(random() * ALPHABET.length));
  return `QDA-${suffix}`;
}
