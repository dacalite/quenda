// SPDX-License-Identifier: EUPL-1.2
import { useEffect, useEffectEvent, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router';
import { useAnnounce } from '../ui/announcer';
import { useSite } from './contexts';
import styles from './Page.module.css';

/** Every view: one h1, the document title and, after navigating, focus and an announcement. */
export function Page({ title, children }: { title: string; children?: ReactNode }) {
  const { t } = useTranslation();
  const site = useSite();
  const { key } = useLocation();
  const announce = useAnnounce();
  const heading = useRef<HTMLHeadingElement>(null);
  const onNavigate = useEffectEvent(() => {
    heading.current?.focus();
    announce(title);
  });

  useEffect(() => {
    document.title = t('pageTitle', { page: title, site: site.name });
  }, [t, title, site.name]);

  useEffect(() => {
    // On the first load the browser starts at the top of the page; only later navigations move focus.
    if (key !== 'default') onNavigate();
  }, [key]);

  return (
    <div className={styles.page}>
      <h1 ref={heading} tabIndex={-1} className={styles.title}>
        {title}
      </h1>
      {children}
    </div>
  );
}
