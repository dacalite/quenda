// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const toasts = (page: Page) => page.getByRole('region', { name: 'Avisos' });

// Monday 19 October 2026, 10:00 in Galicia: the seed is generated around this day.
// Only Date is frozen; Playwright's clock would also replace Intl, which the Galician fallback extends.
test.use({ timezoneId: 'Europe/Madrid' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript((fixed) => {
    const RealDate = Date;
    class FrozenDate extends RealDate {
      // The app only builds dates from nothing, a timestamp or a string.
      constructor(value?: string | number | Date) {
        super(value ?? fixed);
      }
      static override now() {
        return fixed;
      }
    }
    window.Date = FrozenDate as DateConstructor;
  }, Date.parse('2026-10-19T10:00:00+02:00'));
});

async function asStaff(page: Page, staff: 'carme' | 'xose' = 'carme') {
  await page.addInitScript((persona) => {
    localStorage.setItem(
      'quenda.demo',
      JSON.stringify({
        state: { role: 'staff', citizen: 'uxia', staff: persona, collapsed: true, signedIn: false },
        version: 0,
      }),
    );
  }, staff);
}

async function open(page: Page, path: string) {
  await page.goto(`./ribasmeiras/xestion${path}`);
  await expect(heading(page)).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

/** React Aria names a select's button «value label», so the label is matched at the end. */
async function choose(page: Page, label: string, option: string | RegExp) {
  await page.getByRole('button', { name: new RegExp(`${label}$`) }).click();
  await page.getByRole('option', { name: option }).click();
}

async function typeTime(page: Page, label: string, hour: string) {
  await page.getByRole('group', { name: label }).getByRole('spinbutton', { name: /hora/ }).click();
  await page.keyboard.type(hour);
}

test.describe('council screens pass axe', () => {
  for (const [path, title] of [
    ['', 'Panel de xestión'],
    ['/axenda', 'Axenda'],
    ['/axenda?vista=semana', 'Axenda'],
    ['/nova-reserva', 'Reserva por teléfono ou no mostrador'],
    ['/acceso', 'Control de acceso'],
    ['/indicadores', 'Indicadores'],
    ['/instalacions', 'Instalacións'],
    ['/instalacions/nova', 'Nova instalación'],
    ['/instalacions/ribasmeiras-padel', 'Editar: Pistas de pádel do Malecón'],
    ['/instalacions/ribasmeiras-padel/horario', 'Horario: Pistas de pádel do Malecón'],
    ['/bloqueos', 'Bloqueos'],
    ['/tempada', 'Reservas de tempada'],
    ['/tempada/nova', 'Nova reserva de tempada'],
    ['/configuracion', 'Configuración do concello'],
    ['/actividade', 'Rexistro de actividade'],
  ] as const) {
    test(path || '/', async ({ page }) => {
      await asStaff(page);
      await open(page, path);
      await expect(heading(page)).toHaveText(title);
      await expectNoAxeViolations(page);
    });
  }
});

test('a block cancels the bookings in the way and tells each person', async ({ page }) => {
  await asStaff(page);
  await open(page, '/bloqueos');
  await choose(page, 'Instalación', 'Pistas de pádel do Malecón');
  await typeTime(page, 'Desde as', '16');
  await typeTime(page, 'Ata as', '22');
  await page
    .getByRole('textbox', { name: /Explicación para as persoas afectadas/ })
    .fill('Cambio da céspede artificial');
  await page.getByRole('button', { name: 'Comprobar as reservas afectadas' }).click();

  const preview = page.getByRole('heading', { name: /reservas? afectadas?$/ });
  await expect(preview).toBeVisible();
  const affected = Number((await preview.textContent())?.match(/\d+/)?.[0]);
  expect(affected).toBeGreaterThan(0);
  await expect(
    page.getByRole('group', { name: 'Reservas afectadas' }).getByRole('row'),
  ).toHaveCount(affected + 1);
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: /^Bloquear e avisar/ }).click();
  await expect(toasts(page)).toContainText(`Bloqueo creado`);
  await expect(page.getByRole('group', { name: 'Bloqueos vixentes e próximos' })).toContainText(
    'Cambio da céspede artificial',
  );

  await open(page, '/axenda?instalacion=ribasmeiras-padel');
  const evening = page.getByRole('row', { name: /^18:00/ });
  await expect(evening).toContainText('pechada por mantemento ou evento');
});

test('a season booking previews its conflicts and skips them', async ({ page }) => {
  await asStaff(page);
  await open(page, '/tempada/nova');
  const step = page.getByRole('heading', { level: 2, name: /^Paso/ });
  await expect(step).toHaveText('Paso 1 de 5: entidade');

  await page.getByRole('button', { name: 'Seguinte' }).click();
  await expect(page.getByRole('heading', { name: 'Hai 1 erro no formulario' })).toBeVisible();
  await page.getByRole('radio').first().focus();
  await page.keyboard.press('Space');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await expect(step).toHaveText('Paso 2 de 5: instalación');
  await expect(step).toBeFocused();

  await choose(page, 'Instalación', 'Pavillón municipal da Ribeira');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await choose(page, 'Hora de inicio', '18:00');
  await page.getByRole('button', { name: 'Seguinte' }).click();
  await expect(step).toHaveText('Paso 4 de 5: tempada');
  await page.getByRole('button', { name: 'Seguinte' }).click();

  await expect(step).toHaveText('Paso 5 de 5: revisión');
  await expect(page.getByText(/^Reservaranse \d+ datas\./)).toBeVisible();
  await expect(page.getByRole('group', { name: 'Datas con conflito' })).toBeVisible();
  await expectNoAxeViolations(page);

  await page.getByRole('button', { name: 'Crear saltando as datas con conflito' }).click();
  await expect(toasts(page)).toContainText('Reserva de tempada creada');
  await expect(heading(page)).toHaveText('Reservas de tempada');
});

test('a phone booking registers the caller and the door checks them in', async ({ page }) => {
  await asStaff(page, 'xose');
  await open(page, '/nova-reserva');

  await page.getByRole('button', { name: 'Confirmar a reserva' }).click();
  await expect(page.getByRole('heading', { name: 'Hai 2 erros no formulario' })).toBeVisible();

  await page.getByRole('button', { name: 'Dar de alta unha persoa nova' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Antía');
  await page.getByRole('textbox', { name: 'Apelidos' }).fill('Proba Telefónica');
  await page.getByRole('textbox', { name: 'Teléfono' }).fill('600 123 456');
  await page.getByRole('button', { name: 'Gardar e seleccionar' }).click();
  await expect(page.getByText(/^Reserva para: Antía Proba Telefónica/)).toBeVisible();

  await page.getByRole('button', { name: /Hora libre$/ }).click();
  await page.getByRole('option').last().click();
  await expect(page.getByText(/^Prezo:/)).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar a reserva' }).click();

  await expect(toasts(page)).toContainText('Enviouse un SMS a Antía');
  await expect(heading(page)).toHaveText(/^Reserva QDA-/);
  const code = (await heading(page).textContent())?.replace('Reserva ', '') ?? '';
  await expect(page.getByText('Teléfono', { exact: true })).toBeVisible();

  await open(page, '/acceso');
  await page.getByRole('textbox', { name: 'Código da reserva' }).fill(code.toLowerCase());
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.getByText('Reserva válida: pode entrar.')).toBeVisible();
  await expectNoAxeViolations(page);
  await page
    .getByRole('button', { name: `Rexistrar a entrada da reserva ${code}` })
    .first()
    .click();
  await expect(toasts(page)).toContainText(`Entrada rexistrada: ${code}`);
  await expect(page.getByText('A entrada desta reserva xa está rexistrada.')).toBeVisible();
});

test('an unknown code is reported, not ignored', async ({ page }) => {
  await asStaff(page, 'xose');
  await open(page, '/acceso');
  await page.getByRole('textbox', { name: 'Código da reserva' }).fill('QDA-0000');
  await page.getByRole('button', { name: 'Comprobar' }).click();
  await expect(page.getByText('Non hai ningunha reserva co código QDA-0000')).toBeVisible();
});

test('the caretaker sees operations but not the configuration', async ({ page }) => {
  await asStaff(page, 'xose');
  await open(page, '');
  const nav = page.getByRole('navigation', { name: 'Menú de xestión' });
  const menu = nav.getByRole('button', { name: 'Menú' });
  if (await menu.isVisible()) await menu.click();
  await expect(nav.getByRole('link', { name: 'Control de acceso' })).toBeVisible();
  await expect(nav.getByRole('link', { name: 'Configuración' })).toHaveCount(0);
  await page.goto('./ribasmeiras/xestion/configuracion');
  await expect(heading(page)).toHaveText('Panel de xestión');
});

test('residents cannot open the council tools', async ({ page }) => {
  await page.goto('./ribasmeiras/xestion');
  await expect(heading(page)).toHaveText('Reserva de instalacións deportivas');
});

test('the facility form lists every problem and leads to each field', async ({ page }) => {
  await asStaff(page);
  await open(page, '/instalacions/nova');
  await page.getByRole('button', { name: 'Crear a instalación' }).click();
  const summary = page.getByRole('heading', { name: /^Hai \d+ erros no formulario$/ });
  await expect(summary).toBeVisible();
  await expectNoAxeViolations(page);
  await page.getByRole('link', { name: 'Completa o campo «Enderezo».' }).click();
  await expect(page.getByRole('textbox', { name: 'Enderezo' })).toBeFocused();
});

test('a brand colour without enough contrast gets an accessible proposal', async ({ page }) => {
  await asStaff(page);
  await open(page, '/configuracion');
  const colour = page.getByRole('textbox', { name: 'Cor corporativa' });
  await colour.fill('#ffcc00');
  await expect(page.getByText(/por baixo do mínimo de 4,5:1/)).toBeVisible();
  await page.getByRole('button', { name: /^Usar #/ }).click();
  await expect(page.getByText(/Cumpre a WCAG 2.1 AA/)).toBeVisible();
  await page.getByRole('button', { name: 'Gardar a configuración' }).click();
  await expect(toasts(page)).toContainText('Configuración gardada.');
});

test.describe('reflow at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ['', '/axenda', '/nova-reserva', '/indicadores']) {
    test(path || '/', async ({ page }) => {
      await asStaff(page);
      await open(page, path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    });
  }
});
