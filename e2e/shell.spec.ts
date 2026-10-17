// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

async function choose(page: Page, label: RegExp, option: string) {
  await expect(heading(page)).toBeVisible();
  const trigger = page.getByRole('button', { name: label });
  await expect(trigger).toBeEnabled();
  await trigger.click();
  await page.getByRole('option', { name: option }).click();
}

test.describe('every view passes axe', () => {
  for (const [path, title] of [
    ['/bouzalonga', 'Reserva de instalacións deportivas'],
    ['/deputacion', 'Concellos adheridos'],
    ['/non-existe', 'Non atopamos esta páxina'],
  ] as const) {
    test(path, async ({ page }) => {
      await page.goto(`.${path}`);
      await expect(heading(page)).toHaveText(title);
      await expectNoAxeViolations(page);
    });
  }

  test('with the preferences dialog open, in high contrast', async ({ page }) => {
    await page.goto('./bouzalonga');
    await expect(heading(page)).toBeVisible();
    await page.getByRole('button', { name: 'Accesibilidade' }).click();
    const dialog = page.getByRole('dialog', { name: 'Preferencias de visualización' });
    // Like a person would, press the visible label rather than the hidden native input.
    await dialog.getByText('Alto contraste').click();
    await dialog.getByText('Moi grande').click();
    await expect(page.locator('html')).toHaveAttribute('data-contrast', 'high');
    await expectNoAxeViolations(page);
  });

  test('with the reset confirmation open, in Spanish', async ({ page }) => {
    await page.goto('./ribasmeiras');
    await choose(page, /Idioma/, 'Castellano');
    await page.getByRole('button', { name: 'Cambiar de perfil' }).click();
    await page.getByRole('button', { name: 'Reiniciar la demostración' }).click();
    await expect(page.getByRole('alertdialog')).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test('the root offers the three profiles and opens the first council', async ({ page }) => {
  await page.goto('./');
  await expect(heading(page)).toHaveText('Como queres probar Quenda?');
  await expectNoAxeViolations(page);
  await page.getByRole('link', { name: 'Cidadanía' }).click();
  await expect(page).toHaveURL(/\/bouzalonga$/);
  await expect(page).toHaveTitle('Reserva de instalacións deportivas · Concello de Bouzalonga');
});

test('the skip link is the first tab stop and moves focus to main', async ({ page }) => {
  await page.goto('./bouzalonga');
  await expect(heading(page)).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Saltar ao contido' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('navigating moves focus to the new heading and updates the title', async ({ page }) => {
  await page.goto('./bouzalonga');
  await expect(heading(page)).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar de perfil' }).click();
  await page.getByRole('link', { name: 'Persoal do concello' }).click();
  await expect(heading(page)).toHaveText('Panel de xestión');
  await expect(heading(page)).toBeFocused();
  await expect(page).toHaveTitle('Panel de xestión · Concello de Bouzalonga');
  await expect(page.getByRole('status')).toContainText('Panel de xestión');
});

test('switching council changes the brand colour', async ({ page }) => {
  await page.goto('./bouzalonga');
  await expect(heading(page)).toBeVisible();
  const accent = () =>
    page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-accent'),
    );
  const before = await accent();
  await page.getByRole('button', { name: 'Cambiar de perfil' }).click();
  await choose(page, /Concello/, 'Concello de Ribasmeiras');
  await expect(page).toHaveTitle(/Concello de Ribasmeiras/);
  expect(await accent()).not.toBe(before);
});

test('the chosen language survives a reload', async ({ page }) => {
  await page.goto('./bouzalonga');
  await choose(page, /Idioma/, 'Castellano');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await page.reload();
  await expect(heading(page)).toHaveText('Reserva de instalaciones deportivas');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
});

test('the demo can be reset and says so', async ({ page }) => {
  await page.goto('./bouzalonga');
  await expect(heading(page)).toBeVisible();
  await page.getByRole('button', { name: 'Cambiar de perfil' }).click();
  await page.getByRole('button', { name: 'Reiniciar a demostración' }).click();
  await page.getByRole('button', { name: 'Reiniciar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Avisos' })).toContainText(
    'Demostración reiniciada',
  );
});

test.describe('reflow at 320 px without horizontal scroll', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of ['/bouzalonga', '/deputacion']) {
    test(path, async ({ page }) => {
      await page.goto(`.${path}`);
      await expect(heading(page)).toBeVisible();
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    });
  }
});
