// SPDX-License-Identifier: EUPL-1.2
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Emblem as EmblemKind } from '../domain/types';
import { Link } from '../ui/Link';
import { SiteContext } from './contexts';
import { Emblem } from './Emblem';
import { LanguageSelect } from './LanguageSelect';
import { PreferencesDialog } from './PreferencesDialog';
import styles from './SiteFrame.module.css';

/** Residents get the friendly app; staff and the deputación, the denser back office. */
export type Surface = 'citizen' | 'staff';

export interface SiteFrameProps {
  name: string;
  homeHref: string;
  emblem?: EmblemKind | undefined;
  surface?: Surface;
  nav?: ReactNode;
  session?: ReactNode;
  /** Extra controls at the start of the top strip, e.g. the demo's profile switcher. */
  tools?: ReactNode;
  footerLinks?: { href: string; label: string }[];
  footerLabel?: string;
  children: ReactNode;
}

export function SiteFrame({
  name,
  homeHref,
  emblem,
  surface = 'citizen',
  nav,
  session,
  tools,
  footerLinks = [],
  footerLabel,
  children,
}: SiteFrameProps) {
  const { t } = useTranslation();
  return (
    <SiteContext value={{ name }}>
      <div className={styles.frame} data-surface={surface} data-tabbar={nav ? surface : undefined}>
        <header className={styles.header}>
          <div className={styles.utility}>
            <div className={styles.inner}>
              {tools}
              <LanguageSelect className={styles.language} />
              <PreferencesDialog />
            </div>
          </div>
          <div className={[styles.bar, surface === 'staff' ? 'on-navy' : ''].join(' ')}>
            <div className={styles.inner}>
              <Link href={homeHref} className={styles.brand}>
                {emblem && <Emblem kind={emblem} />}
                <span>{name}</span>
              </Link>
              {session && <div className={styles.session}>{session}</div>}
              {nav}
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1} className={styles.main}>
          {children}
        </main>
        <footer className={styles.footer}>
          <div className={styles.inner}>
            {footerLinks.length > 0 && (
              <nav aria-label={footerLabel}>
                <ul className={styles.footerLinks}>
                  {footerLinks.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <div className={styles.colophon}>
              <p>{t('footer.prototype')}</p>
              <p>{t('footer.license')}</p>
            </div>
          </div>
        </footer>
      </div>
    </SiteContext>
  );
}
