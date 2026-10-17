// SPDX-License-Identifier: EUPL-1.2
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './DataTable.module.css';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  align?: 'start' | 'end';
  /** Marks the cell that names the row, read as its header by screen readers. */
  isRowHeader?: boolean;
}

export interface DataTableProps<T> {
  caption: string;
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  hideCaption?: boolean;
  /** Shown in place of the rows when there are none. */
  empty?: string;
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  hideCaption = false,
  empty,
}: DataTableProps<T>) {
  const { t } = useTranslation('ui');
  const captionId = useId();
  return (
    // Focusable so keyboard users can scroll a wide table on small screens. A group, not a
    // region: the table usually sits in a section with the same name, and landmarks must differ.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className={styles.scroller} role="group" aria-labelledby={captionId} tabIndex={0}>
      <table className={styles.table}>
        <caption id={captionId} className={hideCaption ? 'visually-hidden' : styles.caption}>
          {caption}
        </caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.key} scope="col" data-align={column.align}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className={styles.empty}>
                {empty ?? t('table.empty')}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr key={rowKey(row)}>
              {columns.map((column) =>
                column.isRowHeader ? (
                  <th key={column.key} scope="row" data-align={column.align}>
                    {column.render(row)}
                  </th>
                ) : (
                  <td key={column.key} data-align={column.align}>
                    {column.render(row)}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
