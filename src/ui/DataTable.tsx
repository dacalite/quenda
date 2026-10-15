// SPDX-License-Identifier: EUPL-1.2
import { useId, type ReactNode } from 'react';
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
}

export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  hideCaption = false,
}: DataTableProps<T>) {
  const captionId = useId();
  return (
    // Focusable so keyboard users can scroll a wide table on small screens.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
    <div className={styles.scroller} role="region" aria-labelledby={captionId} tabIndex={0}>
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
