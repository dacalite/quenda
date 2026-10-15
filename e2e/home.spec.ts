// SPDX-License-Identifier: EUPL-1.2
import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

test.describe('home', () => {
  test('has no axe violations', async ({ page }) => {
    await page.goto('./');
    await expectNoAxeViolations(page);
  });

  test('skip link is the first tab stop and moves focus to main', async ({ page }) => {
    await page.goto('./');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('link', { name: 'Saltar ao contido' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('main')).toBeFocused();
  });

  test('language change translates the page and survives a reload', async ({ page }) => {
    await page.goto('./');
    await page.getByLabel('Idioma').selectOption('es');

    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Reserva de instalaciones deportivas municipales',
    );

    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expectNoAxeViolations(page);
  });

  test('reflows at 320 px without horizontal scroll', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await page.goto('./');
    const overflows = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
    );
    expect(overflows).toBe(false);
  });
});
