// SPDX-License-Identifier: EUPL-1.2
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANGUAGE_NAMES } from '../config/app';
import styles from './LanguageSelect.module.css';

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  const id = useId();

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{t('language.label')}</label>
      <select
        id={id}
        className={styles.select}
        value={i18n.resolvedLanguage}
        onChange={(event) => void i18n.changeLanguage(event.target.value)}
      >
        {LANGUAGES.map((language) => (
          <option key={language} value={language} lang={language}>
            {LANGUAGE_NAMES[language]}
          </option>
        ))}
      </select>
    </div>
  );
}
