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
  home: 'M3.5 11L12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5.5h4V20',
  place:
    'M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21zM12 7a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  ticket: 'M3.5 6.5h17V10a2 2 0 0 0 0 4v3.5h-17V14a2 2 0 0 0 0-4zM14.5 6.5v2M14.5 11v2M14.5 15.5v2',
  bell: 'M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15zM10 21h4',
  user: 'M12 3.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20.5a7.5 7.5 0 0 1 15 0',
  search: 'M10.5 3.5a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM15.5 15.5l5 5',
  arrowRight: 'M4.5 12h15M13.5 6l6 6-6 6',
  menu: 'M4 6.5h16M4 12h16M4 17.5h16',
  swap: 'M7.5 4L4 7.5 7.5 11M4 7.5h14M16.5 13l3.5 3.5-3.5 3.5M20 16.5H6',
  accessibility:
    'M12 3a1.75 1.75 0 1 0 0 3.5A1.75 1.75 0 0 0 12 3zM5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5L9 21M12 14.5l3 6.5',
  sportsHall: 'M3.5 20.5h17M5 20.5V10l7-5 7 5v10.5M9.5 20.5v-5h5v5',
  paddleCourt:
    'M9 3h6a4 4 0 0 1 4 4v3.5a5.5 5.5 0 0 1-5.5 5.5h-3A5.5 5.5 0 0 1 5 10.5V7a4 4 0 0 1 4-4zM12 16v5M10 7.5h.01M14 7.5h.01M12 10.5h.01',
  tennisCourt:
    'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM5.6 5.6a9 9 0 0 1 0 12.8M18.4 5.6a9 9 0 0 0 0 12.8',
  footballPitch: 'M3.5 5.5h17v13h-17zM12 5.5v13M12 9.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z',
  swimmingPool:
    'M3 16c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M3 20c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0M8 13V6a2 2 0 0 1 2-2M15 13V6a2 2 0 0 1 2-2M8 8.5h7',
  multipurposeRoom: 'M4 4.5h16v15H4zM4 9.5h16M9.5 9.5v10',
  gym: 'M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11',
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
