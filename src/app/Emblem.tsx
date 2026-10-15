// SPDX-License-Identifier: EUPL-1.2
import type { Emblem as EmblemKind } from '../domain/types';

// Generic placeholder shields: each council would upload its own coat of arms.
const SHAPES: Record<EmblemKind, string> = {
  tower: 'M9 9h14v4h-2v8H11v-8H9zM13 21v-4h6v4',
  bridge: 'M6 20h20M8 20v-3a8 8 0 0 1 16 0v3M6 14h20',
  oak: 'M16 23v-5M16 18c-5 0-7-3-7-6a4 4 0 0 1 4-4 3 3 0 0 1 6 0 4 4 0 0 1 4 4c0 3-2 6-7 6z',
  wave: 'M7 13c3-3 6 3 9 0s6 3 9 0M7 18c3-3 6 3 9 0s6 3 9 0',
};

export function Emblem({ kind }: { kind: EmblemKind }) {
  return (
    <svg aria-hidden="true" focusable="false" width="2.25rem" height="2.5rem" viewBox="0 0 32 36">
      <path
        d="M3 3h26v16c0 8-6 12-13 14C9 31 3 27 3 19z"
        fill="var(--color-primary)"
        stroke="var(--color-text)"
        strokeWidth="1.5"
      />
      <path
        d={SHAPES[kind]}
        fill="none"
        stroke="var(--color-on-primary)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
