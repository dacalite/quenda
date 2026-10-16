// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { User } from '../../domain/types';
import { Button } from '../../ui/Button';
import { Checkbox } from '../../ui/Checkbox';
import layout from '../../ui/layout.module.css';
import { RadioGroup } from '../../ui/RadioGroup';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import { useStaffMutation, useStaffQuery } from './queries';

export const PERSON_FIELD_ID = 'booking-person';

const fullName = (user: Pick<User, 'firstName' | 'lastName'>) =>
  `${user.firstName} ${user.lastName}`;

/** Find a resident by name or phone, or register them on the spot. */
export function PersonPicker({
  value,
  onChange,
  errorMessage,
}: {
  value: User | null;
  onChange: (user: User | null) => void;
  errorMessage?: string | undefined;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const term = search.trim();
  const results = useStaffQuery(
    ['users', 'search', term],
    term.length >= 2 ? (r, id) => r.users.list(id, { search: term, roles: ['citizen'] }) : null,
  );
  const people = results.data ?? [];

  const describe = (user: User) =>
    [fullName(user), user.phone, t(user.resident ? 'person.resident' : 'person.nonResident')].join(
      ' · ',
    );

  if (value) {
    return (
      <div className={layout.row}>
        <p>{t('person.selected', { person: describe(value) })}</p>
        <Button
          variant="quiet"
          onPress={() => {
            onChange(null);
          }}
        >
          {t('person.change')}
        </Button>
      </div>
    );
  }

  return (
    <>
      <TextField
        id={PERSON_FIELD_ID}
        type="search"
        label={t('person.search')}
        description={t('person.searchHelp')}
        value={search}
        onChange={setSearch}
        errorMessage={errorMessage}
      />
      {term.length >= 2 && !results.isPending && (
        <div aria-live="polite">
          {people.length === 0 ? (
            <p>{t('person.noResults')}</p>
          ) : (
            <RadioGroup
              label={t('person.results', { count: people.length })}
              value={null}
              onChange={(id) => {
                onChange(people.find((p) => p.id === id) ?? null);
              }}
              options={people.map((p) => ({ id: p.id, label: describe(p) }))}
            />
          )}
        </div>
      )}
      {adding ? (
        <NewPerson
          initial={term}
          onCreated={(user) => {
            setAdding(false);
            onChange(user);
          }}
          onCancel={() => {
            setAdding(false);
          }}
        />
      ) : (
        <p>
          <Button
            onPress={() => {
              setAdding(true);
            }}
          >
            {t('person.add')}
          </Button>
        </p>
      )}
    </>
  );
}

type NewPersonFields = Pick<User, 'firstName' | 'lastName' | 'phone' | 'email'>;

function NewPerson({
  initial,
  onCreated,
  onCancel,
}: {
  initial: string;
  onCreated: (user: User) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(['admin', 'common']);
  const toast = useToast();
  const digits = initial.replace(/\D/g, '');
  const [values, setValues] = useState<NewPersonFields>({
    firstName: digits ? '' : initial,
    lastName: '',
    phone: digits,
    email: '',
  });
  const [resident, setResident] = useState(true);
  const [invalid, setInvalid] = useState<Partial<Record<keyof NewPersonFields, true>>>({});
  const create = useStaffMutation((r, id, user: Omit<User, 'id' | 'tenantId'>) =>
    r.users.create(id, user),
  );

  const save = () => {
    const errors = {
      ...(values.firstName.trim() ? {} : { firstName: true as const }),
      ...(values.lastName.trim() ? {} : { lastName: true as const }),
      ...(/^\d{9}$/.test(values.phone.replace(/\D/g, '')) ? {} : { phone: true as const }),
      ...(!values.email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())
        ? {}
        : { email: true as const }),
    };
    setInvalid(errors);
    if (Object.keys(errors).length > 0) return;
    create.mutate(
      {
        ...values,
        maskedDni: '',
        resident,
        concessions: [],
        role: 'citizen',
        preferences: {
          language: 'gl',
          channels: ['sms'],
          accessibility: { textSize: 'normal', highContrast: false, reducedMotion: false },
        },
      },
      {
        onSuccess: (user) => {
          toast(t('person.created', { person: fullName(user) }));
          onCreated(user);
        },
      },
    );
  };

  return (
    <fieldset className={layout.panel}>
      <legend>{t('person.newTitle')}</legend>
      {(['firstName', 'lastName', 'phone', 'email'] as const).map((field) => (
        <TextField
          key={field}
          label={t(`person.${field}`)}
          value={values[field]}
          onChange={(value) => {
            setValues({ ...values, [field]: value });
          }}
          type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
          // Staff type someone else's details: the browser must not offer their own.
          autoComplete="off"
          isRequired={field !== 'email'}
          errorMessage={invalid[field] ? t(`person.errors.${field}`) : undefined}
        />
      ))}
      <Checkbox isSelected={resident} onChange={setResident}>
        {t('person.isResident')}
      </Checkbox>
      <div className={layout.row}>
        <Button variant="primary" onPress={save}>
          {t('person.save')}
        </Button>
        <Button variant="quiet" onPress={onCancel}>
          {t('person.cancel')}
        </Button>
      </div>
    </fieldset>
  );
}
