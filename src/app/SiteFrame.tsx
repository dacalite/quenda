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

export interface SiteFrameProps {
  name: string;
  homeHref: string;
  emblem?: EmblemKind | undefined;
  nav?: ReactNode;
  footerLinks?: { href: string; label: string }[];
  footerLabel?: string;
  children: ReactNode;
}

export function SiteFrame({
  name,
  homeHref,
  emblem,
  nav,
  footerLinks = [],
  footerLabel,
  children,
}: SiteFrameProps) {
  const { t } = useTranslation();
  return (
    <SiteContext value={{ name }}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <Link href={homeHref} className={styles.brand}>
            {emblem && <Emblem kind={emblem} />}
            <span>{name}</span>
          </Link>
          <div className={styles.tools}>
            <LanguageSelect />
            <PreferencesDialog />
          </div>
          {nav}
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
          <p>{t('footer.prototype')}</p>
          <p>{t('footer.license')}</p>
        </div>
      </footer>
    </SiteContext>
  );
}
