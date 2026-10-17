// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';
import { freezeDate } from './clock';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });
const step = (page: Page) => page.getByRole('dialog');

// The tour shows the quiet hours of today, so there must be some left.
test.use({ timezoneId: 'Europe/Madrid' });
test.beforeEach(async ({ page }) => {
  await freezeDate(page);
});

async function expectStep(page: Page, progress: string, title: string) {
  await expect(step(page)).toBeFocused();
  await expect(step(page)).toHaveAccessibleName(title);
  await expect(step(page)).toContainText(progress);
  await expect(step(page)).toContainText('Coas frechas');
}

test.describe('first visit', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('opens the tour by itself once, as an accessible non-modal dialog', async ({ page }) => {
    await page.goto('./bouzalonga');
    await expectStep(page, 'Paso 1 de 7', 'Visita guiada: reservar como veciña');
    await expect(page).toHaveURL(/\/bouzalonga$/);
    await expectNoAxeViolations(page);

    await page.keyboard.press('Escape');
    await expect(step(page)).toHaveCount(0);
    await expect(heading(page)).toBeFocused();

    await page.reload();
    await expect(heading(page)).toBeVisible();
    await expect(step(page)).toHaveCount(0);
  });

  test('keeps the step clear of the tab bar on a phone', async ({ page }) => {
    await page.goto('./bouzalonga');
    await expectStep(page, 'Paso 1 de 7', 'Visita guiada: reservar como veciña');
    const tabs = page.getByRole('navigation', { name: 'Menú principal' });
    const bar = await tabs.boundingBox();
    const dialog = await step(page).boundingBox();
    const fixed = await tabs.evaluate((nav) => getComputedStyle(nav).position === 'fixed');
    test.skip(!fixed, 'Only small screens have the tab bar at the bottom');
    expect((dialog?.y ?? 0) + (dialog?.height ?? 0)).toBeLessThanOrEqual(bar?.y ?? 0);
  });

  test('walks the resident through booking, keyboard only', async ({ page }) => {
    await page.goto('./bouzalonga');
    await expectStep(page, 'Paso 1 de 7', 'Visita guiada: reservar como veciña');

    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 2 de 7', 'Buscar instalacións');
    await expect(heading(page)).toHaveText('Instalacións');

    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 3 de 7', 'Ver a dispoñibilidade');
    await expect(heading(page)).toHaveText(/^Reservar: /);
    await expect(page.locator('[data-tour-highlight]')).toContainText('Horas con pouca xente');
    await expectNoAxeViolations(page);

    await page.keyboard.press('ArrowLeft');
    await expectStep(page, 'Paso 2 de 7', 'Buscar instalacións');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 4 de 7', 'Revisar e confirmar');
    await expect(heading(page)).toHaveText('Revisa a túa reserva');

    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 5 de 7', 'Código QR e calendario');
    await expect(heading(page)).toHaveText(/^Reserva QDA-/);
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 6 de 7', 'As miñas reservas');
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 7 de 7', 'Cambiar ou cancelar');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await expect(step(page).getByRole('button', { name: 'Rematar' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(step(page)).toHaveCount(0);
    await expect(heading(page)).toBeFocused();
  });

  test('shows the council and the deputación their own tour', async ({ page }) => {
    await page.goto('./deputacion');
    await expectStep(page, 'Paso 1 de 5', 'Visita guiada: a deputación');
    for (const title of [
      'Concellos adheridos',
      'Indicadores comparados',
      'Alta dun concello en quente',
    ]) {
      await page.keyboard.press('ArrowRight');
      await expect(step(page)).toHaveAccessibleName(title);
    }
    await expect(heading(page)).toHaveText('Alta dun concello novo');
    await step(page).getByRole('button', { name: 'Saír da visita' }).click();
    await expect(step(page)).toHaveCount(0);

    await page.goto('./deputacion');

    await page.getByRole('button', { name: 'Xestionar Concello de Bouzalonga' }).click();
    await expectStep(page, 'Paso 1 de 7', 'Visita guiada: o día a día do concello');
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('ArrowRight');
    await expectStep(page, 'Paso 3 de 7', 'Dar de alta unha instalación');
    await expect(heading(page)).toHaveText('Nova instalación');
  });
});

test('reopens from the demo bar and gives the focus back to it', async ({ page }) => {
  await page.goto('./ribasmeiras');
  await expect(heading(page)).toBeVisible();
  const open = page.getByRole('button', { name: 'Visita guiada' });
  await open.click();
  await expectStep(page, 'Paso 1 de 7', 'Visita guiada: reservar como veciña');
  await page.keyboard.press('Escape');
  await expect(open).toBeFocused();
});
