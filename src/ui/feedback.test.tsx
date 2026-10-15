// SPDX-License-Identifier: EUPL-1.2
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { renderUi } from '../test/render';
import { useAnnounce } from './announcer';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';
import { useToast } from './toasts';

describe('StatusBadge', () => {
  it('says its status in words, with a decorative icon', async () => {
    renderUi(<StatusBadge tone="success">Libre</StatusBadge>);
    const badge = screen.getByText('Libre');
    expect(badge).toHaveAttribute('data-tone', 'success');
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expectNoAxeViolations();
  });
});

describe('announcer', () => {
  function Announce({ message, politeness }: { message: string; politeness?: 'assertive' }) {
    const announce = useAnnounce();
    return (
      <Button
        onPress={() => {
          announce(message, politeness);
        }}
      >
        Anunciar
      </Button>
    );
  }

  it('reads messages through always-present live regions, even when repeated', async () => {
    renderUi(<Announce message="Reserva confirmada" />);
    const status = screen.getByRole('status');
    expect(status).toHaveAttribute('aria-live', 'polite');
    expect(status).toBeEmptyDOMElement();

    await userEvent.click(screen.getByRole('button', { name: 'Anunciar' }));
    expect(status).toHaveTextContent('Reserva confirmada');
    const first = status.textContent;
    await userEvent.click(screen.getByRole('button', { name: 'Anunciar' }));
    expect(status.textContent).not.toBe(first);
  });

  it('uses the assertive region for urgent messages', async () => {
    renderUi(<Announce message="Non se puido gardar" politeness="assertive" />);
    await userEvent.click(screen.getByRole('button', { name: 'Anunciar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Non se puido gardar');
  });
});

describe('toasts', () => {
  function Show() {
    const toast = useToast();
    return (
      <>
        <Button
          onPress={() => {
            toast('Gardado');
          }}
        >
          Gardar
        </Button>
        <Button
          onPress={() => {
            toast('Erro ao gardar', 'danger');
          }}
        >
          Fallar
        </Button>
      </>
    );
  }

  it('shows a dismissable notice and announces it once, without time limits', async () => {
    renderUi(<Show />);
    expect(screen.queryByRole('region', { name: 'Avisos' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Gardar' }));
    const region = screen.getByRole('region', { name: 'Avisos' });
    expect(region).toHaveTextContent('Gardado');
    expect(screen.getByRole('status')).toHaveTextContent('Gardado');
    await expectNoAxeViolations();

    await userEvent.click(screen.getByRole('button', { name: 'Fallar' }));
    expect(screen.getByRole('alert')).toHaveTextContent('Erro ao gardar');

    for (const close of screen.getAllByRole('button', { name: 'Pechar o aviso' })) {
      await userEvent.click(close);
    }
    expect(screen.queryByRole('region', { name: 'Avisos' })).not.toBeInTheDocument();
  });
});
