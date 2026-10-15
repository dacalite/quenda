// SPDX-License-Identifier: EUPL-1.2
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { I18nProvider } from 'react-aria-components';
import { useTranslation } from 'react-i18next';
import { NotFoundError, RuleViolationError } from '../../data/ports/errors';
import type { Repositories } from '../../data/ports/repositories';
import { currentLanguage } from '../../i18n';
import { reactAriaLocale } from '../../i18n/reactAria';
import { AnnouncerProvider } from '../../ui/announcer';
import { ToastProvider } from '../../ui/toasts';
import { localRepositories, RepositoriesContext } from '../repositories';

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        refetchOnWindowFocus: false,
        // A missing row or a broken rule will not fix itself by retrying.
        retry: (failures, error) =>
          !(error instanceof NotFoundError || error instanceof RuleViolationError) && failures < 2,
      },
    },
  });

export function AppProviders({
  children,
  repositories = localRepositories,
}: {
  children: ReactNode;
  repositories?: Repositories;
}) {
  // Re-renders the tree, and React Aria's locale, when the language changes.
  useTranslation();
  const [queryClient] = useState(createQueryClient);
  return (
    <RepositoriesContext value={repositories}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={reactAriaLocale(currentLanguage())}>
          <AnnouncerProvider>
            <ToastProvider>{children}</ToastProvider>
          </AnnouncerProvider>
        </I18nProvider>
      </QueryClientProvider>
    </RepositoriesContext>
  );
}
