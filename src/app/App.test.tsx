// SPDX-License-Identifier: EUPL-1.2
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import i18n from '../i18n';
import { App } from './App';

afterEach(async () => {
  await i18n.changeLanguage('gl');
});

describe('App', () => {
  it('renders in Galician by default with a single h1', () => {
    render(<App />);

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(screen.getByRole('link', { name: 'Saltar ao contido' })).toHaveAttribute(
      'href',
      '#main',
    );
    expect(document.documentElement.lang).toBe('gl');
    expect(document.title).toBe('Inicio · Quenda');
  });

  it('switches texts, html lang and title to Spanish', async () => {
    render(<App />);

    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'es');

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Reserva de instalaciones deportivas municipales',
      }),
    ).toBeInTheDocument();
    expect(document.documentElement.lang).toBe('es');
    expect(screen.getByRole('link', { name: 'Saltar al contenido' })).toBeInTheDocument();
  });
});
