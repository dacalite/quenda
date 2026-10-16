// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { downloadFile } from '../../app/download';
import { LanguageSelect } from '../../app/LanguageSelect';
import { Page } from '../../app/Page';
import { PreferencesDialog } from '../../app/PreferencesDialog';
import type { User } from '../../domain/types';
import { Button } from '../../ui/Button';
import { ConfirmDialog, DialogTrigger } from '../../ui/Dialog';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import { TextField } from '../../ui/TextField';
import { useToast } from '../../ui/toasts';
import styles from './citizen.module.css';
import { useMe, useMyReservations, useNotifications, useUpdateMe } from './queries';

type Fields = Pick<User, 'firstName' | 'lastName' | 'email' | 'phone'>;
const FIELDS = ['firstName', 'lastName', 'email', 'phone'] as const;
const AUTOCOMPLETE = {
  firstName: 'given-name',
  lastName: 'family-name',
  email: 'email',
  phone: 'tel',
} as const;

function validate(values: Fields): Partial<Record<keyof Fields, true>> {
  return {
    ...(values.firstName.trim() ? {} : { firstName: true }),
    ...(values.lastName.trim() ? {} : { lastName: true }),
    ...(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()) ? {} : { email: true }),
    ...(/^\d{9}$/.test(values.phone.replace(/\D/g, '')) ? {} : { phone: true }),
  };
}

export function Profile() {
  const me = useMe();
  return me.data ? <ProfileForm user={me.data} /> : null;
}

function ProfileForm({ user }: { user: User }) {
  const { t } = useTranslation(['citizen', 'domain']);
  const toast = useToast();
  const update = useUpdateMe();
  const reservations = useMyReservations();
  const notifications = useNotifications();
  const [values, setValues] = useState<Fields>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
  });
  const [invalid, setInvalid] = useState<Partial<Record<keyof Fields, true>>>({});
  const [summary, setSummary] = useState<FormError[]>([]);

  const submit = () => {
    const errors = validate(values);
    setInvalid(errors);
    const list = FIELDS.filter((field) => errors[field]).map((field) => ({
      fieldId: `profile-${field}`,
      message: t(`profile.errors.${field}`),
    }));
    setSummary(list);
    if (list.length > 0) return;
    update.mutate(values, {
      onSuccess: () => {
        toast(t('profile.saved'));
      },
    });
  };

  return (
    <Page title={t('profile.title')}>
      <ErrorSummary errors={summary} />
      <form
        className={styles.section}
        aria-labelledby="profile-personal"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <h2 id="profile-personal">{t('profile.personal')}</h2>
        {FIELDS.map((field) => (
          <TextField
            key={field}
            id={`profile-${field}`}
            label={t(`profile.${field}`)}
            value={values[field]}
            onChange={(value) => {
              setValues({ ...values, [field]: value });
            }}
            autoComplete={AUTOCOMPLETE[field]}
            type={field === 'email' ? 'email' : field === 'phone' ? 'tel' : 'text'}
            isRequired
            errorMessage={invalid[field] ? t(`profile.errors.${field}`) : undefined}
          />
        ))}
        <TextField
          label={t('profile.dni')}
          description={t('profile.dniHelp')}
          value={user.maskedDni}
          isReadOnly
        />
        <p>
          <Button type="submit" variant="primary">
            {t('profile.save')}
          </Button>
        </p>
      </form>

      <section className={styles.panel} aria-labelledby="profile-residency">
        <h2 id="profile-residency">{t('profile.residency')}</h2>
        <p>{user.resident ? t('profile.resident') : t('profile.nonResident')}</p>
        <p className={styles.meta}>{t('profile.residencyHelp')}</p>
        <h3>{t('profile.concessions')}</h3>
        {user.concessions.length === 0 ? (
          <p>{t('profile.noConcessions')}</p>
        ) : (
          <ul>
            {user.concessions.map((c) => (
              <li key={c}>{t(`domain:concession.${c}`)}</li>
            ))}
          </ul>
        )}
      </section>

      <section className={styles.section} aria-labelledby="profile-preferences">
        <h2 id="profile-preferences">{t('profile.preferences')}</h2>
        <p>{t('profile.preferencesHelp')}</p>
        <div className={styles.row}>
          <LanguageSelect />
          <PreferencesDialog />
        </div>
      </section>

      <section className={styles.panel} aria-labelledby="profile-data">
        <h2 id="profile-data">{t('profile.data')}</h2>
        <p>{t('profile.dataIntro')}</p>
        <div className={styles.row}>
          <Button
            onPress={() => {
              const data = {
                exportedAt: new Date().toISOString(),
                user,
                reservations: reservations.data ?? [],
                notifications: notifications.data ?? [],
              };
              downloadFile(
                `os-meus-datos-${user.id}.json`,
                JSON.stringify(data, null, 2),
                'application/json',
              );
            }}
          >
            {t('profile.download')}
          </Button>
          <DialogTrigger>
            <Button variant="danger">{t('profile.delete')}</Button>
            <ConfirmDialog
              title={t('profile.deleteTitle')}
              confirmLabel={t('profile.deleteConfirm')}
              tone="danger"
              onConfirm={() => {
                toast(t('profile.deleteDone'));
              }}
            >
              <p>{t('profile.deleteBody')}</p>
            </ConfirmDialog>
          </DialogTrigger>
        </div>
      </section>
    </Page>
  );
}
