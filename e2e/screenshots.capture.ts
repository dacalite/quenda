// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Page } from '@playwright/test';

// Screens for the documentation, in Galician, on a fixed day so every run gives the same images.
// Run with `npm run screenshots`; the files go to docs/capturas/<device>/.

const DAY = Date.parse('2026-10-19T10:00:00+02:00');

type Role = 'citizen' | 'staff' | 'deputacion';

async function prepare(page: Page, role: Role) {
  await page.addInitScript(
    ({ fixed, role }) => {
      const RealDate = Date;
      class FrozenDate extends RealDate {
        constructor(value?: string | number | Date) {
          super(value ?? fixed);
        }
        static override now() {
          return fixed;
        }
      }
      window.Date = FrozenDate as DateConstructor;
      localStorage.setItem(
        'quenda.demo',
        JSON.stringify({
          state: { role, citizen: 'uxia', staff: 'carme', signedIn: true },
          version: 0,
        }),
      );
    },
    { fixed: DAY, role },
  );
}

async function settle(page: Page) {
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  // Fonts and the QR code finish drawing after the data arrives.
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

async function capture(page: Page, name: string) {
  await settle(page);
  // Nothing should keep the focus ring of the last click in the picture.
  await page.evaluate(() => {
    (document.activeElement as HTMLElement | null)?.blur();
  });
  await page.screenshot({
    path: `docs/capturas/${test.info().project.name}/${name}.png`,
    fullPage: true,
    animations: 'disabled',
    // A transformed ancestor holds the residents' fixed tab bar, so it lands at the end of the page.
    style: '[data-tabbar] { transform: translateZ(0); }',
  });
}

/** React Aria names a select's button «value label», so the label is matched at the end. */
async function choose(page: Page, label: string, option: string) {
  await page.getByRole('button', { name: new RegExp(`${label}$`) }).click();
  await page.getByRole('option', { name: option }).click();
}

async function typeTime(page: Page, label: string, hour: string) {
  await page.getByRole('group', { name: label }).getByRole('spinbutton', { name: /hora/ }).click();
  await page.keyboard.type(hour);
}

test.use({ timezoneId: 'Europe/Madrid', locale: 'gl-ES' });

test('citizen screens', async ({ page }) => {
  await prepare(page, 'citizen');

  await page.goto('./');
  await capture(page, '00-perfil');

  await page.goto('./bouzalonga');
  await capture(page, '01-inicio');

  await page.goto('./bouzalonga/instalacions/bouzalonga-pavillon');
  await capture(page, '02-ficha');

  await page.goto('./bouzalonga/instalacions/bouzalonga-padel/reservar');
  await capture(page, '03-franxas');

  const reservation = await page.evaluate(() => {
    const db = JSON.parse(localStorage.getItem('quenda.db') ?? '{}') as {
      reservations?: { id: string; status: string; date: string; holder: { userId?: string } }[];
    };
    return db.reservations?.find(
      (r) =>
        r.holder.userId === 'bouzalonga-uxia' && r.status === 'confirmed' && r.date >= '2026-10-19',
    )?.id;
  });
  expect(reservation).toBeTruthy();
  await page.goto(`./bouzalonga/reservas/${String(reservation)}?nova=1`);
  await capture(page, '04-confirmacion');

  await page.goto('./bouzalonga/reservas');
  await capture(page, '05-reservas');

  await page.goto('./bouzalonga/calendario');
  await page.getByRole('button', { name: /30 de outubro de 2026/ }).click();
  await capture(page, '14-calendario');

  await page.goto('./ribasmeiras');
  await capture(page, '12-inicio-ribasmeiras');
});

test('council screens', async ({ page }) => {
  await prepare(page, 'staff');

  await page.goto('./ribasmeiras/xestion');
  await capture(page, '06-panel');

  await page.goto('./ribasmeiras/xestion/bloqueos');
  await settle(page);
  await choose(page, 'Instalación', 'Pistas de pádel do Malecón');
  await typeTime(page, 'Desde as', '16');
  await typeTime(page, 'Ata as', '22');
  await page
    .getByRole('textbox', { name: /Explicación para as persoas afectadas/ })
    .fill('Cambio da céspede artificial');
  await page.getByRole('button', { name: 'Comprobar as reservas afectadas' }).click();
  await expect(page.getByRole('heading', { name: /reservas? afectadas?$/ })).toBeVisible();
  await capture(page, '07-bloqueo');

  await page.goto('./ribasmeiras/xestion/tempada/nova');
  await settle(page);
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await choose(page, 'Instalación', 'Pavillón municipal da Ribeira');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await choose(page, 'Hora de inicio', '18:00');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await expect(page.getByRole('group', { name: 'Datas con conflito' })).toBeVisible();
  await capture(page, '08-tempada');

  await page.goto('./ribasmeiras/xestion/indicadores');
  await capture(page, '09-indicadores');

  await page.goto('./ribasmeiras/xestion/configuracion');
  await capture(page, '10-configuracion');
});

test('deputación screens', async ({ page }) => {
  await prepare(page, 'deputacion');

  await page.goto('./deputacion');
  await capture(page, '11-deputacion');

  await page.goto('./deputacion/novo-concello');
  await capture(page, '13-alta-concello');
});
