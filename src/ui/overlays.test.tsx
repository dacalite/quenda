// SPDX-License-Identifier: EUPL-1.2
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { renderUi } from '../test/render';
import { Button } from './Button';
import { ConfirmDialog, DialogTrigger, Modal } from './Dialog';

describe('Modal', () => {
  it('opens as a named dialog, keeps focus inside and returns it on Esc', async () => {
    renderUi(
      <DialogTrigger>
        <Button>Preferencias</Button>
        <Modal title="Preferencias de visualización">
          <p>Contido</p>
        </Modal>
      </DialogTrigger>,
    );
    const trigger = screen.getByRole('button', { name: 'Preferencias' });
    await userEvent.click(trigger);

    const dialog = await screen.findByRole('dialog', { name: 'Preferencias de visualización' });
    expect(dialog).toContainElement(document.activeElement as HTMLElement);
    // React Aria adds hidden dismiss buttons for touch screen readers, also named «Pechar».
    expect(screen.getAllByRole('button', { name: 'Pechar' })).not.toHaveLength(0);
    await expectNoAxeViolations();

    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });
});

describe('ConfirmDialog', () => {
  function Setup({ onConfirm }: { onConfirm: () => void }) {
    return (
      <DialogTrigger>
        <Button variant="danger">Cancelar reserva</Button>
        <ConfirmDialog
          title="Cancelar a reserva?"
          confirmLabel="Si, cancelar"
          tone="danger"
          onConfirm={onConfirm}
        >
          Non terás que pagar nada.
        </ConfirmDialog>
      </DialogTrigger>
    );
  }

  it('is an alert dialog that only acts when confirmed', async () => {
    const onConfirm = vi.fn();
    renderUi(<Setup onConfirm={onConfirm} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    expect(
      await screen.findByRole('alertdialog', { name: 'Cancelar a reserva?' }),
    ).toBeInTheDocument();
    await expectNoAxeViolations();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Si, cancelar' }));
    expect(onConfirm).toHaveBeenCalledOnce();
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
  });
});
