// SPDX-License-Identifier: EUPL-1.2
import { describe, expect, it } from 'vitest';
import { toCsv } from './csv';

describe('toCsv', () => {
  it('writes RFC 4180 rows, quoting only where needed', () => {
    expect(
      toCsv(
        ['Instalación', 'Ocupación', 'Nota'],
        [
          ['Pista 1', 0.25, 'sen incidencias'],
          ['Sala "A", planta 1', 1, 'liña 1\nliña 2'],
          ['Ximnasio', null, undefined],
        ],
      ),
    ).toBe(
      'Instalación,Ocupación,Nota\r\n' +
        'Pista 1,0.25,sen incidencias\r\n' +
        '"Sala ""A"", planta 1",1,"liña 1\nliña 2"\r\n' +
        'Ximnasio,,\r\n',
    );
  });
});
