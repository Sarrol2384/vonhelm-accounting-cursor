'use client';



import { useEffect, useState, useCallback } from 'react';

import Link from 'next/link';

import { formatZAR, formatDate, Card, Button } from '@accounting/ui';

import { api } from '@/lib/api';

import { useAuth } from '@/lib/auth-context';

import { CheckCircle2, AlertCircle, ArrowRight, Upload, Info } from 'lucide-react';



type TodayData = Awaited<ReturnType<typeof api.ownerToday>>;



function TypePill({ label, variant }: { label: string; variant: 'actual' | 'partial' | 'estimated' | 'unknown' | 'neutral' }) {

  const styles = {

    actual: 'bg-emerald-50 text-emerald-700 ring-emerald-100',

    partial: 'bg-amber-50 text-amber-700 ring-amber-100',

    estimated: 'bg-sky-50 text-sky-700 ring-sky-100',

    unknown: 'bg-slate-100 text-slate-600 ring-slate-200',

    neutral: 'bg-slate-100 text-slate-600 ring-slate-200',

  };

  return (

    <span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ring-1 ${styles[variant]}`}>

      {label}

    </span>

  );

}



function QueueBanner({ queue }: { queue: TodayData['queue'] }) {

  if (queue.status === 'needs_attention') {

    return (

      <Card className="border-amber-200 bg-amber-50/60 p-4">

        <div className="flex items-start gap-2">

          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />

          <div>

            <p className="text-sm font-medium text-amber-900">{queue.message}</p>

            <p className="mt-1 text-xs text-amber-800/80">Answer below to keep your records accurate.</p>

          </div>

        </div>

      </Card>

    );

  }



  if (queue.status === 'getting_started') {

    return (

      <Card className="border-slate-200 bg-slate-50 p-4">

        <p className="text-sm font-medium text-slate-800">{queue.message}</p>

      </Card>

    );

  }



  return (

    <Card className="border-emerald-100 bg-emerald-50/40 p-4">

      <p className="text-sm font-medium text-emerald-800">{queue.message}</p>

    </Card>

  );

}



function BankBalanceCard({ bank }: { bank: TodayData['bankBalance'] }) {

  return (

    <Card className="p-4">

      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Bank Balance</p>

        <TypePill

          label={bank.typeLabel}

          variant={bank.typeLabel === 'Actual' ? 'actual' : 'partial'}

        />

      </div>

      {bank.amount != null ? (

        <p className="mt-2 text-2xl font-bold text-slate-900">{formatZAR(bank.amount)}</p>

      ) : (

        <p className="mt-2 text-lg font-semibold text-slate-500">Not set up yet</p>

      )}

      <p className="mt-2 text-sm text-slate-600">{bank.supportingText}</p>

      {bank.lastUpdated && (

        <p className="mt-2 text-xs text-slate-500">Last updated {formatDate(bank.lastUpdated)}</p>

      )}

      <p className="mt-3 text-xs text-slate-400">

        This is your bank balance in VonHelm — not money owed to you, tax due, or profit.

      </p>

    </Card>

  );

}



function VatCard({ vat }: { vat: TodayData['vat'] }) {

  if (vat.display === 'not_registered') {

    return (

      <Card className="p-4">

        <div className="flex items-center justify-between gap-2">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">VAT this period</p>

          <TypePill label="Not registered" variant="neutral" />

        </div>

        <p className="mt-2 text-sm font-medium text-slate-900">{vat.headline}</p>

        <p className="mt-1 text-sm text-slate-600">{vat.supportingText}</p>

      </Card>

    );

  }



  if (vat.display === 'unknown') {

    return (

      <Card className="p-4">

        <div className="flex items-center justify-between gap-2">

          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">VAT this period</p>

          <TypePill label="Unknown" variant="unknown" />

        </div>

        <p className="mt-2 text-sm font-medium text-slate-900">{vat.headline}</p>

        <p className="mt-1 text-sm text-slate-600">{vat.supportingText}</p>

        {vat.reason && (

          <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500">

            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />

            {vat.reason}

          </p>

        )}

      </Card>

    );

  }



  return (

    <Card className="p-4">

      <div className="flex items-center justify-between gap-2">

        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">VAT this period</p>

        <TypePill label="Estimated" variant="estimated" />

      </div>

      <p className="mt-2 text-lg font-semibold text-slate-900">{vat.headline}</p>

      <p className="mt-2 text-sm text-slate-600">{vat.supportingText}</p>

      {vat.nextDue && (

        <p className="mt-2 text-xs text-slate-500">Submission due {formatDate(vat.nextDue)}</p>

      )}

    </Card>

  );

}



export default function TodayPage() {

  const { company } = useAuth();

  const [data, setData] = useState<TodayData | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const [resolveError, setResolveError] = useState('');

  const defaultLoadError = "We couldn't load Today right now. Your data is safe — please try again.";



  const load = useCallback(async () => {

    if (!company) return;

    setLoading(true);

    setError('');

    try {

      const t = await api.ownerToday();

      setData(t);

    } catch (e) {

      const raw = e instanceof Error ? e.message : 'Failed to load Today';

      const isGenericServer =

        raw === 'Internal server error' || raw === 'Request failed' || raw === 'Failed to fetch';

      setError(isGenericServer ? defaultLoadError : raw);

    } finally {

      setLoading(false);

    }

  }, [company?.id]);



  useEffect(() => {

    load();

  }, [load]);



  const handleResolve = async (actionId: string, choice: string) => {

    setResolvingId(actionId);

    setResolveError('');

    try {

      await api.resolveOwnerAction(actionId, choice);

      await load();

    } catch (e) {

      const raw = e instanceof Error ? e.message : 'Could not save your answer';

      setResolveError(

        raw === 'Internal server error' || raw === 'Request failed'

          ? 'We could not save your answer. Please try again.'

          : raw,

      );

    } finally {

      setResolvingId(null);

    }

  };



  if (loading) {

    return (

      <div className="flex min-h-[40vh] items-center justify-center">

        <div className="h-8 w-8 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />

      </div>

    );

  }



  if (error) {

    return (

      <Card className="p-6 text-center">

        <p className="text-sm text-rose-600">

          We couldn&apos;t load Today. Your data is safe — check your connection and try again.

        </p>

        {error && <p className="mt-1 text-xs text-slate-500">{error}</p>}

        <Button className="mt-4" onClick={load}>Try again</Button>

      </Card>

    );

  }



  if (!data) {

    return (

      <Card className="p-6 text-center">

        <p className="text-sm text-rose-600">{defaultLoadError}</p>

        <Button className="mt-4" onClick={load}>Try again</Button>

      </Card>

    );

  }



  const greeting = (() => {

    const h = new Date().getHours();

    if (h < 12) return 'Good morning';

    if (h < 17) return 'Good afternoon';

    return 'Good evening';

  })();



  const totalHandled = data.sortedCount + data.confirmedCount;

  const showEmptyState =

    data.queue.status === 'getting_started' &&

    totalHandled === 0 &&

    data.pendingApprovalCount === 0;



  return (

    <div className="space-y-6">

      <div>

        <h1 className="text-2xl font-bold text-slate-900">{greeting}</h1>

        <p className="text-sm text-slate-500">{company?.name}</p>

      </div>



      <QueueBanner queue={data.queue} />



      <div className="space-y-4">

        <BankBalanceCard bank={data.bankBalance} />

        <VatCard vat={data.vat} />

      </div>



      {data.pendingApprovalCount > 0 && (

        <section>

          <div className="mb-3 flex items-baseline justify-between gap-2">

            <h2 className="text-sm font-semibold text-slate-900">Needs you</h2>

            {data.pendingApprovalCount > data.pendingActionsShown && (

              <p className="text-xs text-slate-500">

                Showing {data.pendingActionsShown} of {data.pendingApprovalCount}

              </p>

            )}

          </div>

          {resolveError && (

            <p className="mb-3 text-sm text-rose-600">{resolveError}</p>

          )}

          <div className="space-y-3">

            {data.pendingActions.map((action) => (

              <Card key={action.id} className="border-amber-200 bg-amber-50/50 p-4">

                <p className="text-sm font-medium text-slate-900">{action.question}</p>

                {action.txnDate && (

                  <p className="mt-1 text-xs text-slate-500">{formatDate(action.txnDate)}</p>

                )}

                {action.amount != null && (

                  <p className="mt-1 text-xs text-slate-500">{formatZAR(action.amount)}</p>

                )}

                <p className="mt-2 text-xs text-slate-500">

                  Confirming does not pick a category yet — it tells us this payment looks correct.

                </p>

                <div className="mt-3 flex flex-col gap-2">

                  {action.choices.slice(0, 2).map((choice) => (

                    <Button

                      key={choice}

                      variant={choice.startsWith('Yes') ? 'primary' : 'secondary'}

                      className="w-full justify-center"

                      disabled={resolvingId === action.id}

                      onClick={() => handleResolve(action.id, choice)}

                    >

                      {resolvingId === action.id ? 'Saving…' : choice}

                    </Button>

                  ))}

                </div>

              </Card>

            ))}

          </div>

        </section>

      )}



      {(data.sortedCount > 0 || data.confirmedCount > 0) && (

        <Card className="p-4">

          <div className="flex items-start gap-2 text-sm text-slate-700">

            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />

            <div className="space-y-2">

              {data.sortedCount > 0 && (

                <div>

                  <p>

                    <strong>{data.sortedCount}</strong> transaction{data.sortedCount === 1 ? '' : 's'}{' '}

                    sorted automatically

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    Sorted means matched to a category. Your accountant may still review before filing.

                  </p>

                </div>

              )}

              {data.confirmedCount > 0 && (

                <div>

                  <p>

                    <strong>{data.confirmedCount}</strong> transaction{data.confirmedCount === 1 ? '' : 's'}{' '}

                    confirmed by you

                  </p>

                  <p className="mt-1 text-xs text-slate-500">

                    Confirmed means you said the payment looks correct — we have not assigned a category yet.

                  </p>

                </div>

              )}

            </div>

          </div>

        </Card>

      )}



      {showEmptyState && (

        <Card className="p-6 text-center">

          <Upload className="mx-auto h-10 w-10 text-slate-300" />

          <p className="mt-3 font-medium text-slate-900">Let&apos;s bring your bank transactions in</p>

          <p className="mt-1 text-sm text-slate-500">

            Upload a bank transaction CSV. VonHelm will sort what it can and ask you about the rest.

          </p>

          <Link href="/money">

            <Button className="mt-4">Import bank CSV</Button>

          </Link>

        </Card>

      )}



      <section>

        <div className="mb-3 flex items-center justify-between">

          <h2 className="text-sm font-semibold text-slate-900">Recent activity</h2>

          <Link href="/money" className="flex items-center gap-1 text-xs font-medium text-teal-600">

            See all <ArrowRight className="h-3 w-3" />

          </Link>

        </div>

        {data.activity.length === 0 ? (

          <p className="text-sm text-slate-500">No activity yet</p>

        ) : (

          <div className="space-y-2">

            {data.activity.map((item) => (

              <Card key={item.id} className="flex items-center justify-between p-3">

                <div className="min-w-0 flex-1">

                  <p className="truncate text-sm font-medium text-slate-900">{item.description}</p>

                  <p className="text-xs text-slate-500">{formatDate(item.date)}</p>

                </div>

                <div className="ml-3 text-right">

                  <p className={item.type === 'money_in' ? 'text-sm font-semibold text-emerald-700' : 'text-sm font-semibold text-slate-900'}>

                    {item.type === 'money_in' ? '+' : '-'}{formatZAR(item.amount)}

                  </p>

                  {item.activityStatus === 'sorted' && (

                    <p className="text-[10px] text-emerald-600">Sorted ✓</p>

                  )}

                  {item.activityStatus === 'confirmed' && (

                    <p className="text-[10px] text-emerald-600">Confirmed ✓</p>

                  )}

                </div>

              </Card>

            ))}

          </div>

        )}

      </section>

    </div>

  );

}


