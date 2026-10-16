// SPDX-License-Identifier: EUPL-1.2
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { APP_NAME, DEFAULT_LANGUAGE, LANGUAGES, type Language } from '../config/app';
import esAdmin from './es/admin.json';
import esCitizen from './es/citizen.json';
import esCommon from './es/common.json';
import esDemo from './es/demo.json';
import esDomain from './es/domain.json';
import esUi from './es/ui.json';
import glAdmin from './gl/admin.json';
import glCitizen from './gl/citizen.json';
import glCommon from './gl/common.json';
import glDemo from './gl/demo.json';
import glDomain from './gl/domain.json';
import glUi from './gl/ui.json';
import { installGalicianIntl } from './galicianIntl';
import { setReactAriaLanguage } from './reactAria';

export const resources = {
  gl: {
    common: glCommon,
    ui: glUi,
    demo: glDemo,
    domain: glDomain,
    citizen: glCitizen,
    admin: glAdmin,
  },
  es: {
    common: esCommon,
    ui: esUi,
    demo: esDemo,
    domain: esDomain,
    citizen: esCitizen,
    admin: esAdmin,
  },
} as const;

installGalicianIntl();

const STORAGE_KEY = `${APP_NAME}.language`;

function savedLanguage(): Language {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.find((language) => language === saved) ?? DEFAULT_LANGUAGE;
  } catch {
    return DEFAULT_LANGUAGE;
  }
}

export const currentLanguage = (): Language =>
  LANGUAGES.find((language) => language === i18n.resolvedLanguage) ?? DEFAULT_LANGUAGE;

i18n.on('languageChanged', () => {
  const language = currentLanguage();
  document.documentElement.lang = language;
  setReactAriaLanguage(language);
  try {
    localStorage.setItem(STORAGE_KEY, language);
  } catch {
    // Storage unavailable: the choice lasts for this visit only.
  }
});

void i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage(),
  fallbackLng: DEFAULT_LANGUAGE,
  supportedLngs: LANGUAGES,
  defaultNS: 'common',
  initAsync: false,
  interpolation: { escapeValue: false },
});

export default i18n;
