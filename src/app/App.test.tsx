// SPDX-License-Identifier: EUPL-1.2
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { createLocalDatabase } from '../data/adapters/local/database';
import { createLocalRepositories } from '../data/adapters/local/repositories';
import { generateSeed } from '../data/seed/generate';
import i18n from '../i18n';
import { expectNoAxeViolations } from '../test/axe';
import { AppProviders } from './providers/AppProviders';
import { routes } from './routes/routes';
import { sessionUserId, useDemo, usePreferences, useTour } from './state';

const SEED = generateSeed('2026-10-15');

function renderApp(path = '/') {
  const repositories = createLocalRepositories({
    db: createLocalDatabase(null, 'test', () => structuredClone(SEED)),
    session: () => null,
    latency: false,
  });
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(
    <AppProviders repositories={repositories}>
      <RouterProvider router={router} />
    </AppProviders>,
  );
  return router;
}

async function choose(label: string | RegExp, option: string) {
  await userEvent.click(screen.getByRole('button', { name: label }));
  await userEvent.click(await screen.findByRole('option', { name: option }));
}

async function openSwitcher() {
  await userEvent.click(screen.getByRole('button', { name: 'Cambiar de perfil' }));
  return within(await screen.findByRole('dialog', { name: 'Cambiar de perfil' }));
}

beforeEach(() => {
  localStorage.clear();
  useDemo.setState({
    role: 'citizen',
    citizen: 'uxia',
    staff: 'carme',
    tenantId: null,
    signedIn: false,
  });
  usePreferences.setState({ textSize: 'normal', highContrast: false, reducedMotion: false });
  useTour.setState({ seen: ['citizen', 'staff', 'deputacion'], active: null });
});

afterEach(async () => {
  await i18n.changeLanguage('gl');
});

describe('app shell', () => {
  it('starts on the profile chooser, which opens the first council as a citizen', async () => {
    renderApp();
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Como queres probar Quenda?' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Cidadanía',
      'Persoal do concello',
      'Deputación',
    ]);
    await expectNoAxeViolations();

    await userEvent.click(screen.getByRole('link', { name: 'Cidadanía' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Reserva de instalacións deportivas' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Reserva de instalacións deportivas · Concello de Bouzalonga');
    expect(screen.getByRole('link', { name: 'Saltar ao contido' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(screen.getByRole('main')).toHaveAttribute('id', 'main');
    expect(screen.getByRole('banner')).toHaveTextContent('Concello de Bouzalonga');
    expect(screen.getByRole('contentinfo')).toHaveTextContent('Prototipo con datos simulados');
    expect(useDemo.getState().tenantId).toBe('bouzalonga');
    // Nobody is signed in until they go through the simulated Cl@ve or Chave365 gateway.
    expect(sessionUserId()).toBeNull();
    expect(within(screen.getByRole('banner')).getByRole('link', { name: 'Acceder' })).toBeVisible();
    await expectNoAxeViolations();
  });

  it('switches council from the profile dialog, moving focus to the new heading', async () => {
    renderApp('/bouzalonga');
    await screen.findByRole('heading', { level: 1 });
    await openSwitcher();
    await expectNoAxeViolations();
    await choose(/Concello/, 'Concello de Ribasmeiras');

    await waitFor(() => {
      expect(document.title).toBe('Reserva de instalacións deportivas · Concello de Ribasmeiras');
    });
    expect(screen.getByRole('heading', { level: 1 })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Reserva de instalacións deportivas');
    expect(document.documentElement.style.getPropertyValue('--tenant-primary')).toBe('#0b5cad');
  });

  it('switches role to council staff and to the deputación', async () => {
    renderApp('/ribasmeiras');
    await screen.findByRole('heading', { level: 1 });

    await userEvent.click(
      (await openSwitcher()).getByRole('link', { name: 'Persoal do concello' }),
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Panel de xestión' }),
    ).toHaveFocus();
    expect(sessionUserId()).toBe('ribasmeiras-carme');

    await userEvent.click((await openSwitcher()).getByRole('link', { name: 'Deputación' }));
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Concellos adheridos' }),
    ).toBeInTheDocument();
    expect(document.title).toBe('Concellos adheridos · Deputación de Exemplo');
    const dialog = await openSwitcher();
    expect(dialog.getByRole('link', { name: 'Deputación' })).toHaveAttribute(
      'aria-current',
      'true',
    );
    expect(dialog.queryByRole('button', { name: /Concello/ })).not.toBeInTheDocument();
  });

  it('gives Manuel large text when he becomes the demo persona', async () => {
    useDemo.setState({ signedIn: true });
    renderApp('/bouzalonga');
    await screen.findByRole('heading', { level: 1 });
    await openSwitcher();
    await choose(/Persoa/, 'Manuel, 72 anos, empadroado, usa lector de pantalla');
    await waitFor(() => {
      expect(document.documentElement.dataset.textSize).toBe('large');
    });
    expect(sessionUserId()).toBe('bouzalonga-manuel');
  });

  it('translates everything, including html lang, when the language changes', async () => {
    renderApp('/bouzalonga');
    await screen.findByRole('heading', { level: 1 });
    await choose(/Idioma/, 'Castellano');

    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: 'Reserva de instalaciones deportivas',
      }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument();
    await openSwitcher();
    expect(screen.getByText('Prototipo con datos simulados')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Personal del ayuntamiento' })).toBeInTheDocument();
  });

  it('applies display preferences to the whole document', async () => {
    renderApp('/bouzalonga');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(screen.getByRole('button', { name: 'Accesibilidade' }));
    const dialog = await screen.findByRole('dialog', { name: 'Preferencias de visualización' });
    await expectNoAxeViolations();

    await userEvent.click(within(dialog).getByRole('radio', { name: 'Moi grande' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Alto contraste' }));
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Reducir o movemento' }));

    const root = document.documentElement.dataset;
    expect([root.textSize, root.contrast, root.motion]).toEqual(['xlarge', 'high', 'reduced']);
  });

  it('asks before resetting the demo and confirms it afterwards', async () => {
    renderApp('/bouzalonga');
    await screen.findByRole('heading', { level: 1 });
    await userEvent.click(
      (await openSwitcher()).getByRole('button', { name: 'Reiniciar a demostración' }),
    );
    await screen.findByRole('alertdialog', { name: 'Reiniciar a demostración?' });
    await userEvent.click(screen.getByRole('button', { name: 'Reiniciar' }));
    expect(
      await screen.findByText('Demostración reiniciada cos datos iniciais.', { selector: 'p' }),
    ).toBeInTheDocument();
  });

  it.each(['/non-existe', '/bouzalonga/non/existe'])(
    'shows a not-found page for %s',
    async (path) => {
      renderApp(path);
      expect(
        await screen.findByRole('heading', { level: 1, name: 'Non atopamos esta páxina' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Ir ao inicio' })).toBeInTheDocument();
    },
  );
});
