// SPDX-License-Identifier: EUPL-1.2
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nProvider } from 'react-aria-components';
import { currentLanguage } from '../i18n';
import { reactAriaLocale } from '../i18n/reactAria';
import { AnnouncerProvider } from '../ui/announcer';
import { ToastProvider } from '../ui/toasts';

export function renderUi(ui: ReactElement) {
  return render(
    <I18nProvider locale={reactAriaLocale(currentLanguage())}>
      <AnnouncerProvider>
        <ToastProvider>{ui}</ToastProvider>
      </AnnouncerProvider>
    </I18nProvider>,
  );
}
