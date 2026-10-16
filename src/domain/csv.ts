// SPDX-License-Identifier: EUPL-1.2

export type CsvValue = string | number | boolean | null | undefined;

const cell = (value: CsvValue) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

/** RFC 4180: comma separated, CRLF line ends, quotes only where needed. */
export const toCsv = (header: string[], rows: CsvValue[][]) =>
  [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
