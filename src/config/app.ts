// SPDX-License-Identifier: EUPL-1.2

// Product name: to rename, change it here, in package.json and in index.html.
export const APP_NAME = 'quenda';
export const APP_DISPLAY_NAME = 'Quenda';

export const LANGUAGES = ['gl', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'gl';

// Each language is shown by its own name, whatever the UI language, so these are not translated.
export const LANGUAGE_NAMES: Record<Language, string> = {
  gl: 'Galego',
  es: 'Castellano',
};
