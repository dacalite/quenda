// SPDX-License-Identifier: EUPL-1.2
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Page } from '../../app/Page';
import type { AuditSubject } from '../../domain/types';
import { useFormat } from '../../i18n/format';
import { DataTable } from '../../ui/DataTable';
import { Select } from '../../ui/Select';
import { useStaffQuery } from './queries';

const SUBJECTS: AuditSubject[] = [
  'reservation',
  'recurringBooking',
  'block',
  'facility',
  'schedule',
  'user',
  'tenant',
];
const ALL = 'all';

export function Activity() {
  const { t } = useTranslation(['admin', 'domain', 'common']);
  const format = useFormat();
  const [subject, setSubject] = useState<string>(ALL);
  const entries = useStaffQuery(['audit'], (r, id) => r.audit.list(id));
  const users = useStaffQuery(['users'], (r, id) => r.users.list(id));
  const actor = (id: string) => {
    const user = users.data?.find((u) => u.id === id);
    return user ? `${user.firstName} ${user.lastName}` : t('activity.unknown');
  };
  const rows = (entries.data ?? []).filter((e) => subject === ALL || e.subject === subject);

  return (
    <Page title={t('activity.title')}>
      <p>{t('activity.intro')}</p>
      <Select
        label={t('activity.filter')}
        value={subject}
        onChange={setSubject}
        options={[
          { id: ALL, label: t('activity.all') },
          ...SUBJECTS.map((s) => ({ id: s, label: t(`domain:auditSubject.${s}`) })),
        ]}
      />
      {entries.isPending ? (
        <p aria-busy="true">{t('common:loading')}</p>
      ) : rows.length === 0 ? (
        <p>{t('activity.empty')}</p>
      ) : (
        <DataTable
          caption={t('activity.caption', { count: rows.length })}
          rows={rows}
          rowKey={(e) => e.id}
          columns={[
            {
              key: 'at',
              header: t('activity.when'),
              isRowHeader: true,
              render: (e) => format.dateTime(e.at),
            },
            { key: 'actor', header: t('activity.who'), render: (e) => actor(e.actorId) },
            {
              key: 'action',
              header: t('activity.what'),
              render: (e) => t(`domain:auditAction.${e.action}`),
            },
            {
              key: 'subject',
              header: t('activity.subject'),
              render: (e) => `${t(`domain:auditSubject.${e.subject}`)}: ${e.label}`,
            },
          ]}
        />
      )}
    </Page>
  );
}
