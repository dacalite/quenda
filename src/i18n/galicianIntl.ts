// SPDX-License-Identifier: EUPL-1.2

// Chrome ships no Galician locale data: with `gl` it falls back to Spanish or even to English
// ("M10 20, Tue"), which also breaks React Aria's labels and i18next plurals. Galician uses the
// same patterns as Spanish, so we format with `es` and swap in the Galician words.

type Width = 'long' | 'short' | 'narrow';

const MONTHS: Record<Width, string[]> = {
  long: [
    'xaneiro',
    'febreiro',
    'marzo',
    'abril',
    'maio',
    'xuño',
    'xullo',
    'agosto',
    'setembro',
    'outubro',
    'novembro',
    'decembro',
  ],
  short: [
    'xan.',
    'feb.',
    'mar.',
    'abr.',
    'maio',
    'xuño',
    'xul.',
    'ago.',
    'set.',
    'out.',
    'nov.',
    'dec.',
  ],
  narrow: ['X', 'F', 'M', 'A', 'M', 'X', 'X', 'A', 'S', 'O', 'N', 'D'],
};

const WEEKDAYS: Record<Width, string[]> = {
  long: ['domingo', 'luns', 'martes', 'mércores', 'xoves', 'venres', 'sábado'],
  short: ['dom.', 'luns', 'mar.', 'mér.', 'xov.', 'ven.', 'sáb.'],
  narrow: ['D', 'L', 'M', 'M', 'X', 'V', 'S'],
};

const DATE_FIELDS: Record<string, string> = {
  era: 'era',
  year: 'ano',
  month: 'mes',
  weekOfYear: 'semana',
  weekday: 'día da semana',
  day: 'día',
  dayPeriod: 'a. m./p. m.',
  hour: 'hora',
  minute: 'minuto',
  second: 'segundo',
  timeZoneName: 'fuso horario',
};

const isGalician = (locales: Intl.LocalesArgument) =>
  [locales].flat().some((locale) => String(locale).toLowerCase().startsWith('gl'));

const asSpanish = (locales: Intl.LocalesArgument) => (isGalician(locales) ? 'es-ES' : locales);

type IntlConstructors = Pick<
  typeof Intl,
  'DateTimeFormat' | 'NumberFormat' | 'PluralRules' | 'ListFormat' | 'DisplayNames'
>;

// Intl's members are not enumerable, so they are picked one by one rather than spread.
const nativeConstructors = (): IntlConstructors => ({
  DateTimeFormat: Intl.DateTimeFormat,
  NumberFormat: Intl.NumberFormat,
  PluralRules: Intl.PluralRules,
  ListFormat: Intl.ListFormat,
  DisplayNames: Intl.DisplayNames,
});

/** Patched Intl constructors; `native` holds the browser's own ones. */
export function createGalicianIntl(native: IntlConstructors) {
  class DateTimeFormat extends native.DateTimeFormat {
    readonly #galician: boolean;
    readonly #options: Intl.DateTimeFormatOptions;
    readonly #calendarParts: Intl.DateTimeFormat;

    constructor(locales?: Intl.LocalesArgument, options: Intl.DateTimeFormatOptions = {}) {
      super(asSpanish(locales), options);
      this.#galician = isGalician(locales);
      this.#options = options;
      this.#calendarParts = new native.DateTimeFormat('en-US', {
        timeZone: super.resolvedOptions().timeZone,
        weekday: 'short',
        month: 'numeric',
      });
    }

    override formatToParts(date?: Date | number): Intl.DateTimeFormatPart[] {
      const parts = super.formatToParts(date);
      if (!this.#galician) return parts;
      const reference = this.#calendarParts.formatToParts(date);
      const month = Number(reference.find((p) => p.type === 'month')?.value ?? 1) - 1;
      const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
        reference.find((p) => p.type === 'weekday')?.value ?? 'Sun',
      );
      const { month: monthWidth, weekday: weekdayWidth = 'long' } = this.#options;
      return parts.map((part) => {
        if (part.type === 'weekday') {
          return { ...part, value: WEEKDAYS[weekdayWidth][weekday] ?? part.value };
        }
        if (
          part.type === 'month' &&
          (monthWidth === 'long' || monthWidth === 'short' || monthWidth === 'narrow')
        ) {
          return { ...part, value: MONTHS[monthWidth][month] ?? part.value };
        }
        return part;
      });
    }

    override format = (date?: Date | number) =>
      this.formatToParts(date)
        .map((part) => part.value)
        .join('');

    override formatRange(start: Date | number, end: Date | number) {
      return this.#galician
        ? `${this.format(start)} – ${this.format(end)}`
        : super.formatRange(start, end);
    }

    override resolvedOptions() {
      const options = super.resolvedOptions();
      return this.#galician ? { ...options, locale: 'gl-ES' } : options;
    }
  }

  class NumberFormat extends native.NumberFormat {
    constructor(locales?: Intl.LocalesArgument, options?: Intl.NumberFormatOptions) {
      super(asSpanish(locales), options);
    }
  }

  class PluralRules extends native.PluralRules {
    constructor(locales?: Intl.LocalesArgument, options?: Intl.PluralRulesOptions) {
      super(asSpanish(locales), options);
    }
  }

  class ListFormat extends native.ListFormat {
    readonly #galician: boolean;
    constructor(locales?: Intl.LocalesArgument, options?: Intl.ListFormatOptions) {
      super(asSpanish(locales), options);
      this.#galician = isGalician(locales);
    }
    override formatToParts(list: Iterable<string>) {
      const parts = super.formatToParts(list);
      if (!this.#galician) return parts;
      return parts.map((part) =>
        part.type === 'literal'
          ? { ...part, value: part.value.replace(/\by\b|\be\b/, 'e').replace(/\bo\b|\bu\b/, 'ou') }
          : part,
      );
    }
    override format(list: Iterable<string>) {
      return this.formatToParts(list)
        .map((part) => part.value)
        .join('');
    }
  }

  class DisplayNames extends native.DisplayNames {
    readonly #galicianFields: boolean;
    constructor(locales: Intl.LocalesArgument, options: Intl.DisplayNamesOptions) {
      super(asSpanish(locales), options);
      this.#galicianFields = isGalician(locales) && options.type === 'dateTimeField';
    }
    override of(code: string) {
      return (this.#galicianFields ? DATE_FIELDS[code] : undefined) ?? super.of(code);
    }
  }

  return { DateTimeFormat, NumberFormat, PluralRules, ListFormat, DisplayNames };
}

/** Whether the browser formats Galician by itself (Firefox, Safari) or needs our help (Chrome). */
export const hasNativeGalician = (native: IntlConstructors = nativeConstructors()) =>
  new native.DateTimeFormat('gl', { month: 'long', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2026, 9, 15)),
  ) === 'outubro' &&
  new native.PluralRules('gl').resolvedOptions().pluralCategories.includes('one');

export function installGalicianIntl() {
  if (hasNativeGalician()) return;
  Object.assign(Intl, createGalicianIntl(nativeConstructors()));
}
