// SPDX-License-Identifier: EUPL-1.2
import QRCode from 'qrcode';
import { useMemo } from 'react';
import styles from './citizen.module.css';

/** Drawn as SVG in the browser: sharp at any zoom and no network involved. */
export function ReservationQr({ code, alt }: { code: string; alt: string }) {
  const { size, path } = useMemo(() => {
    const { modules } = QRCode.create(code, { errorCorrectionLevel: 'M' });
    let d = '';
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${String(col + 4)} ${String(row + 4)}h1v1h-1z`;
      }
    }
    return { size: modules.size + 8, path: d };
  }, [code]);

  return (
    <svg
      role="img"
      aria-label={alt}
      viewBox={`0 0 ${String(size)} ${String(size)}`}
      className={styles.qr}
    >
      <rect width={size} height={size} fill="#ffffff" />
      <path d={path} fill="#000000" />
    </svg>
  );
}
