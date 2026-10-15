// SPDX-License-Identifier: EUPL-1.2
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_NAME, DEFAULT_LANGUAGE, LANGUAGES, type Language } from '../config/app';
import esCommon from './es/common.json';
import glCommon from './gl/common.json';

export const resources = {
  gl: { common: glCommon },
  es: { common: esCommon },
} as const;

const STORAGE_KEY = `${APP_NAME}.language`;

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find((language) => language === saved) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

i18n.on('languageChanged', (language) => {
  document.documentElement.lang = language;
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage blocked (private mode): the choice simply lasts for this visit.
  }
});

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  defaultNS: 'common',
  initAsync: false,
  interpolation: { escapeValue: false }, // React already escapes output
});

export default i18n;
