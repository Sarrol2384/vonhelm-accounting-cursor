'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  PageHeader, KpiCard, DataTable, EmptyState, Card, CardHeader, Button,
  formatZAR, formatDate, StatusBadge, MiniChart,
} from '@accounting/ui';
import { api, Company } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Plus, Wallet, Receipt, AlertTriangle, Users,
  ArrowRight, Landmark, FileText, CheckCircle2,
} from 'lucide-react';

export default function DashboardPage() {
  const { company } = useAuth();
  const [companyData, setCompanyData] = useState<Company | null>(null);
  const [kpis, setKpis] = useState<Record<string, unknown> | null>(null);
  const [notes, setNotes] = useState<Array<Record<string, unknown>>>([]);
  const [tasks, setTasks] = useState<Array<Record<string, unknown>>>([]);
  const [newNoteSubject, setNewNoteSubject] = useState('');
  const [showNoteForm, setShowNoteForm] = useState(false);

  const load = async () => {
    if (!company) return;
    const [c, k, n, t] = await Promise.all([
      api.getCompany(company.id),
      api.getKpis(),
      api.listNotes(),
      api.listTasks('scheduled'),
    ]);
    setCompanyData(c);
    setKpis(k);
    setNotes(n);
    setTasks(t);
  };

  useEffect(() => {
    load().catch(console.error);
  }, [company?.id]);

  const handleAddNote = async () => {
    if (!newNoteSubject.trim()) return;
    await api.createNote({ subject: newNoteSubject, type: 'General' });
    setNewNoteSubject('');
    setShowNoteForm(false);
    load();
  };

  const cashSparkline = [140000, 148000, 152000, 155000, 158000, 161740];
  const blockers = (kpis?.periodCloseBlockers as string[]) ?? [];
  const unreconciled = (kpis?.unreconciledTransactions as number) ?? 0;

  const needsAttention = [
    ...(unreconciled > 0 ? [{ label: `${unreconciled} bank transactions to reconcile`, href: '/banking', icon: Landmark }] : []),
    ...((kpis?.vatPayable as number) > 0 ? [{ label: `VAT payable: ${formatZAR(kpis?.vatPayable as number)}`, href: '/vat', icon: Receipt }] : []),
    ...((kpis?.overdueDebtors as number) > 0 ? [{ label: `${kpis?.overdueDebtors} overdue invoices`, href: '/sales/invoices', icon: FileText }] : []),
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={company?.name}
        breadcrumbs={[{ label: 'Home' }, { label: 'Dashboard' }]}
      />

      {kpis && (
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            label="Cash position"
            value={formatZAR(kpis.cashPosition as number)}
            trend="up"
            trendLabel="+2.4% vs last month"
            icon={<Wallet className="h-4 w-4" />}
            sparkline={cashSparkline}
            accent="teal"
          />
          <KpiCard
            label="VAT payable"
            value={formatZAR(kpis.vatPayable as number)}
            hint={kpis.vatPeriodRef ? `Period ${kpis.vatPeriodRef}` : undefined}
            icon={<Receipt className="h-4 w-4" />}
            accent="indigo"
          />
          <KpiCard
            label="To reconcile"
            value={String(unreconciled)}
            trend={unreconciled > 0 ? 'down' : 'neutral'}
            trendLabel={unreconciled > 0 ? 'Action needed' : 'All clear'}
            icon={<AlertTriangle className="h-4 w-4" />}
            accent="amber"
          />
          <KpiCard
            label="Overdue"
            value={`${kpis.overdueDebtors} / ${kpis.overdueCreditors}`}
            hint="debtors / creditors"
            icon={<Users className="h-4 w-4" />}
            accent="rose"
          />
        </div>
      )}

      <div className="mb-8 grid gap-6 lg:grid-cols-3">
        {/* Needs attention — Xero-style actionable panel */}
        <Card className="lg:col-span-1">
          <CardHeader title="Needs attention" description="Prioritized actions for today" />
          {needsAttention.length === 0 ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-700">You&apos;re all caught up!</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {needsAttention.map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition-all hover:border-teal-200 hover:bg-teal-50/50"
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                      <item.icon className="h-4 w-4" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-slate-700">{item.label}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-teal-600" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {/* Cash flow mini chart */}
        <Card className="lg:col-span-2">
          <CardHeader title="Cash flow trend" description="Last 6 periods" />
          <div className="h-32">
            <MiniChart data={cashSparkline} height={120} className="h-full w-full" />
          </div>
          <div className="mt-4 flex gap-6 text-xs text-slate-500">
            <span>Opening <strong className="text-slate-700">{formatZAR(140000)}</strong></span>
            <span>Current <strong className="text-teal-600">{formatZAR(kpis?.cashPosition as number ?? 0)}</strong></span>
          </div>
        </Card>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader title="Company profile" />
          <dl className="space-y-3 text-sm">
            {[
              ['Company', companyData?.name],
              ['Year-end', companyData ? `${companyData.financialYearEndDay}/${companyData.financialYearEndMonth}` : '—'],
              ['VAT reg', companyData?.vatRegistrationNumber || null],
              ['Next VAT due', companyData?.nextVatSubmissionDue ? formatDate(companyData.nextVatSubmissionDue) : '—'],
              ['Frequency', `${companyData?.vatFrequencyMonths ?? 2} months`],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between border-b border-slate-50 pb-2">
                <dt className="text-slate-500">{label}</dt>
                <dd className="font-medium text-slate-800">
                  {value ?? <Link href="/admin" className="text-teal-600 hover:underline">Add details →</Link>}
                </dd>
              </div>
            ))}
          </dl>
          {(companyData?.phone || companyData?.email) && (
            <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm">
              {companyData.phone && <p>{companyData.phone}</p>}
              {companyData.email && <p className="text-teal-600">{companyData.email}</p>}
            </div>
          )}
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader
            title="Accountant notes"
            action={
              <Button variant="secondary" size="sm" onClick={() => setShowNoteForm(!showNoteForm)}>
                <Plus className="h-3.5 w-3.5" /> Add note
              </Button>
            }
          />
          {showNoteForm && (
            <div className="mb-4 flex gap-2">
              <input
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
                placeholder="Note subject..."
                value={newNoteSubject}
                onChange={(e) => setNewNoteSubject(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
              />
              <Button size="sm" onClick={handleAddNote}>Save</Button>
            </div>
          )}
          {notes.length === 0 ? (
            <EmptyState
              title="No notes yet"
              description="Track compliance reminders and client-specific notes here."
              action={<Button size="sm" onClick={() => setShowNoteForm(true)}>Add first note</Button>}
            />
          ) : (
            <DataTable
              compact
              data={notes.map((n) => ({ ...n, id: n.id as string }))}
              columns={[
                { key: 'dueDate', header: 'Due', render: (r) => { const row = r as Record<string, unknown>; return row.dueDate ? formatDate(row.dueDate as string) : '—'; } },
                { key: 'type', header: 'Type', render: (r) => (r as Record<string, unknown>).type as React.ReactNode },
                { key: 'subject', header: 'Subject', render: (r) => (r as Record<string, unknown>).subject as React.ReactNode },
              ]}
            />
          )}
        </Card>
      </div>

      <Card>
        <CardHeader
          title={`Tasks · ${new Date().toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long' })}`}
        />
        {tasks.length === 0 ? (
          <EmptyState title="No tasks today" description="Scheduled tasks will appear here." />
        ) : (
          <DataTable
            data={tasks.map((t) => ({ ...t, id: t.id as string }))}
            columns={[
              { key: 'title', header: 'Task', render: (r) => (r as Record<string, unknown>).title as React.ReactNode },
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={(r as Record<string, unknown>).status as string} /> },
              { key: 'startDate', header: 'Start', render: (r) => { const row = r as Record<string, unknown>; return row.startDate ? formatDate(row.startDate as string) : '—'; } },
              { key: 'dueDate', header: 'Due', render: (r) => { const row = r as Record<string, unknown>; return row.dueDate ? formatDate(row.dueDate as string) : '—'; } },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
