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
import { ConfirmDialog, DialogTrigger } from '../../ui/Dialog';
import { Icon } from '../../ui/Icon';
import { Select } from '../../ui/Select';
import { useToast } from '../../ui/toasts';
import styles from './DemoBar.module.css';
import { useStartTour } from './tours';

const ROLES: DemoRole[] = ['citizen', 'staff', 'deputacion'];
const CITIZENS: CitizenPersona[] = ['uxia', 'manuel', 'brais'];
const STAFF: StaffPersona[] = ['carme', 'xose'];

export function DemoBar() {
  const { t } = useTranslation('demo');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const tenants = useTenants();
  const demo = useDemo();
  const updatePreferences = usePreferences((state) => state.update);
  const controlsId = useId();
  const startTour = useStartTour();

  const tenant = tenants.data?.find((item) => item.id === demo.tenantId) ?? tenants.data?.[0];

  const go = (role: DemoRole, slug = tenant?.slug) => {
    if (slug) void navigate(roleHome(role, slug));
  };

  const choosePersona = (persona: CitizenPersona | StaffPersona) => {
    if (demo.role === 'citizen') demo.setCitizen(persona as CitizenPersona);
    else demo.setStaff(persona as StaffPersona);
    const textSize = PERSONAS.find((p) => p.key === persona)?.textSize;
    if (textSize) updatePreferences({ textSize });
    // A different person is signed in: their own data must be fetched again.
    void queryClient.invalidateQueries();
  };

  const personas = demo.role === 'citizen' ? CITIZENS : STAFF;

  return (
    <section aria-label={t('region')} className={styles.bar}>
      <div className={styles.inner}>
        <div className={styles.summary}>
          <p className={styles.notice}>
            <Icon name="info" />
            {t('notice')}
          </p>
          <Button
            variant="quiet"
            aria-expanded={!demo.collapsed}
            aria-controls={controlsId}
            onPress={() => {
              demo.setCollapsed(!demo.collapsed);
            }}
          >
            <Icon name={demo.collapsed ? 'chevronDown' : 'close'} />
            {demo.collapsed ? t('show') : t('hide')}
          </Button>
        </div>
        <div id={controlsId} hidden={demo.collapsed} className={styles.controls}>
          <Select
            label={t('role.label')}
            value={demo.role}
            options={ROLES.map((role) => ({ id: role, label: t(`role.${role}`) }))}
            onChange={(value) => {
              const role = value as DemoRole;
              demo.setRole(role);
              void queryClient.invalidateQueries();
              go(role);
            }}
          />
          {demo.role !== 'deputacion' && (
            <>
              <Select
                label={t('persona.label')}
                value={demo.role === 'citizen' ? demo.citizen : demo.staff}
                options={personas.map((persona) => ({
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
                  go(demo.role, tenants.data?.find((item) => item.id === value)?.slug);
                }}
              />
            </>
          )}
          <Button
            onPress={() => {
              startTour(demo.role);
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
                resetDemoData();
                void queryClient.resetQueries();
                toast(t('reset.done'));
              }}
            >
              {t('reset.body')}
            </ConfirmDialog>
          </DialogTrigger>
        </div>
      </div>
    </section>
  );
}
