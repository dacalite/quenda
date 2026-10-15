// SPDX-License-Identifier: EUPL-1.2
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '../i18n';
import { expectNoAxeViolations } from '../test/axe';
import { renderUi } from '../test/render';
import { Checkbox } from './Checkbox';
import { DatePicker } from './DatePicker';
import { ErrorSummary } from './ErrorSummary';
import { RadioGroup } from './RadioGroup';
import { Select } from './Select';
import { TextField } from './TextField';

afterEach(async () => {
  await i18n.changeLanguage('gl');
});

describe('TextField', () => {
  it('labels the input and links its help text', async () => {
    renderUi(
      <TextField
        label="Nome"
        description="Como aparece no DNI"
        isRequired
        autoComplete="given-name"
      />,
    );
    const input = screen.getByRole('textbox', { name: 'Nome' });
    expect(input).toBeRequired();
    expect(input).toHaveAccessibleDescription('Como aparece no DNI');
    expect(input).toHaveAttribute('autocomplete', 'given-name');
    expect(screen.getByText('(obrigatorio)', { exact: false })).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await expectNoAxeViolations();
  });

  it('marks the field invalid and reads the error with it', async () => {
    renderUi(
      <TextField label="Teléfono" id="phone" errorMessage="Escribe un teléfono de 9 cifras" />,
    );
    const input = screen.getByRole('textbox', { name: 'Teléfono' });
    expect(input).toBeInvalid();
    expect(input).toHaveAccessibleDescription('Escribe un teléfono de 9 cifras');
    expect(input).toHaveAttribute('id', 'phone');
    await expectNoAxeViolations();
  });
});

describe('Select', () => {
  function Controlled({ onChange }: { onChange: (value: string) => void }) {
    const [value, setValue] = useState<string | null>(null);
    return (
      <Select
        label="Instalación"
        value={value}
        onChange={(next) => {
          setValue(next);
          onChange(next);
        }}
        options={[
          { id: 'padel', label: 'Pista de pádel' },
          { id: 'tenis', label: 'Pista de tenis' },
        ]}
      />
    );
  }

  it('opens with the keyboard and selects an option', async () => {
    const onChange = vi.fn();
    renderUi(<Controlled onChange={onChange} />);
    const trigger = screen.getByRole('button', { name: /Instalación/ });
    expect(trigger).toHaveTextContent('Escolle unha opción');
    await expectNoAxeViolations();

    trigger.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(await screen.findByRole('listbox')).toBeInTheDocument();
    await expectNoAxeViolations();

    await userEvent.click(screen.getByRole('option', { name: 'Pista de tenis' }));
    expect(onChange).toHaveBeenCalledWith('tenis');
    expect(trigger).toHaveTextContent('Pista de tenis');
  });
});

describe('Checkbox', () => {
  it('toggles with the keyboard and describes itself', async () => {
    const onChange = vi.fn();
    renderUi(
      <Checkbox onChange={onChange} description="Lin e acepto as normas de uso">
        Acepto as normas
      </Checkbox>,
    );
    const checkbox = screen.getByRole('checkbox', { name: 'Acepto as normas' });
    expect(checkbox).toHaveAccessibleDescription('Lin e acepto as normas de uso');
    await userEvent.tab();
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(true);
    expect(checkbox).toBeChecked();
    await expectNoAxeViolations();
  });
});

describe('RadioGroup', () => {
  it('is a named group navigable with arrow keys', async () => {
    function Sizes() {
      const [value, setValue] = useState<string | null>('normal');
      return (
        <RadioGroup
          label="Tamaño do texto"
          value={value}
          onChange={setValue}
          options={[
            { id: 'normal', label: 'Normal' },
            { id: 'large', label: 'Grande', description: '125 %' },
          ]}
        />
      );
    }
    renderUi(<Sizes />);
    expect(screen.getByRole('radiogroup', { name: 'Tamaño do texto' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Grande' })).toHaveAccessibleDescription('125 %');
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('radio', { name: 'Grande' })).toBeChecked();
    await expectNoAxeViolations();
  });
});

describe('DatePicker', () => {
  function Picker() {
    const [value, setValue] = useState<string | null>('2026-10-20');
    return (
      <>
        <DatePicker label="Data" value={value} onChange={setValue} minValue="2026-10-15" />
        <output>{value}</output>
      </>
    );
  }

  it('speaks Galician, including React Aria’s own labels', async () => {
    renderUi(<Picker />);
    expect(screen.getByRole('spinbutton', { name: /día/ })).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: /ano/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Calendario/ }));
    expect(await screen.findAllByRole('button', { name: 'Seguinte' })).not.toHaveLength(0);
    expect(screen.getByRole('grid')).toBeInTheDocument();
    await expectNoAxeViolations();

    await userEvent.click(screen.getByRole('button', { name: /22/ }));
    expect(screen.getByText('2026-10-22')).toBeInTheDocument();
  });

  it('switches React Aria’s labels to Spanish with the rest of the interface', async () => {
    await i18n.changeLanguage('es');
    renderUi(<Picker />);
    expect(screen.getByRole('spinbutton', { name: /año/ })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /Calendario/ }));
    expect(await screen.findAllByRole('button', { name: 'Siguiente' })).not.toHaveLength(0);
  });
});

describe('ErrorSummary', () => {
  it('takes focus, counts the errors and links each one to its field', async () => {
    renderUi(
      <>
        <ErrorSummary
          errors={[
            { fieldId: 'name', message: 'Escribe o teu nome' },
            { fieldId: 'phone', message: 'Escribe un teléfono' },
          ]}
        />
        <TextField label="Nome" id="name" errorMessage="Escribe o teu nome" />
        <TextField label="Teléfono" id="phone" errorMessage="Escribe un teléfono" />
      </>,
    );
    const heading = screen.getByRole('heading', { name: 'Hai 2 erros no formulario' });
    expect(heading.parentElement).toHaveFocus();
    await userEvent.click(screen.getByRole('link', { name: 'Escribe un teléfono' }));
    expect(screen.getByRole('textbox', { name: 'Teléfono' })).toHaveFocus();
    await expectNoAxeViolations();
  });

  it('renders nothing without errors', () => {
    renderUi(<ErrorSummary errors={[]} />);
    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
  });
});
