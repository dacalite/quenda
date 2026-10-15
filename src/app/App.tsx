// SPDX-License-Identifier: EUPL-1.2
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { APP_DISPLAY_NAME } from '../config/app';
import styles from './App.module.css';
import { LanguageSelect } from './LanguageSelect';

export function App() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    document.title = t('home.documentTitle', { appName: APP_DISPLAY_NAME });
  }, [t, i18n.resolvedLanguage]);

  return (
    <>
      <a className={styles.skipLink} href="#main">
        {t('skipLink')}
      </a>
      <header className={styles.header}>
        <p className={styles.brand}>{APP_DISPLAY_NAME}</p>
        <p className={styles.notice}>{t('prototypeNotice')}</p>
        <LanguageSelect />
      </header>
      <main id="main" tabIndex={-1} className={styles.main}>
        <h1>{t('home.title')}</h1>
        <p>{t('home.intro')}</p>
      </main>
      <footer className={styles.footer}>
        <p>{t('footer.license')}</p>
      </footer>
    </>
  );
}
