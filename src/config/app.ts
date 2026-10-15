// SPDX-License-Identifier: EUPL-1.2

// Also in package.json and index.html.
export const APP_NAME = 'quenda';
export const APP_DISPLAY_NAME = 'Quenda';

export const LANGUAGES = ['gl', 'es'] as const;
export type Language = (typeof LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'gl';

export const LANGUAGE_NAMES: Record<Language, string> = {
  gl: 'Galego',
  es: 'Castellano',
};
