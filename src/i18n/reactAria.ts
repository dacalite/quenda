// SPDX-License-Identifier: EUPL-1.2
import es from 'react-aria-components/i18n/es-ES';
import type { Language } from '../config/app';

// React Aria ships no Galician strings. Its global dictionary (meant for SSR) is read once,
// so we register mutable per-package objects and swap their contents when the language changes.

type Variables = Record<string, string | number | boolean>;
type Option = string | (() => string);
interface Formatter {
  plural: (count: number, options: Record<string, Option>) => string;
  number: (value: number) => string;
  select: (options: Record<string, Option>, value: unknown) => string;
}
type Strings = Record<string, string | ((args: Variables, formatter: Formatter) => string)>;

const s = (value: string | number | boolean | undefined) => String(value);

const gl: Record<string, Strings> = {
  'react-aria-components': {
    colorSwatchPicker: 'Mostras de cores',
    dropzoneLabel: 'Zona para soltar ficheiros',
    selectPlaceholder: 'Selecciona un elemento',
    tableResizer: 'Redimensionador de columnas',
  },
  '@react-stately/datepicker': {
    rangeOverflow: (a) => `O valor debe ser ${s(a.maxValue)} ou anterior.`,
    rangeReversed: 'A data de inicio debe ser anterior á data de fin.',
    rangeUnderflow: (a) => `O valor debe ser ${s(a.minValue)} ou posterior.`,
    unavailableDate: 'A data seleccionada non está dispoñible.',
  },
  '@react-aria/autocomplete': { collectionLabel: 'Suxestións' },
  '@react-aria/breadcrumbs': { breadcrumbs: 'Camiño de navegación' },
  '@react-aria/calendar': {
    dateRange: (a) => `${s(a.startDate)} a ${s(a.endDate)}`,
    dateSelected: (a) => `${s(a.date)} seleccionado`,
    finishRangeSelectionPrompt: 'Preme para rematar de seleccionar o intervalo de datas',
    maximumDate: 'Última data dispoñible',
    minimumDate: 'Primeira data dispoñible',
    next: 'Seguinte',
    previous: 'Anterior',
    selectedDateDescription: (a) => `Data seleccionada: ${s(a.date)}`,
    selectedRangeDescription: (a) => `Intervalo seleccionado: ${s(a.dateRange)}`,
    startRangeSelectionPrompt: 'Preme para comezar a seleccionar un intervalo de datas',
    todayDate: (a) => `Hoxe, ${s(a.date)}`,
    todayDateSelected: (a) => `Hoxe, ${s(a.date)} seleccionado`,
  },
  '@react-aria/combobox': {
    buttonLabel: 'Amosar suxestións',
    countAnnouncement: (a, f) =>
      `${f.plural(Number(a.optionCount), {
        one: () => `${f.number(Number(a.optionCount))} opción dispoñible`,
        other: () => `${f.number(Number(a.optionCount))} opcións dispoñibles`,
      })}.`,
    focusAnnouncement: (a, f) =>
      `${f.select(
        {
          true: () =>
            `Entraches no grupo ${s(a.groupTitle)}, con ${f.plural(Number(a.groupCount), {
              one: () => `${f.number(Number(a.groupCount))} opción`,
              other: () => `${f.number(Number(a.groupCount))} opcións`,
            })}. `,
          other: '',
        },
        a.isGroupChange,
      )}${s(a.optionText)}${f.select({ true: ', seleccionada', other: '' }, a.isSelected)}`,
    listboxLabel: 'Suxestións',
    selectedAnnouncement: (a) => `${s(a.optionText)}, seleccionada`,
  },
  '@react-aria/datepicker': {
    calendar: 'Calendario',
    day: 'día',
    dayPeriod: 'a. m./p. m.',
    endDate: 'Data de fin',
    era: 'era',
    hour: 'hora',
    minute: 'minuto',
    month: 'mes',
    second: 'segundo',
    selectedDateDescription: (a) => `Data seleccionada: ${s(a.date)}`,
    selectedRangeDescription: (a) => `Intervalo seleccionado: ${s(a.startDate)} a ${s(a.endDate)}`,
    selectedTimeDescription: (a) => `Hora seleccionada: ${s(a.time)}`,
    startDate: 'Data de inicio',
    timeZoneName: 'fuso horario',
    weekday: 'día da semana',
    year: 'ano',
  },
  '@react-aria/grid': {
    deselectedItem: (a) => `${s(a.item)} non seleccionado.`,
    longPressToSelect: 'Mantén premido para entrar no modo de selección.',
    select: 'Seleccionar',
    selectedAll: 'Todos os elementos seleccionados.',
    selectedCount: (a, f) =>
      `${f.plural(Number(a.count), {
        '=0': 'Ningún elemento seleccionado',
        one: () => `${f.number(Number(a.count))} elemento seleccionado`,
        other: () => `${f.number(Number(a.count))} elementos seleccionados`,
      })}.`,
    selectedItem: (a) => `${s(a.item)} seleccionado.`,
  },
  '@react-aria/gridlist': {
    hasActionAnnouncement: 'a fila ten unha acción',
    hasLinkAnnouncement: (a) => `a fila ten unha ligazón: ${s(a.link)}`,
  },
  '@react-aria/menu': {
    longPressMessage: 'Mantén premido ou preme Alt + frecha abaixo para abrir o menú',
  },
  '@react-aria/numberfield': {
    decrease: (a) => `Reducir ${s(a.fieldLabel)}`,
    increase: (a) => `Aumentar ${s(a.fieldLabel)}`,
    numberField: 'Campo numérico',
  },
  '@react-aria/overlays': { dismiss: 'Pechar' },
  '@react-aria/previewtrigger': { longPressMessage: 'Mantén premido para abrir a vista previa' },
  '@react-aria/searchfield': { 'Clear search': 'Borrar a busca' },
  '@react-aria/spinbutton': { Empty: 'Baleiro' },
  '@react-aria/steplist': { steplist: 'Lista de pasos' },
  '@react-aria/table': {
    ascending: 'ascendente',
    ascendingSort: (a) => `ordenado pola columna ${s(a.columnName)} en orde ascendente`,
    collapse: 'Contraer',
    columnSize: (a) => `${s(a.value)} píxeles`,
    descending: 'descendente',
    descendingSort: (a) => `ordenado pola columna ${s(a.columnName)} en orde descendente`,
    expand: 'Expandir',
    resizerDescription: 'Preme Intro para comezar a redimensionar',
    select: 'Seleccionar',
    selectAll: 'Seleccionar todo',
    sortable: 'columna ordenable',
  },
  '@react-aria/tag': {
    removeButtonLabel: 'Quitar',
    removeDescription: 'Preme Suprimir para quitar a etiqueta.',
  },
  '@react-aria/toast': {
    close: 'Pechar',
    notifications: (a, f) =>
      `${f.plural(Number(a.count), {
        one: () => `${f.number(Number(a.count))} notificación`,
        other: () => `${f.number(Number(a.count))} notificacións`,
      })}.`,
  },
  '@react-aria/tree': { collapse: 'Contraer', expand: 'Expandir' },
};

const spanish = es as unknown as Record<string, Strings>;
// The Spanish bundle still names this package by its old id.
const ALIASES: Record<string, string> = {
  '@react-aria/link-preview': '@react-aria/previewtrigger',
};

const live: Record<string, Strings> = {};
for (const [pkg, strings] of Object.entries(spanish)) live[pkg] = { ...strings };
for (const [alias, pkg] of Object.entries(ALIASES)) live[alias] = { ...spanish[pkg] };

export function setReactAriaLanguage(language: Language) {
  const target = window as unknown as Record<symbol, unknown>;
  target[Symbol.for('react-aria.i18n.locale')] = 'gl-ES';
  target[Symbol.for('react-aria.i18n.strings')] = live;
  for (const [pkg, strings] of Object.entries(live)) {
    const id = ALIASES[pkg] ?? pkg;
    Object.assign(strings, spanish[id], language === 'gl' ? gl[id] : undefined);
  }
}

export const reactAriaLocale = (language: Language) => (language === 'gl' ? 'gl-ES' : 'es-ES');
