// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useTenants } from '../../app/queries';
import { resetDemoData } from '../../app/repositories';
import { roleHome } from '../../app/routes/paths';
import {
  useDemo,
  usePreferences,
  type CitizenPersona,
  type DemoRole,
  type StaffPersona,
} from '../../app/state';
import { PERSONAS } from '../../data/seed/catalog';
import { Button } from '../../ui/Button';
import { ConfirmDialog, DialogTrigger, Modal } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';
import { Select } from '../../ui/Select';
import { useToast } from '../../ui/toasts';
import styles from './ProfileSwitcher.module.css';
import { RoleCards } from './RoleCards';
import { useStartTour } from './tours';

const CITIZENS: CitizenPersona[] = ['uxia', 'manuel', 'brais'];
const STAFF: StaffPersona[] = ['carme', 'xose'];

/** Demo controls behind one button: profile, person, council, guided tour and reset. */
export function ProfileSwitcher() {
  const { t } = useTranslation('demo');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const tenants = useTenants();
  const demo = useDemo();
  const updatePreferences = usePreferences((state) => state.update);
  const startTour = useStartTour();
  const triggerId = useId();
  const detailsId = useId();

  const tenant = tenants.data?.find((item) => item.id === demo.tenantId) ?? tenants.data?.[0];
  const hrefOf = (role: DemoRole) => (tenant ? roleHome(role, tenant.slug) : '/');

  const choosePersona = (persona: CitizenPersona | StaffPersona) => {
    if (demo.role === 'citizen') demo.setCitizen(persona as CitizenPersona);
    else demo.setStaff(persona as StaffPersona);
    const textSize = PERSONAS.find((p) => p.key === persona)?.textSize;
    if (textSize) updatePreferences({ textSize });
    // A different person is signed in: their own data must be fetched again.
    void queryClient.invalidateQueries();
  };

  return (
    <DialogTrigger>
      {/* Narrow screens show «Perfil», which the accessible name still contains. */}
      <Button variant="quiet" id={triggerId} aria-label={t('switcher.open')}>
        <Icon name="swap" />
        <span className="hide-narrow" aria-hidden="true">
          {t('switcher.open')}
        </span>
        <span className="show-narrow" aria-hidden="true">
          {t('switcher.short')}
        </span>
      </Button>
      <Modal title={t('switcher.open')}>
        {(close) => (
          <>
            <p className={styles.notice}>
              <Icon name="info" />
              {t('notice')}
            </p>
            <RoleCards
              headingLevel={3}
              compact
              current={demo.role}
              hrefOf={hrefOf}
              onChoose={(role) => {
                demo.setRole(role);
                void queryClient.invalidateQueries();
                close();
              }}
            />
            {demo.role !== 'deputacion' && (
              <section className={styles.details} aria-labelledby={detailsId}>
                <h3 id={detailsId}>{t('switcher.details')}</h3>
                <Select
                  label={t('persona.label')}
                  value={demo.role === 'citizen' ? demo.citizen : demo.staff}
                  options={(demo.role === 'citizen' ? CITIZENS : STAFF).map((persona) => ({
                    id: persona,
                    label: t(`persona.${persona}`),
                  }))}
                  onChange={(value) => {
                    choosePersona(value as CitizenPersona | StaffPersona);
                  }}
                />
                <Select
                  label={t('tenant.label')}
                  value={tenant?.id ?? null}
                  isDisabled={!tenants.data}
                  options={(tenants.data ?? []).map((item) => ({ id: item.id, label: item.name }))}
                  onChange={(value) => {
                    const slug = tenants.data?.find((item) => item.id === value)?.slug;
                    if (slug) void navigate(roleHome(demo.role, slug));
                    close();
                  }}
                />
              </section>
            )}
            <div className={styles.actions}>
              <Button
                onPress={() => {
                  close();
                  startTour(demo.role, triggerId);
                }}
              >
                <Icon name="info" />
                {t('tour.start')}
              </Button>
              <DialogTrigger>
                <Button>
                  <Icon name="refresh" />
                  {t('reset.open')}
                </Button>
                <ConfirmDialog
                  title={t('reset.title')}
                  confirmLabel={t('reset.confirm')}
                  tone="danger"
                  onConfirm={() => {
                    close();
                    void resetDemoData().then(() => {
                      void queryClient.resetQueries();
                      toast(t('reset.done'));
                    });
                  }}
                >
                  {t('reset.body')}
                </ConfirmDialog>
              </DialogTrigger>
            </div>
          </>
        )}
      </Modal>
    </DialogTrigger>
  );
}
