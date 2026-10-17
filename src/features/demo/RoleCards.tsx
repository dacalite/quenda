// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import type { DemoRole } from '../../app/state';
import { Icon, type IconName } from '../../ui/Icon';
import { Link } from '../../ui/Link';
import styles from './RoleCards.module.css';

const ROLES: DemoRole[] = ['citizen', 'staff', 'deputacion'];

const ICONS: Record<DemoRole, IconName> = {
  citizen: 'user',
  staff: 'sportsHall',
  deputacion: 'place',
};

/** The three ways to see the demo, each a link to where that profile starts. */
export function RoleCards({
  hrefOf,
  onChoose,
  current,
  headingLevel,
  compact = false,
}: {
  hrefOf: (role: DemoRole) => string;
  onChoose: (role: DemoRole) => void;
  current?: DemoRole;
  headingLevel: 2 | 3;
  /** One under another, as in the profile dialog. */
  compact?: boolean;
}) {
  const { t } = useTranslation('demo');
  const Heading = `h${String(headingLevel)}` as 'h2' | 'h3';
  return (
    <ul className={styles.cards} data-compact={compact || undefined}>
      {ROLES.map((role) => (
        <li key={role} className={styles.card} data-current={role === current || undefined}>
          <span className={styles.badge} aria-hidden="true">
            <Icon name={ICONS[role]} size="1.75rem" />
          </span>
          <div className={styles.text}>
            <Heading className={styles.title}>
              <Link
                href={hrefOf(role)}
                className={styles.link}
                aria-current={role === current ? 'true' : undefined}
                onPress={() => {
                  onChoose(role);
                }}
              >
                {t(`role.${role}`)}
              </Link>
            </Heading>
            {!compact && <p className={styles.body}>{t(`roleCard.${role}`)}</p>}
            {role === current && <p className={styles.current}>{t('roleCard.current')}</p>}
          </div>
          <Icon name="arrowRight" />
        </li>
      ))}
    </ul>
  );
}
