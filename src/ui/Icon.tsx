// SPDX-License-Identifier: EUPL-1.2

const PATHS = {
  check: 'M5 12.5l4.5 4.5L19 7.5',
  success: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM7.5 12.5l3 3 6-6.5',
  warning: 'M12 3.5L22 20.5H2L12 3.5zM12 10v4.5M12 17.5v.5',
  error: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM8.5 8.5l7 7M15.5 8.5l-7 7',
  info: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM12 11v6M12 7.5v.5',
  neutral: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM8 12h8',
  close: 'M6 6l12 12M18 6L6 18',
  chevronDown: 'M6 9l6 6 6-6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronRight: 'M9 6l6 6-6 6',
  calendar: 'M4 6.5h16v14H4zM4 10.5h16M8 3.5v5M16 3.5v5',
  clock: 'M12 2.5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM12 7v5l3.5 2',
  lock: 'M6 11h12v9.5H6zM8.5 11V7.5a3.5 3.5 0 0 1 7 0V11',
  settings:
    'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 2.5v3M12 18.5v3M4.5 4.5l2 2M17.5 17.5l2 2M2.5 12h3M18.5 12h3M4.5 19.5l2-2M17.5 6.5l2-2',
  refresh: 'M20 11a8 8 0 1 0-2.3 5.7M20 4v7h-7',
} as const;

export type IconName = keyof typeof PATHS;

/** Decorative icon: the meaning is always also given as text next to it. */
export function Icon({ name, size = '1.25em' }: { name: IconName; size?: string }) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
