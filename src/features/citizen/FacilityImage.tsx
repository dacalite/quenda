// SPDX-License-Identifier: EUPL-1.2
import type { FacilityType } from '../../domain/types';
import styles from './citizen.module.css';

// Placeholder drawings: each council would upload real photos with the same alternative text.
const DRAWINGS: Record<FacilityType, string> = {
  sportsHall: 'M20 70h120M20 70V30h120v40M80 30v40M60 50a20 20 0 0 0 40 0',
  paddleCourt: 'M30 25h100v50H30zM80 25v50M30 50h100',
  tennisCourt: 'M25 25h110v50H25zM80 25v50M45 25v50M115 25v50M45 50h70',
  footballPitch:
    'M20 22h120v56H20zM80 22v56M80 50m-10 0a10 10 0 1 0 20 0a10 10 0 1 0-20 0M20 38h12v24H20M140 38h-12v24h12',
  swimmingPool: 'M20 25h120v50H20zM20 37h120M20 50h120M20 62h120',
  multipurposeRoom: 'M30 75V30l50-12 50 12v45M55 75V50h50v25',
  gym: 'M40 50h80M40 38v24M120 38v24M30 42v16M130 42v16',
};

export function FacilityImage({ type, alt }: { type: FacilityType; alt: string }) {
  return (
    <svg role="img" aria-label={alt} viewBox="0 0 160 100" className={styles.image}>
      <rect width="160" height="100" fill="var(--color-primary-surface)" />
      <path
        d={DRAWINGS[type]}
        fill="none"
        stroke="var(--color-primary)"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
