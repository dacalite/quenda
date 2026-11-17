// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ageOn, zonedNow } from '../../domain/time';
import type { Dependent, IsoDate, User } from '../../domain/types';
import { validateDependent } from '../../domain/validation';
import { Button } from '../../ui/Button';
import { DatePicker } from '../../ui/DatePicker';
import { ConfirmDialog, DialogTrigger } from '../../ui/Dialog';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import layout from '../../ui/layout.module.css';
import { useCitizen, useUpdateMe } from './queries';

const FIELD = (name: string) => `dependent-${name}`;
const blank = { firstName: '', lastName: '', birthDate: null as IsoDate | null };

/** People in the resident's care, such as their children: booked for, without an account of their own. */
export function Dependents({ user }: { user: User }) {
  const { t } = useTranslation('citizen');
  const { tenant } = useCitizen();
  const toast = useToast();
  const update = useUpdateMe();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState(blank);
  const [errors, setErrors] = useState<FormError[]>([]);
  const errorOf = (name: string) => errors.find((e) => e.fieldId === FIELD(name))?.message;
  const name = (d: Pick<Dependent, 'firstName' | 'lastName'>) => `${d.firstName} ${d.lastName}`;

  const save = () => {
    const found = validateDependent({ ...draft, birthDate: draft.birthDate ?? '' }, today).map(
      (p) => {
        const field = p.field.split('.').at(-1) as 'firstName' | 'lastName' | 'birthDate';
        return { fieldId: FIELD(field), message: t(`dependents.errors.${field}`) };
      },
    );
    setErrors(found);
    if (found.length > 0 || !draft.birthDate) return;
    const added = { ...draft, birthDate: draft.birthDate, id: crypto.randomUUID() };
    update.mutate(
      { dependents: [...user.dependents, added] },
      {
        onSuccess: () => {
          toast(t('dependents.added', { name: added.firstName }));
          setDraft(blank);
          setAdding(false);
        },
      },
    );
  };

  return (
    <section className={layout.section} aria-labelledby="profile-dependents">
      <h2 id="profile-dependents">{t('dependents.title')}</h2>
      <p>{t('dependents.intro')}</p>
      {user.dependents.length === 0 ? (
        <p>{t('dependents.none')}</p>
      ) : (
        <ul className={layout.stack}>
          {user.dependents.map((dependent) => (
            <li key={dependent.id} className={layout.row}>
              <span>
                {t('dependents.item', {
                  name: name(dependent),
                  count: ageOn(dependent.birthDate, today),
                })}
              </span>
              <DialogTrigger>
                <Button
                  variant="quiet"
                  aria-label={t('dependents.remove', { name: name(dependent) })}
                >
                  {t('dependents.removeShort')}
                </Button>
                <ConfirmDialog
                  title={t('dependents.removeTitle', { name: dependent.firstName })}
                  confirmLabel={t('dependents.removeConfirm')}
                  tone="danger"
                  onConfirm={() => {
                    update.mutate(
                      { dependents: user.dependents.filter((d) => d.id !== dependent.id) },
                      {
                        onSuccess: () => {
                          toast(t('dependents.removed', { name: dependent.firstName }));
                        },
                      },
                    );
                  }}
                >
                  <p>{t('dependents.removeBody')}</p>
                </ConfirmDialog>
              </DialogTrigger>
            </li>
          ))}
        </ul>
      )}
      {adding ? (
        <form
          className={layout.panel}
          aria-labelledby="dependent-new"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            save();
          }}
        >
          <h3 id="dependent-new">{t('dependents.newTitle')}</h3>
          <ErrorSummary errors={errors} />
          {(['firstName', 'lastName'] as const).map((field) => (
            <TextField
              key={field}
              id={FIELD(field)}
              label={t(`dependents.${field}`)}
              value={draft[field]}
              onChange={(value) => {
                setDraft({ ...draft, [field]: value });
              }}
              // Someone else's details: the browser must not offer the resident's own.
              autoComplete="off"
              isRequired
              errorMessage={errorOf(field)}
            />
          ))}
          <div id={FIELD('birthDate')}>
            <DatePicker
              label={t('dependents.birthDate')}
              value={draft.birthDate}
              maxValue={today}
              onChange={(birthDate) => {
                setDraft({ ...draft, birthDate });
              }}
              isRequired
              errorMessage={errorOf('birthDate')}
            />
          </div>
          <div className={layout.row}>
            <Button type="submit" variant="primary">
              {t('dependents.save')}
            </Button>
            <Button
              variant="quiet"
              onPress={() => {
                setAdding(false);
                setErrors([]);
              }}
            >
              {t('dependents.cancel')}
            </Button>
          </div>
        </form>
      ) : (
        <p>
          <Button
            onPress={() => {
              setAdding(true);
            }}
          >
            {t('dependents.add')}
          </Button>
        </p>
      )}
    </section>
  );
}
