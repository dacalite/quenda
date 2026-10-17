// SPDX-License-Identifier: EUPL-1.2
import { use } from 'react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_NAMES, LANGUAGES } from '../config/app';
import { currentLanguage } from '../i18n';
import { Select } from '../ui/Select';
import { TenantContext } from './contexts';

const OPTIONS = LANGUAGES.map((language) => ({
  id: language,
  label: LANGUAGE_NAMES[language],
  lang: language,
}));

/** The languages the council offers; all of them outside a council. */
export function LanguageSelect({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const tenant = use(TenantContext);
  return (
    <Select
      label={t('language.label')}
      options={tenant ? OPTIONS.filter((o) => tenant.languages.includes(o.id)) : OPTIONS}
      value={currentLanguage()}
      onChange={(language) => void i18n.changeLanguage(language)}
      className={className}
    />
  );
}
