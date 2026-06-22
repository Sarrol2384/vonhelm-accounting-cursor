'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { PageHeader, DataTable, formatDate, Card, Button, type DataRow } from '@accounting/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Plus, Search, Building2, AlertCircle, CheckCircle2, Clock } from 'lucide-react';

interface ConsoleRow {
  id: string;
  name: string;
  contactName: string;
  taskCount: number;
  noteCount: number;
  alertCount: number;
  lastLoginAt: string | null;
  financialYearEnd: string;
  nextVatSubmissionDue: string | null;
  lastTransactionDate: string | null;
  subscription: string;
  compliance: { vat: string; alerts: string };
}

function ComplianceBadge({ vat, alerts }: { vat: string; alerts: string }) {
  const worst = alerts === 'critical' || vat === 'warning' ? 'at-risk' : alerts === 'warning' ? 'attention' : 'healthy';
  const config = {
    healthy: { label: 'Healthy', class: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20', icon: CheckCircle2 },
    attention: { label: 'Attention', class: 'bg-amber-50 text-amber-700 ring-amber-600/20', icon: Clock },
    'at-risk': { label: 'At risk', class: 'bg-rose-50 text-rose-700 ring-rose-600/20', icon: AlertCircle },
  }[worst];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${config.class}`}>
      <Icon className="h-3.5 w-3.5" />
      {config.label}
    </span>
  );
}

export default function ConsolePage() {
  const [clients, setClients] = useState<ConsoleRow[]>([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ACTIVE');
  const [loading, setLoading] = useState(true);
  const { switchCompany } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    api
      .listConsole(search || undefined, status)
      .then((data) => setClients(data as unknown as ConsoleRow[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, status]);

  const stats = useMemo(() => ({
    total: clients.length,
    alerts: clients.reduce((s, c) => s + c.alertCount, 0),
    vatDue: clients.filter((c) => c.nextVatSubmissionDue && new Date(c.nextVatSubmissionDue) < new Date(Date.now() + 30 * 86400000)).length,
  }), [clients]);

  return (
    <div>
      <PageHeader
        title="Company Console"
        description="Your client portfolio at a glance"
        breadcrumbs={[{ label: 'Home' }, { label: 'Company Console' }]}
        actions={
          <Button><Plus className="h-4 w-4" /> Add company</Button>
        }
      />

      {/* Summary cards — QuickBooks-style portfolio overview */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Active clients', value: stats.total, icon: Building2, color: 'text-teal-600 bg-teal-50' },
          { label: 'Open alerts', value: stats.alerts, icon: AlertCircle, color: 'text-rose-600 bg-rose-50' },
          { label: 'VAT due soon', value: stats.vatDue, icon: Clock, color: 'text-amber-600 bg-amber-50' },
        ].map((s) => (
          <Card key={s.label} className="flex items-center gap-4">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}>
              <s.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-sm text-slate-500">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Search companies..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-1 rounded-xl border border-slate-200 bg-white p-1">
          {[
            { value: 'ACTIVE', label: 'Active' },
            { value: 'all', label: 'All' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatus(opt.value)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                status === opt.value ? 'bg-teal-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <DataTable
          data={clients as unknown as DataRow[]}
          onRowClick={(row) => {
            const r = row as unknown as ConsoleRow;
            switchCompany({ id: r.id, name: r.name } as never);
            router.push('/dashboard');
          }}
          columns={[
            {
              key: 'name',
              header: 'Company',
              render: (row) => {
                const r = row as unknown as ConsoleRow;
                return (
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-600">
                    {r.name[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.contactName}</div>
                  </div>
                </div>
                );
              },
            },
            {
              key: 'compliance',
              header: 'Health',
              render: (row) => {
                const r = row as unknown as ConsoleRow;
                return <ComplianceBadge vat={r.compliance.vat} alerts={r.compliance.alerts} />;
              },
            },
            {
              key: 'alerts',
              header: 'Alerts',
              render: (row) => {
                const r = row as unknown as ConsoleRow;
                return r.alertCount > 0 ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">
                    {r.alertCount}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                );
              },
            },
            {
              key: 'nextVatSubmissionDue',
              header: 'Next VAT',
              render: (row) => {
                const r = row as unknown as ConsoleRow;
                return r.nextVatSubmissionDue ? (
                  <span className="text-sm">{formatDate(r.nextVatSubmissionDue)}</span>
                ) : (
                  <span className="text-xs text-amber-600">Setup required</span>
                );
              },
            },
            {
              key: 'lastLoginAt',
              header: 'Last visit',
              render: (row) => {
                const r = row as unknown as ConsoleRow;
                return (
                <span className="text-sm text-slate-500">
                  {r.lastLoginAt ? formatDate(r.lastLoginAt) : 'Never'}
                </span>
                );
              },
            },
            { key: 'financialYearEnd', header: 'Year-end' },
          ]}
        />
      )}
    </div>
  );
}
