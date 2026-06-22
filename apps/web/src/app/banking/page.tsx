'use client';

import { useEffect, useState } from 'react';
import {
  PageHeader, DataTable, StatusBadge, formatZAR, formatDate, EmptyState, Card, Button,
} from '@accounting/ui';
import { api } from '@/lib/api';
import { Upload, CheckCircle, Landmark, TrendingUp } from 'lucide-react';

export default function BankingPage() {
  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);
  const [tab, setTab] = useState<'NEW' | 'REVIEWED'>('NEW');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [storageEnabled, setStorageEnabled] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');

  const loadAccounts = async () => {
    const accs = await api.listBankAccounts();
    setAccounts(accs);
    if (!selectedAccount && accs.length > 0) setSelectedAccount(accs[0].id as string);
  };

  const loadTransactions = async () => {
    if (!selectedAccount) return;
    const txns = await api.listBankTransactions(selectedAccount, tab);
    setTransactions(txns);
  };

  useEffect(() => { loadAccounts().catch(console.error); }, []);
  useEffect(() => { loadTransactions().catch(console.error); }, [selectedAccount, tab]);
  useEffect(() => {
    api.storageStatus().then((s) => setStorageEnabled(s.enabled)).catch(() => setStorageEnabled(false));
  }, []);

  const currentAccount = accounts.find((a) => a.id === selectedAccount);
  const pending = (currentAccount?.pendingReview as number) ?? 0;
  const total = transactions.length;
  const reviewedPct = total > 0 ? Math.round(((total - pending) / total) * 100) : 100;

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const handleMarkReviewed = async () => {
    await api.markReviewed(Array.from(selected));
    setSelected(new Set());
    loadTransactions();
    loadAccounts();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedAccount) return;
    setUploading(true);
    setUploadMsg('');
    try {
      const result = await api.uploadBankStatement(selectedAccount, file);
      setUploadMsg(`Uploaded to Supabase Storage: ${result.path}`);
    } catch (err) {
      setUploadMsg(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div>
      <PageHeader
        title="Banking"
        description="Reconcile transactions with smart rules"
        breadcrumbs={[{ label: 'Money' }, { label: 'Banking' }]}
        actions={
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">
            <Upload className="h-4 w-4" />
            {uploading ? 'Uploading...' : storageEnabled ? 'Upload to Supabase' : 'Import statement'}
            <input
              type="file"
              accept=".csv,.ofx,.txt"
              className="hidden"
              onChange={handleFileUpload}
              disabled={!selectedAccount || uploading}
            />
          </label>
        }
      />

      {uploadMsg && (
        <div className={`mb-4 rounded-xl px-4 py-3 text-sm ${uploadMsg.startsWith('Uploaded') ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>
          {uploadMsg}
        </div>
      )}

      {/* Account hero — Xero-style balance card */}
      <div className="mb-8 grid gap-4 lg:grid-cols-3">
        <Card className="gradient-brand relative overflow-hidden text-white lg:col-span-2">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/10" />
          <div className="relative">
            <div className="flex items-center gap-2 text-teal-100">
              <Landmark className="h-4 w-4" />
              <select
                className="bg-transparent text-sm font-medium outline-none"
                value={selectedAccount ?? ''}
                onChange={(e) => setSelectedAccount(e.target.value)}
              >
                {accounts.map((a) => (
                  <option key={a.id as string} value={a.id as string} className="text-slate-900">
                    {a.name as string}
                  </option>
                ))}
              </select>
            </div>
            <p className="mt-4 text-sm text-teal-100">Available balance</p>
            <p className="mt-1 text-4xl font-bold tracking-tight">
              {formatZAR((currentAccount?.balance as number) ?? 0)}
            </p>
            <div className="mt-4 flex items-center gap-2 text-sm text-teal-100">
              <TrendingUp className="h-4 w-4" />
              <span>Updated today</span>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-sm font-medium text-slate-500">Reconciliation progress</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{reviewedPct}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-teal-500 transition-all duration-500"
              style={{ width: `${reviewedPct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {pending > 0 ? `${pending} transactions awaiting review` : 'All transactions reviewed'}
          </p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {(['NEW', 'REVIEWED'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === t ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t === 'NEW' ? 'To review' : 'Reviewed'}
            </button>
          ))}
        </div>
        {selected.size > 0 && (
          <Button size="sm" onClick={handleMarkReviewed}>
            <CheckCircle className="h-4 w-4" /> Review {selected.size} selected
          </Button>
        )}
      </div>

      {transactions.length === 0 ? (
        <EmptyState
          title="No transactions"
          description="Import a bank statement or connect a bank feed to get started."
          action={<Button variant="secondary" size="sm"><Upload className="h-4 w-4" /> Import CSV</Button>}
        />
      ) : (
        <DataTable
          data={transactions.map((t) => ({ ...t, id: t.id as string }))}
          columns={[
            {
              key: 'select',
              header: '',
              render: (r) => (
                <input
                  type="checkbox"
                  checked={selected.has(r.id as string)}
                  onChange={() => toggleSelect(r.id as string)}
                  onClick={(e) => e.stopPropagation()}
                  className="rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
              ),
            },
            { key: 'date', header: 'Date', render: (r) => <span className="font-medium">{formatDate((r as Record<string, unknown>).date as string)}</span> },
            { key: 'payee', header: 'Payee' },
            { key: 'description', header: 'Description', className: 'max-w-[200px] truncate' },
            { key: 'reference', header: 'Ref' },
            {
              key: 'spent',
              header: 'Spent',
              render: (r) => (r as Record<string, unknown>).spent ? <span className="font-medium text-rose-600">{formatZAR((r as Record<string, unknown>).spent as number)}</span> : '',
            },
            {
              key: 'received',
              header: 'Received',
              render: (r) => (r as Record<string, unknown>).received ? <span className="font-medium text-emerald-600">{formatZAR((r as Record<string, unknown>).received as number)}</span> : '',
            },
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as Record<string, unknown>).status as string} /> },
          ]}
        />
      )}
    </div>
  );
}
