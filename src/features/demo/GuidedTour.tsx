// SPDX-License-Identifier: EUPL-1.2
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useEffectEvent, useId, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { useTenants } from '../../app/queries';
import { useRepositories } from '../../app/repositories';
import { sessionUserId, useDemo, useTour } from '../../app/state';
import { Button } from '../../ui/Button';
import layout from '../../ui/layout.module.css';
import styles from './GuidedTour.module.css';
import { TOURS, useStartTour } from './tours';

const HIGHLIGHT = 'data-tour-highlight';

function clearHighlight() {
  for (const element of document.querySelectorAll(`[${HIGHLIGHT}]`)) {
    element.removeAttribute(HIGHLIGHT);
  }
}

const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === 'reduced' ||
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Outlines the part of the page a step is about, once the page has rendered it. */
function highlight(selector: string | undefined, attempt = 0) {
  clearHighlight();
  if (!selector) return;
  const target = document.querySelector(selector);
  if (!target) {
    if (attempt < 30)
      setTimeout(() => {
        highlight(selector, attempt + 1);
      }, 100);
    return;
  }
  const area = target.closest('section') ?? target;
  area.setAttribute(HIGHLIGHT, '');
  area.scrollIntoView({ block: 'start', behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
}

/**
 * A non-modal dialog per step: the page stays usable, focus moves to the step and returns
 * where it was when the tour ends.
 */
export function GuidedTour() {
  const { t } = useTranslation('demo');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const repositories = useRepositories();
  const tenants = useTenants();
  const role = useDemo((state) => state.role);
  const tenantId = useDemo((state) => state.tenantId);
  const { active, seen, go, stop } = useTour();
  const startTour = useStartTour();
  const dialog = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const request = useRef(0);
  // The step whose page is on screen; until then the dialog says it is loading.
  const [shown, setShown] = useState<string | null>(null);
  const titleId = useId();
  const progressId = useId();
  const bodyId = useId();

  const tenant = tenants.data?.find((item) => item.id === tenantId) ?? tenants.data?.[0];
  const steps = active ? TOURS[active.role] : [];
  const step = active ? steps[active.step] : undefined;
  const stepKey = active ? `${active.role}:${String(active.step)}` : null;

  // The first time a role is shown, its tour opens by itself.
  const offer = useEffectEvent(() => {
    if (active || seen.includes(role) || !tenant) return;
    startTour(role);
  });
  useEffect(() => {
    offer();
  }, [role, tenant?.id]);

  // Switching role from the demo bar leaves the tour of the previous one.
  const leaveOtherRole = useEffectEvent(() => {
    if (active && active.role !== role) {
      clearHighlight();
      stop();
    }
  });
  useEffect(() => {
    leaveOtherRole();
  }, [role]);

  const show = useEffectEvent(async () => {
    const current = step;
    if (!current || !tenant || !active) return;
    if (active.step === 0) {
      opener.current = document.activeElement === document.body ? null : document.activeElement;
    }
    const id = ++request.current;
    const key = stepKey;
    const path = await current.locate({
      repositories,
      tenant,
      signIn: () => {
        useDemo.getState().setSignedIn(true);
        void queryClient.invalidateQueries();
        return sessionUserId();
      },
    });
    if (id !== request.current) return;
    if (path) await navigate(path);
    setShown(key);
    dialog.current?.focus();
    highlight(current.target);
  });
  useEffect(() => {
    if (stepKey) void show();
  }, [stepKey]);

  useEffect(() => {
    document.documentElement.toggleAttribute('data-tour', Boolean(active));
  }, [active]);

  if (!active || !step) return null;

  const isFirst = active.step === 0;
  const isLast = active.step === steps.length - 1;
  const finish = () => {
    request.current++;
    clearHighlight();
    stop();
    const back =
      opener.current instanceof HTMLElement && opener.current.isConnected
        ? opener.current
        : document.querySelector<HTMLElement>('main h1');
    back?.focus();
  };
  const move = (delta: number) => {
    const next = active.step + delta;
    if (next >= 0 && next < steps.length) go(next);
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      finish();
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      move(event.key === 'ArrowRight' ? 1 : -1);
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- keys move between steps
    <div
      ref={dialog}
      role="dialog"
      aria-labelledby={titleId}
      aria-describedby={`${progressId} ${bodyId}`}
      tabIndex={-1}
      className={styles.tour}
      onKeyDown={onKeyDown}
    >
      <p id={progressId} className={styles.progress}>
        {t('tour.progress', { current: active.step + 1, total: steps.length })}
      </p>
      <h2 id={titleId} className={styles.title}>
        {t(`tour.steps.${step.key}.title`)}
      </h2>
      <p id={bodyId}>{t(`tour.steps.${step.key}.body`)}</p>
      <p className={layout.meta}>{shown === stepKey ? t('tour.keys') : t('tour.loading')}</p>
      <div className={layout.row}>
        {!isFirst && (
          <Button
            onPress={() => {
              move(-1);
            }}
          >
            {t('tour.previous')}
          </Button>
        )}
        <Button
          variant="primary"
          onPress={() => {
            if (isLast) finish();
            else move(1);
          }}
        >
          {isLast ? t('tour.finish') : t('tour.next')}
        </Button>
        <Button variant="quiet" onPress={finish}>
          {t('tour.skip')}
        </Button>
      </div>
    </div>
  );
}
