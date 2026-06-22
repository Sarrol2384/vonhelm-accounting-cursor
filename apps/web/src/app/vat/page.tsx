'use client';

import { useEffect, useState } from 'react';
import {
  PageHeader, DataTable, StatusBadge, formatZAR, formatDate, Card, CardHeader, Button, WorkflowSteps, type DataRow,
} from '@accounting/ui';
import { api } from '@/lib/api';
import { Calculator, Lock, Send, Link2 } from 'lucide-react';

interface VatPeriod {
  id: string;
  ref: string;
  periodStart: string;
  periodEnd: string;
  status: string;
  submissionStatus: string;
  vatPayable: number;
  vatRefundable: number;
  submissionDue: string | null;
  paymentLinked: boolean;
  vatReturn?: Record<string, unknown>;
}

export default function VatPage() {
  const [periods, setPeriods] = useState<VatPeriod[]>([]);
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [wizardPeriod, setWizardPeriod] = useState<VatPeriod | null>(null);

  const load = async () => {
    const [p, s] = await Promise.all([api.listVatPeriods(), api.getVatSettings()]);
    setPeriods(p as unknown as VatPeriod[]);
    setSettings(s);
  };

  useEffect(() => { load().catch(console.error); }, []);

  const openPeriod = periods.find((p) => p.status === 'OPEN');
  const closedPeriods = periods.filter((p) => p.status === 'CLOSED');

  const handleClose = async (id: string) => {
    if (!confirm('Close this VAT period? All bank transactions must be reconciled first.')) return;
    try {
      await api.closeVatPeriod(id);
      load();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to close period');
    }
  };

  const handleCalculate = async (id: string) => {
    const result = await api.calculateVat(id) as { period: VatPeriod };
    setWizardPeriod(result.period);
    load();
  };

  const workflowSteps = [
    { id: '1', label: 'Reconcile', status: 'complete' as const },
    { id: '2', label: 'Review', status: 'complete' as const },
    { id: '3', label: 'VAT 201', status: openPeriod ? 'current' as const : 'upcoming' as const },
    { id: '4', label: 'Submit', status: 'upcoming' as const },
    { id: '5', label: 'Payment', status: 'upcoming' as const },
  ];

  return (
    <div>
      <PageHeader
        title="VAT Returns"
        description="South African bi-monthly VAT periods"
        breadcrumbs={[{ label: 'Money' }, { label: 'VAT Returns' }]}
      />

      {/* Settings strip */}
      {settings && (
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {[
            { label: 'Frequency', value: `${(settings.settings as Record<string, unknown>)?.frequencyMonths ?? 2} months` },
            { label: 'VAT registration', value: (settings.company as Record<string, unknown>)?.vatRegistrationNumber as string ?? 'Not set' },
            {
              label: 'Next submission',
              value: (settings.company as Record<string, unknown>)?.nextVatSubmissionDue
                ? formatDate((settings.company as Record<string, unknown>).nextVatSubmissionDue as string)
                : '—',
              urgent: true,
            },
          ].map((item) => (
            <Card key={item.label}>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{item.label}</p>
              <p className={`mt-1 text-lg font-bold ${item.urgent ? 'text-rose-600' : 'text-slate-900'}`}>{item.value}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Guided workflow — better than Sage's ambiguous "Start Over?" */}
      <Card className="mb-8">
        <CardHeader title="VAT period workflow" description="Follow these steps to close and submit your return" />
        <WorkflowSteps steps={workflowSteps} />
      </Card>

      {/* Current period */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Current period</h2>
          {openPeriod && (
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => handleCalculate(openPeriod.id)}>
                <Calculator className="h-4 w-4" /> Calculate VAT 201
              </Button>
              <Button size="sm" onClick={() => handleClose(openPeriod.id)}>
                <Lock className="h-4 w-4" /> Close period
              </Button>
            </div>
          )}
        </div>
        {openPeriod ? (
          <DataTable
            data={[openPeriod as unknown as DataRow]}
            columns={[
              { key: 'status', header: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
              { key: 'ref', header: 'Reference' },
              {
                key: 'period',
                header: 'Period',
                render: (r) => `${formatDate(String(r.periodStart))} – ${formatDate(String(r.periodEnd))}`,
              },
              { key: 'vatPayable', header: 'VAT Payable', render: (r) => <span className="font-bold text-slate-900">{formatZAR(Number(r.vatPayable))}</span> },
              { key: 'vatRefundable', header: 'Refundable', render: (r) => formatZAR(Number(r.vatRefundable)) },
              {
                key: 'wizard',
                header: 'Actions',
                render: (r) => (
                  <button onClick={() => handleCalculate(String(r.id))} className="text-sm font-medium text-teal-600 hover:underline">
                    View VAT 201 →
                  </button>
                ),
              },
            ]}
          />
        ) : (
          <Card className="text-center text-sm text-slate-500">No open VAT period</Card>
        )}
      </div>

      {/* History */}
      <div>
        <h2 className="mb-4 text-base font-semibold text-slate-900">Previous periods</h2>
        <DataTable
          data={closedPeriods as unknown as DataRow[]}
          columns={[
            { key: 'status', header: 'Status', render: (r) => <StatusBadge status={String(r.status)} /> },
            { key: 'ref', header: 'Ref' },
            {
              key: 'period',
              header: 'Period',
              render: (r) => `${formatDate(String(r.periodStart))} – ${formatDate(String(r.periodEnd))}`,
            },
            { key: 'submissionStatus', header: 'Submission', render: (r) => <StatusBadge status={String(r.submissionStatus)} /> },
            { key: 'vatPayable', header: 'Payable', render: (r) => formatZAR(Number(r.vatPayable)) },
            {
              key: 'payment',
              header: 'Payment',
              render: (r) => r.paymentLinked ? (
                <span className="text-sm text-emerald-600">Linked</span>
              ) : (
                <button className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline">
                  <Link2 className="h-3.5 w-3.5" /> Link payment
                </button>
              ),
            },
          ]}
        />
      </div>

      {/* VAT 201 modal */}
      {wizardPeriod?.vatReturn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <Card className="max-h-[85vh] w-full max-w-lg overflow-y-auto shadow-2xl">
            <CardHeader
              title={`VAT 201 · ${wizardPeriod.ref}`}
              description={`${formatDate(wizardPeriod.periodStart)} – ${formatDate(wizardPeriod.periodEnd)}`}
            />
            <dl className="space-y-0">
              {Object.entries(wizardPeriod.vatReturn)
                .filter(([k]) => k.startsWith('field'))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between border-b border-slate-50 py-3 text-sm">
                    <dt className="text-slate-500">{k.replace('field', 'Field ')}</dt>
                    <dd className="font-semibold tabular-nums text-slate-900">{formatZAR(v as number)}</dd>
                  </div>
                ))}
            </dl>
            <div className="mt-6 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setWizardPeriod(null)}>Close</Button>
              <Button className="flex-1"><Send className="h-4 w-4" /> Mark submitted</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
