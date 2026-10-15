// SPDX-License-Identifier: EUPL-1.2
import 'i18next';
import type { resources } from '.';

// Typed keys: a missing translation key is a compile error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    resources: (typeof resources)['gl'];
  }
}
