// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pending } from '../../app/Pending';
import { Page } from '../../app/Page';
import { useFacilities } from '../../app/queries';
import type { BlockInput } from '../../data/ports/repositories';
import { zonedNow } from '../../domain/time';
import type { BlockReason, Facility, Reservation } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { useLocalized, useSubspaceName } from '../../i18n/labels';
import { Button } from '../../ui/Button';
import { DataTable } from '../../ui/DataTable';
import { DatePicker } from '../../ui/DatePicker';
import { ConfirmDialog, DialogTrigger } from '../../ui/Dialog';
import { ErrorSummary, type FormError } from '../../ui/ErrorSummary';
import layout from '../../ui/layout.module.css';
import { RadioGroup } from '../../ui/RadioGroup';
import { Select } from '../../ui/Select';
import { TextField } from '../../ui/TextField';
import { TimeField } from '../../ui/TimeField';
import { useToast } from '../../ui/toasts';
import { ReservationTable } from './ReservationTable';
import { useStaff, useStaffMutation, useStaffQuery } from './queries';

const REASONS: BlockReason[] = ['maintenance', 'event', 'other'];
const WHOLE = 'whole';

export function Blocks() {
  const { t } = useTranslation(['admin', 'common']);
  const facilities = useFacilities();
  return (
    <Page title={t('blocks.title')}>
      <p>{t('blocks.intro')}</p>
      {facilities.data ? (
        <>
          <BlockList facilities={facilities.data} />
          <NewBlock facilities={facilities.data} />
        </>
      ) : (
        <Pending queries={[facilities]} size="section" />
      )}
    </Page>
  );
}

function BlockList({ facilities }: { facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const format = useFormat();
  const subspaceName = useSubspaceName();
  const toast = useToast();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const blocks = useStaffQuery(['blocks', today], (r, id) =>
    r.schedules.listBlocks(id, { from: today }),
  );
  const remove = useStaffMutation((r, id, blockId: string) => r.schedules.deleteBlock(id, blockId));
  const rows = blocks.data ?? [];
  const facilityOf = (id: string) => facilities.find((f) => f.id === id);

  return (
    <section className={layout.section} aria-labelledby="blocks-current">
      <h2 id="blocks-current">{t('blocks.current')}</h2>
      {rows.length === 0 ? (
        <p>{t('blocks.none')}</p>
      ) : (
        <DataTable
          caption={t('blocks.current')}
          hideCaption
          rows={rows}
          rowKey={(b) => b.id}
          columns={[
            {
              key: 'place',
              header: t('table.place'),
              isRowHeader: true,
              render: (b) => {
                const facility = facilityOf(b.facilityId);
                if (!facility) return '';
                return b.subspaceId
                  ? `${facility.name} · ${subspaceName(facility, b.subspaceId)}`
                  : `${facility.name} · ${t('blocks.wholeFacility')}`;
              },
            },
            {
              key: 'dates',
              header: t('blocks.when'),
              render: (b) =>
                `${
                  b.dates.from === b.dates.to
                    ? format.longDate(b.dates.from)
                    : t('blocks.dateRange', {
                        from: format.longDate(b.dates.from),
                        to: format.longDate(b.dates.to),
                      })
                }, ${format.timeRange(b.times.start, b.times.end)}`,
            },
            {
              key: 'reason',
              header: t('blocks.reason'),
              render: (b) => t(`domain:blockReason.${b.reason}`),
            },
            { key: 'note', header: t('blocks.note'), render: (b) => b.note },
            {
              key: 'remove',
              header: t('table.action'),
              render: (b) => (
                <DialogTrigger>
                  <Button variant="quiet">{t('blocks.remove')}</Button>
                  <ConfirmDialog
                    title={t('blocks.removeTitle')}
                    confirmLabel={t('blocks.removeConfirm')}
                    onConfirm={() => {
                      remove.mutate(b.id, {
                        onSuccess: () => {
                          toast(t('blocks.removed'));
                        },
                      });
                    }}
                  >
                    <p>{t('blocks.removeBody')}</p>
                  </ConfirmDialog>
                </DialogTrigger>
              ),
            },
          ]}
        />
      )}
    </section>
  );
}

function NewBlock({ facilities }: { facilities: Facility[] }) {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const { tenant } = useStaff();
  const toast = useToast();
  const localized = useLocalized();
  const today = zonedNow(new Date(), tenant.timeZone).date;
  const [facilityId, setFacilityId] = useState(facilities[0]?.id ?? '');
  const [space, setSpace] = useState(WHOLE);
  const [from, setFrom] = useState<string | null>(today);
  const [to, setTo] = useState<string | null>(today);
  const [start, setStart] = useState<string | null>('09:00');
  const [end, setEnd] = useState<string | null>('14:00');
  const [reason, setReason] = useState<BlockReason>('maintenance');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState<FormError[]>([]);
  const [affected, setAffected] = useState<Reservation[] | null>(null);
  const facility = facilities.find((f) => f.id === facilityId);

  const preview = useStaffMutation((r, id, input: BlockInput) =>
    r.schedules.previewBlock(id, input),
  );
  const create = useStaffMutation((r, id, input: BlockInput) => r.schedules.createBlock(id, input));

  const changed =
    <T,>(setter: (value: T) => void) =>
    (value: T) => {
      setter(value);
      setAffected(null);
    };

  const input = (): BlockInput | null => {
    const found: FormError[] = [
      ...(from ? [] : [{ fieldId: 'block-from', message: t('blocks.errors.from') }]),
      ...(to && from && to >= from
        ? []
        : [{ fieldId: 'block-to', message: t('blocks.errors.to') }]),
      ...(start && end && start < end
        ? []
        : [{ fieldId: 'block-start', message: t('blocks.errors.times') }]),
      ...(note.trim() ? [] : [{ fieldId: 'block-note', message: t('blocks.errors.note') }]),
    ];
    setErrors(found);
    if (found.length > 0 || !from || !to || !start || !end) return null;
    return {
      facilityId,
      subspaceId: space === WHOLE ? null : space,
      dates: { from, to },
      times: { start, end },
      reason,
      note: note.trim(),
    };
  };

  const check = () => {
    const block = input();
    if (!block) return;
    preview.mutate(block, {
      onSuccess: setAffected,
    });
  };

  const confirm = () => {
    const block = input();
    if (!block) return;
    create.mutate(block, {
      onSuccess: () => {
        toast(t('blocks.created', { count: affected?.length ?? 0 }));
        setAffected(null);
        setNote('');
      },
      onError: () => {
        toast(t('common:error.title'), 'danger');
      },
    });
  };

  return (
    <section className={layout.section} aria-labelledby="blocks-new">
      <h2 id="blocks-new">{t('blocks.new')}</h2>
      <ErrorSummary errors={errors} />
      <form
        className={layout.section}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          check();
        }}
      >
        <div className={layout.filters}>
          <Select
            label={t('blocks.facility')}
            value={facilityId}
            onChange={changed((value: string) => {
              setFacilityId(value);
              setSpace(WHOLE);
            })}
            options={facilities.map((f) => ({ id: f.id, label: f.name }))}
          />
          {facility && facility.subspaces.length > 1 && (
            <Select
              label={t('blocks.space')}
              value={space}
              onChange={changed(setSpace)}
              options={[
                { id: WHOLE, label: t('blocks.wholeFacility') },
                ...facility.subspaces.map((s) => ({ id: s.id, label: localized(s.name) })),
              ]}
            />
          )}
          <div id="block-from">
            <DatePicker
              label={t('blocks.from')}
              value={from}
              minValue={today}
              onChange={changed(setFrom)}
              isRequired
              errorMessage={errors.find((e) => e.fieldId === 'block-from')?.message}
            />
          </div>
          <div id="block-to">
            <DatePicker
              label={t('blocks.to')}
              value={to}
              minValue={from ?? today}
              onChange={changed(setTo)}
              isRequired
              errorMessage={errors.find((e) => e.fieldId === 'block-to')?.message}
            />
          </div>
          <div id="block-start">
            <TimeField
              label={t('blocks.start')}
              value={start}
              onChange={changed(setStart)}
              isRequired
              errorMessage={errors.find((e) => e.fieldId === 'block-start')?.message}
            />
          </div>
          <TimeField label={t('blocks.end')} value={end} onChange={changed(setEnd)} isRequired />
        </div>
        <RadioGroup
          label={t('blocks.reason')}
          value={reason}
          onChange={changed((value: string) => {
            setReason(value as BlockReason);
          })}
          options={REASONS.map((r) => ({ id: r, label: t(`domain:blockReason.${r}`) }))}
        />
        <TextField
          id="block-note"
          label={t('blocks.note')}
          description={t('blocks.noteHelp')}
          value={note}
          onChange={changed(setNote)}
          isRequired
          errorMessage={errors.find((e) => e.fieldId === 'block-note')?.message}
        />
        <p>
          <Button type="submit">{t('blocks.check')}</Button>
        </p>
      </form>

      <div aria-live="polite">
        {affected && (
          <div className={layout.panel}>
            <h3>{t('blocks.affectedTitle', { count: affected.length })}</h3>
            {affected.length === 0 ? (
              <p>{t('blocks.noneAffected')}</p>
            ) : (
              <>
                <p>{t('blocks.affectedIntro')}</p>
                <ReservationTable
                  caption={t('blocks.affectedCaption')}
                  reservations={affected}
                  facilities={facilities}
                  showDate
                />
              </>
            )}
            <p>
              <Button variant={affected.length > 0 ? 'danger' : 'primary'} onPress={confirm}>
                {affected.length > 0
                  ? t('blocks.confirmAndNotify', { count: affected.length })
                  : t('blocks.confirm')}
              </Button>
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
