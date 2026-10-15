// SPDX-License-Identifier: EUPL-1.2
import { expect, test, type Locator, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './axe';

const heading = (page: Page) => page.getByRole('heading', { level: 1 });

/** Presses Tab until the element has focus, failing if the keyboard can never reach it. */
async function tabTo(page: Page, target: Locator, maxPresses = 120) {
  for (let i = 0; i < maxPresses; i++) {
    if (await target.evaluate((el) => el === document.activeElement).catch(() => false)) return;
    await page.keyboard.press('Tab');
  }
  throw new Error(`Not reachable with the keyboard: ${target.toString()}`);
}

async function signedInAs(page: Page, citizen = 'uxia') {
  await page.addInitScript((persona) => {
    localStorage.setItem(
      'quenda.demo',
      JSON.stringify({
        state: {
          role: 'citizen',
          citizen: persona,
          staff: 'carme',
          collapsed: true,
          signedIn: true,
        },
        version: 0,
      }),
    );
  }, citizen);
}

test('book and cancel using only the keyboard, with axe at every step', async ({ page }) => {
  test.slow();
  await page.goto('./bouzalonga');
  await expect(heading(page)).toHaveText('Reserva de instalacións deportivas');
  await expectNoAxeViolations(page);

  const menu = page.getByRole('navigation', { name: 'Menú principal' });
  const menuToggle = menu.getByRole('button', { name: 'Menú' });
  const openMenu = async () => {
    if (await menuToggle.isVisible()) {
      await tabTo(page, menuToggle);
      await page.keyboard.press('Enter');
    }
  };

  await openMenu();
  await tabTo(page, menu.getByRole('link', { name: 'Instalacións' }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Instalacións');
  await expect(heading(page)).toBeFocused();
  await expectNoAxeViolations(page);

  await tabTo(page, page.getByRole('link', { name: 'Pista de tenis do Souto', exact: true }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Pista de tenis do Souto');
  await expectNoAxeViolations(page);

  await tabTo(page, page.getByRole('link', { name: 'Ver dispoñibilidade e reservar' }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Reservar: Pista de tenis do Souto');
  await tabTo(page, page.getByRole('button', { name: 'Día seguinte' }));
  await page.keyboard.press('Enter');
  const freeSlot = page.locator('a[data-status="free"]').first();
  await expect(freeSlot).toBeVisible();
  // Galician names even in Chrome, which ships no Galician locale data.
  await expect(freeSlot).toHaveAccessibleName(
    /^(luns|martes|mércores|xoves|venres|sábado|domingo), \d+ de (xaneiro|febreiro|marzo|abril|maio|xuño|xullo|agosto|setembro|outubro|novembro|decembro), \d\d:\d\d a \d\d:\d\d, libre, \d+,\d\d\s€$/,
  );
  await expectNoAxeViolations(page);

  await tabTo(page, freeSlot);
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Acceder');
  await expectNoAxeViolations(page);

  await tabTo(page, page.getByRole('link', { name: 'Entrar con Cl@ve (simulado)' }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Cl@ve: pasarela simulada');
  await tabTo(page, page.getByRole('button', { name: /Continuar como Uxía/ }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Revisa a túa reserva');
  await expectNoAxeViolations(page);

  const confirm = page.getByRole('button', { name: 'Confirmar a reserva' });
  await tabTo(page, confirm);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Hai 1 erro no formulario' })).toBeVisible();
  await expectNoAxeViolations(page);

  await tabTo(page, page.getByRole('checkbox', { name: 'Lin e acepto as normas de uso' }));
  await page.keyboard.press('Space');
  await tabTo(page, confirm);
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('Reserva confirmada');
  await expect(heading(page)).toBeFocused();
  const code =
    (await page
      .getByText(/^QDA-[A-Z2-9]{4}$/)
      .first()
      .textContent()) ?? '';
  expect(code).toMatch(/^QDA-[A-Z2-9]{4}$/);
  await expect(page.getByRole('status')).toContainText(code);
  await expect(page.getByRole('img', { name: `Código QR da reserva ${code}` })).toBeVisible();
  await expectNoAxeViolations(page);

  await openMenu();
  await tabTo(page, menu.getByRole('link', { name: 'As miñas reservas' }));
  await page.keyboard.press('Enter');
  await expect(heading(page)).toHaveText('As miñas reservas');
  await expectNoAxeViolations(page);

  const card = page.getByRole('listitem').filter({ hasText: code });
  await tabTo(page, card.getByRole('button', { name: 'Cancelar a reserva' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('alertdialog', { name: 'Cancelar a reserva?' })).toBeVisible();
  await expectNoAxeViolations(page);
  await tabTo(page, page.getByRole('button', { name: 'Si, cancelar' }));
  await page.keyboard.press('Enter');
  await expect(page.getByRole('region', { name: 'Avisos' })).toContainText('Reserva cancelada.');
  await expectNoAxeViolations(page);
});

test.describe('citizen screens pass axe', () => {
  test.beforeEach(async ({ page }) => {
    await signedInAs(page);
  });

  for (const [path, title] of [
    ['/bouzalonga/instalacions?tipo=paddleCourt', 'Instalacións'],
    ['/ribasmeiras/instalacions/ribasmeiras-piscina', 'Piscina municipal cuberta'],
    [
      '/ribasmeiras/instalacions/ribasmeiras-padel/reservar?vista=semana',
      'Reservar: Pistas de pádel do Malecón',
    ],
    ['/bouzalonga/reservas', 'As miñas reservas'],
    ['/bouzalonga/avisos', 'Avisos'],
    ['/bouzalonga/calendario', 'Calendario persoal'],
    ['/bouzalonga/perfil', 'O meu perfil'],
    ['/bouzalonga/accesibilidade', 'Declaración de accesibilidade'],
  ] as const) {
    test(path, async ({ page }) => {
      await page.goto(`.${path}`);
      await expect(heading(page)).toHaveText(title);
      await expect(page.locator('[aria-busy="true"]')).toHaveCount(0);
      await expectNoAxeViolations(page);
    });
  }

  test('a council closure offers to move the booking', async ({ page }) => {
    await page.goto('./bouzalonga/avisos');
    const notice = page.getByRole('listitem').filter({ hasText: 'Aviso do concello' });
    await expect(notice).toContainText('Reparación do valado da pista');
    await notice.getByRole('link', { name: 'Escoller outra hora' }).click();
    await expect(heading(page)).toHaveText(/^Reservar:/);
  });

  test('profile errors are summarised and linked to each field', async ({ page }) => {
    await page.goto('./bouzalonga/perfil');
    await page.getByRole('textbox', { name: 'Correo electrónico' }).fill('non-e-un-correo');
    await page.getByRole('button', { name: 'Gardar os cambios' }).click();
    await expect(page.getByRole('heading', { name: 'Hai 1 erro no formulario' })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.getByRole('link', { name: /Escribe un correo válido/ }).click();
    await expect(page.getByRole('textbox', { name: 'Correo electrónico' })).toBeFocused();
  });

  test('a non-resident is told why the pool cannot be booked', async ({ page }) => {
    await signedInAs(page, 'brais');
    await page.goto('./ribasmeiras/instalacions/ribasmeiras-piscina/reservar');
    await page.getByRole('button', { name: 'Día seguinte' }).click();
    await page.locator('a[data-status="free"]').first().click();
    await expect(
      page.getByRole('heading', { name: 'Non se pode reservar esta hora' }),
    ).toBeVisible();
    await expect(page.getByText(/só se pode reservar se estás empadroado/)).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test.describe('reflow at 320 px', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const path of [
    '/bouzalonga/instalacions',
    '/ribasmeiras/instalacions/ribasmeiras-padel/reservar',
  ]) {
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
