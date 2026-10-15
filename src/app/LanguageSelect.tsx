// SPDX-License-Identifier: EUPL-1.2
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES, LANGUAGES } from '../config/app';
import { currentLanguage } from '../i18n';
import { Select } from '../ui/Select';

const OPTIONS = LANGUAGES.map((language) => ({
  id: language,
  label: LANGUAGE_NAMES[language],
  lang: language,
}));

export function LanguageSelect() {
  const { t, i18n } = useTranslation();
  return (
    <Select
      label={t('language.label')}
      options={OPTIONS}
      value={currentLanguage()}
      onChange={(language) => void i18n.changeLanguage(language)}
    />
  );
}
