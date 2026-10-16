// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

// Monday 19 October 2026, 10:00 in Galicia, so a new council always has free slots left today.
// Only Date is frozen; Playwright's clock would also replace Intl, which the Galician fallback extends.
test.use({ timezoneId: 'Europe/Madrid' });
test.beforeEach(async ({ page }) => {
  await page.addInitScript((fixed) => {
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
  }, Date.parse('2026-10-19T10:00:00+02:00'));
});

async function open(page: Page, path: string) {
  await page.goto(`./deputacion${path}`);
  await expect(heading(page)).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
}

/** Types into a field the way a keyboard user reaches it, then leaves the focus there. */
async function type(page: Page, label: string, text: string) {
  const field = page.getByLabel(label);
  await field.focus();
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(text);
}

test.describe('deputación screens pass axe', () => {
  test('councils, comparison and deployment models', async ({ page }) => {
    await open(page, '');
    await expect(heading(page)).toHaveText('Concellos adheridos');
    await expect(page.getByRole('table')).toContainText('Total da deputación');
    await expectNoAxeViolations(page);
  });

  test('each step of the sign-up, with and without errors', async ({ page }) => {
    await open(page, '/novo-concello');
    await expectNoAxeViolations(page);
    await page.getByRole('button', { name: 'Seguinte' }).click();
    await expect(page.locator(':focus')).toContainText('Hai 2 erros no formulario');
    await expectNoAxeViolations(page);
    await type(page, 'Nome do concello', 'Concello de Vilarmoura');
    await page.getByRole('button', { name: 'Seguinte' }).click();
    await expect(page.getByRole('heading', { name: 'Paso 2 de 3: Imaxe' })).toBeFocused();
    await expectNoAxeViolations(page);
    await page.getByRole('button', { name: 'Seguinte' }).click();
    await expect(
      page.getByRole('heading', { name: 'Paso 3 de 3: Instalacións iniciais' }),
    ).toBeFocused();
    await expectNoAxeViolations(page);
  });
});

test('opening the deputación area acts as the deputación', async ({ page }) => {
  await page.goto('./bouzalonga');
  await expect(heading(page)).toBeVisible();
  await page.goto('./deputacion');
  await expect(heading(page)).toHaveText('Concellos adheridos');
  await expect(page.getByRole('button', { name: /Ver como$/ })).toContainText('Deputación');
});

test('a council signed up with the keyboard takes bookings straight away', async ({ page }) => {
  await open(page, '/novo-concello');

  await type(page, 'Nome do concello', 'Concello de Vilarmoura');
  await expect(page.getByLabel('Enderezo web')).toHaveValue('vilarmoura');
  await page.keyboard.press('Enter');

  await expect(page.getByRole('heading', { name: 'Paso 2 de 3: Imaxe' })).toBeFocused();
  await type(page, 'Cor corporativa', '#88ccee');
  await expect(page.getByText(/por baixo do mínimo de 4,5:1/)).toBeVisible();
  await page.getByRole('button', { name: 'Usar #527a8f' }).press('Enter');
  await expect(page.getByLabel('Cor corporativa')).toHaveValue('#527a8f');
  await page.getByRole('button', { name: 'Seguinte' }).press('Enter');

  await expect(
    page.getByRole('heading', { name: 'Paso 3 de 3: Instalacións iniciais' }),
  ).toBeFocused();
  await type(page, 'Enderezo das instalacións', 'Praza do Concello, 1, Vilarmoura');
  await page.keyboard.press('Enter');

  await expect(heading(page)).toBeFocused();
  await expect(page.getByText('O Concello de Vilarmoura xa está dado de alta')).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Concello de Vilarmoura');

  await page.getByRole('link', { name: 'Ver a web de Concello de Vilarmoura' }).click();
  await expect(page).toHaveTitle(/Concello de Vilarmoura/);
  await expect(page.getByRole('link', { name: 'Sala multiusos' })).toBeVisible();
  await page.getByRole('link', { name: 'Pavillón' }).click();
  await page.getByRole('link', { name: 'Pavillón polideportivo', exact: true }).click();
  await page.getByRole('link', { name: 'Ver dispoñibilidade e reservar' }).click();
  await expect(heading(page)).toBeVisible();
  await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
  await expect(page.getByRole('link', { name: /, libre, / }).first()).toBeVisible();
});

test('the manage button opens the council as its administrator', async ({ page }) => {
  await open(page, '');
  await page.getByRole('button', { name: 'Xestionar Concello de Ribasmeiras' }).click();
  await expect(heading(page)).toHaveText('Panel de xestión');
  await expect(page).toHaveURL(/\/ribasmeiras\/xestion$/);
});

test('a web address already in use is refused, naming the field', async ({ page }) => {
  await open(page, '/novo-concello');
  await type(page, 'Nome do concello', 'Concello de Ribasmeiras');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: /Xa hai outro concello/ })).toBeVisible();
  await type(page, 'Enderezo web', 'Ribas Meiras');
  await page.keyboard.press('Enter');
  await expect(page.getByRole('link', { name: /só pode levar letras minúsculas/ })).toBeVisible();
});

test.describe('reflow at 320 px without horizontal scroll', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ['', '/novo-concello']) {
    test(`/deputacion${path}`, async ({ page }) => {
      await open(page, path);
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    });
  }
});
