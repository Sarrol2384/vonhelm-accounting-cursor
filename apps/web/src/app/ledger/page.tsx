'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, StatusBadge, formatZAR } from '@accounting/ui';
import { api } from '@/lib/api';

export default function LedgerPage() {
  const [tab, setTab] = useState<'accounts' | 'journals' | 'trial'>('accounts');
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [journals, setJournals] = useState<Array<Record<string, unknown>>>([]);
  const [trialBalance, setTrialBalance] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (tab === 'accounts') api.listLedgerAccounts().then(setAccounts).catch(console.error);
    if (tab === 'journals') api.listJournals().then(setJournals).catch(console.error);
    if (tab === 'trial') api.trialBalance().then(setTrialBalance).catch(console.error);
  }, [tab]);

  const trialRows = (trialBalance?.rows as Array<Record<string, unknown>>) ?? [];

  return (
    <div>
      <PageHeader title="General Ledger" description="Chart of accounts, journals, and trial balance" />

      <div className="mb-4 flex gap-2 border-b border-slate-200">
        {(['accounts', 'journals', 'trial'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize ${
              tab === t ? 'border-brand text-brand' : 'border-transparent text-slate-500'
            }`}
          >
            {t === 'trial' ? 'Trial Balance' : t}
          </button>
        ))}
      </div>

      {tab === 'accounts' && (
        <DataTable
          data={accounts.map((a) => ({ ...a, id: a.id as string }))}
          columns={[
            { key: 'code', header: 'Code' },
            { key: 'name', header: 'Account Name' },
            { key: 'type', header: 'Type', render: (r) => <StatusBadge status={r.type as string} /> },
            { key: 'isActive', header: 'Active', render: (r) => (r.isActive ? 'Yes' : 'No') },
          ]}
        />
      )}

      {tab === 'journals' && (
        <DataTable
          data={journals.map((j) => ({ ...j, id: j.id as string }))}
          columns={[
            { key: 'date', header: 'Date', render: (r) => new Date(r.date as string).toLocaleDateString('en-ZA') },
            { key: 'reference', header: 'Reference' },
            { key: 'description', header: 'Description' },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status as string} /> },
          ]}
        />
      )}

      {tab === 'trial' && trialBalance && (
        <>
          <div className="mb-4 flex gap-6 text-sm">
            <span>Total Debit: <strong>{formatZAR(trialBalance.totalDebit as number)}</strong></span>
            <span>Total Credit: <strong>{formatZAR(trialBalance.totalCredit as number)}</strong></span>
          </div>
          <DataTable
            data={trialRows.map((r, i) => ({ ...r, id: String(i) }))}
            columns={[
              { key: 'code', header: 'Code' },
              { key: 'name', header: 'Account' },
              { key: 'debit', header: 'Debit', render: (r) => formatZAR(r.debit as number) },
              { key: 'credit', header: 'Credit', render: (r) => formatZAR(r.credit as number) },
              { key: 'balance', header: 'Balance', render: (r) => formatZAR(r.balance as number) },
            ]}
          />
        </>
      )}
    </div>
  );
}
