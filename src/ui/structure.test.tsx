// SPDX-License-Identifier: EUPL-1.2
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoAxeViolations } from '../test/axe';
import { renderUi } from '../test/render';
import { Button } from './Button';
import { Card } from './Card';
import { DataTable } from './DataTable';
import { Link } from './Link';
import { StatList } from './StatList';
import { SkipLink } from './SkipLink';
import { Tab, TabList, TabPanel, Tabs } from './Tabs';

describe('Button', () => {
  it('works with pointer and keyboard', async () => {
    const onPress = vi.fn();
    renderUi(
      <Button variant="primary" onPress={onPress}>
        Reservar
      </Button>,
    );
    const button = screen.getByRole('button', { name: 'Reservar' });
    await userEvent.click(button);
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onPress).toHaveBeenCalledTimes(3);
    await expectNoAxeViolations();
  });

  it('cannot be pressed when disabled', async () => {
    const onPress = vi.fn();
    renderUi(
      <Button isDisabled onPress={onPress}>
        Reservar
      </Button>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Reservar' }));
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Link', () => {
  it('renders a real link, optionally styled as a button', async () => {
    renderUi(
      <>
        <Link href="/instalacions">Instalacións</Link>
        <Link href="/reservar" variant="primary">
          Reservar agora
        </Link>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Instalacións' })).toHaveAttribute(
      'href',
      '/instalacions',
    );
    expect(screen.getByRole('link', { name: 'Reservar agora' }).className).not.toBe('');
    await expectNoAxeViolations();
  });
});

describe('Card', () => {
  it('titles its content with a heading of the chosen level', async () => {
    renderUi(
      <Card title="Pista de pádel" headingLevel={3} footer={<Button>Ver</Button>}>
        <p>Cuberta</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { level: 3, name: 'Pista de pádel' })).toBeInTheDocument();
    await expectNoAxeViolations();
  });
});

describe('StatList', () => {
  it('reads each figure together with its label', async () => {
    renderUi(
      <StatList
        stats={[
          { label: 'Reservas hoxe', value: '18' },
          { label: 'Ocupación', value: '64 %', detail: 'esta semana' },
        ]}
      />,
    );
    const terms = screen.getAllByRole('term');
    expect(terms.map((term) => term.textContent)).toEqual(['Reservas hoxe', 'Ocupación']);
    expect(screen.getByText('64 %')).toHaveRole('definition');
    await expectNoAxeViolations();
  });
});

describe('DataTable', () => {
  const rows = [
    { day: 'Luns', occupancy: '45 %' },
    { day: 'Martes', occupancy: '92 %' },
  ];

  it('is a captioned table with column and row headers in a scrollable region', async () => {
    renderUi(
      <DataTable
        caption="Ocupación por día"
        rows={rows}
        rowKey={(row) => row.day}
        columns={[
          { key: 'day', header: 'Día', render: (row) => row.day, isRowHeader: true },
          { key: 'occ', header: 'Ocupación', render: (row) => row.occupancy, align: 'end' },
        ]}
      />,
    );
    const table = screen.getByRole('table', { name: 'Ocupación por día' });
    expect(within(table).getAllByRole('columnheader')).toHaveLength(2);
    expect(within(table).getByRole('rowheader', { name: 'Martes' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Ocupación por día' })).toHaveAttribute(
      'tabindex',
      '0',
    );
    await expectNoAxeViolations();
  });
});

describe('Tabs', () => {
  it('moves between tabs with the arrow keys', async () => {
    renderUi(
      <Tabs>
        <TabList aria-label="As miñas reservas">
          <Tab id="next">Próximas</Tab>
          <Tab id="history">Historial</Tab>
        </TabList>
        <TabPanel id="next">Dúas reservas</TabPanel>
        <TabPanel id="history">Oito reservas</TabPanel>
      </Tabs>,
    );
    await userEvent.tab();
    expect(screen.getByRole('tab', { name: 'Próximas' })).toHaveFocus();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Historial' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Oito reservas');
    await expectNoAxeViolations();
  });
});

describe('SkipLink', () => {
  it('points at the main content', async () => {
    renderUi(
      <>
        <SkipLink targetId="main">Saltar ao contido</SkipLink>
        <main id="main">Contido</main>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Saltar ao contido' })).toHaveAttribute(
      'href',
      '#main',
    );
    await expectNoAxeViolations();
  });
});
