// SPDX-License-Identifier: EUPL-1.2
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { renderUi } from '../test/render';
import { Pending } from './Pending';

describe('Pending', () => {
  it('keeps the space and tells screen readers what is loading', async () => {
    const { container } = renderUi(<Pending label="Calculando os indicadores…" />);
    expect(container.querySelector('[aria-busy="true"]')).toHaveTextContent(
      'Calculando os indicadores…',
    );
    await expectNoAxeViolations();
  });

  it('reports a failed load and retries only what failed', async () => {
    const failed = { isError: true, refetch: vi.fn() };
    const loaded = { isError: false, refetch: vi.fn() };
    renderUi(<Pending queries={[loaded, failed]} />);
    expect(
      screen.getByText('Non se puido cargar esta información.').closest('[role="alert"]'),
    ).not.toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));
    expect(failed.refetch).toHaveBeenCalledOnce();
    expect(loaded.refetch).not.toHaveBeenCalled();
    await expectNoAxeViolations();
  });
});
