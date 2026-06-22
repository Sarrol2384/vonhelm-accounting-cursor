'use client';



import { useEffect, useState, useRef } from 'react';

import { PageHeader, Card, Button, formatZAR, formatDate } from '@accounting/ui';

import { api } from '@/lib/api';

import { parseBankCsv } from '@/lib/bank-csv';
import { txnLabel } from '@/lib/plain-category';

import { Upload, Landmark, CheckCircle2, Plus } from 'lucide-react';



export default function MoneyPage() {

  const [accounts, setAccounts] = useState<Array<Record<string, unknown>>>([]);

  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);

  const [transactions, setTransactions] = useState<Array<Record<string, unknown>>>([]);

  const [importing, setImporting] = useState(false);

  const [importMsg, setImportMsg] = useState('');

  const [importError, setImportError] = useState('');

  const fileRef = useRef<HTMLInputElement>(null);



  const [loadError, setLoadError] = useState('');

  const [showAddAccount, setShowAddAccount] = useState(false);

  const [creatingAccount, setCreatingAccount] = useState(false);

  const [accountFormError, setAccountFormError] = useState('');

  const [accountName, setAccountName] = useState('');

  const [bankName, setBankName] = useState('');

  const [openingBalance, setOpeningBalance] = useState('');



  const loadAccounts = async () => {

    setLoadError('');

    const accs = await api.listBankAccounts();

    setAccounts(accs);

    if (!selectedAccount && accs.length > 0) setSelectedAccount(accs[0].id as string);

  };



  const loadTransactions = async () => {

    if (!selectedAccount) return;

    const txns = await api.listBankTransactions(selectedAccount, undefined, 200);

    setTransactions(txns);

  };



  useEffect(() => {

    loadAccounts().catch((err) => {

      const msg = err instanceof Error ? err.message : 'Failed to load accounts';

      setLoadError(msg === 'Internal server error' ? 'Could not load your bank accounts. Try again.' : msg);

    });

  }, []);



  useEffect(() => {

    loadTransactions().catch(console.error);

  }, [selectedAccount]);



  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {

    const file = e.target.files?.[0];

    if (!file || !selectedAccount) return;

    setImporting(true);

    setImportMsg('');

    setImportError('');

    try {

      const text = await file.text();

      const rows = parseBankCsv(text);

      if (rows.length === 0) {

        throw new Error('No valid transactions found. Your CSV needs Date and Amount columns.');

      }

      const result = await api.importBankCsv(selectedAccount, rows as unknown as Array<Record<string, string>>);

      setImportMsg(`Imported ${result.imported} transactions. Rules applied — check Today for items needing you.`);

      await loadAccounts();

      await loadTransactions();

    } catch (err) {

      setImportError(err instanceof Error ? err.message : 'Import failed');

    } finally {

      setImporting(false);

      e.target.value = '';

    }

  };



  const handleCreateAccount = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!accountName.trim()) {

      setAccountFormError('Please enter an account name.');

      return;

    }

    setCreatingAccount(true);

    setAccountFormError('');

    try {

      const created = await api.createBankAccount({

        name: accountName.trim(),

        bankName: bankName.trim() || undefined,

        openingBalance: openingBalance ? parseFloat(openingBalance) : 0,

      }) as { id: string };

      setAccountName('');

      setBankName('');

      setOpeningBalance('');

      setShowAddAccount(false);

      await loadAccounts();

      setSelectedAccount(created.id);

    } catch (err) {

      const msg = err instanceof Error ? err.message : 'Could not create account';

      setAccountFormError(msg === 'Internal server error' ? 'Could not create account. Try again.' : msg);

    } finally {

      setCreatingAccount(false);

    }

  };



  const currentAccount = accounts.find((a) => a.id === selectedAccount);

  const balance = (currentAccount?.balance as number) ?? 0;



  return (

    <div>

      <PageHeader title="Money" description="Your cash and transactions in plain language" />



      {loadError && (

        <Card className="mb-6 border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{loadError}</Card>

      )}



      {/* Add bank account */}

      {accounts.length === 0 && !showAddAccount && (

        <Card className="mb-6 p-4">

          <h3 className="text-sm font-semibold text-slate-900">Add your first bank account</h3>

          <p className="mt-2 text-xs text-slate-500">

            Create a bank account before importing transactions from your bank CSV.

          </p>

          <Button className="mt-3" onClick={() => setShowAddAccount(true)}>

            <Plus className="mr-1.5 h-4 w-4" /> Add bank account

          </Button>

        </Card>

      )}



      {(showAddAccount || accounts.length > 0) && (

        <Card className="mb-6 p-4">

          <div className="flex items-center justify-between gap-2">

            <h3 className="text-sm font-semibold text-slate-900">Bank accounts</h3>

            {accounts.length > 0 && !showAddAccount && (

              <Button variant="secondary" size="sm" onClick={() => setShowAddAccount(true)}>

                <Plus className="mr-1 h-3.5 w-3.5" /> Add account

              </Button>

            )}

          </div>



          {showAddAccount && (

            <form onSubmit={handleCreateAccount} className="mt-3 space-y-3 border-t border-slate-100 pt-3">

              <div>

                <label className="text-xs font-medium text-slate-600">Account name</label>

                <input

                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"

                  placeholder="e.g. Business Cheque"

                  value={accountName}

                  onChange={(e) => setAccountName(e.target.value)}

                />

              </div>

              <div>

                <label className="text-xs font-medium text-slate-600">Bank (optional)</label>

                <input

                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"

                  placeholder="e.g. your bank"

                  value={bankName}

                  onChange={(e) => setBankName(e.target.value)}

                />

              </div>

              <div>

                <label className="text-xs font-medium text-slate-600">Opening balance (optional)</label>

                <input

                  type="number"

                  step="0.01"

                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"

                  placeholder="0.00"

                  value={openingBalance}

                  onChange={(e) => setOpeningBalance(e.target.value)}

                />

              </div>

              {accountFormError && <p className="text-sm text-rose-600">{accountFormError}</p>}

              <div className="flex gap-2">

                <Button type="submit" disabled={creatingAccount}>

                  {creatingAccount ? 'Creating…' : 'Create account'}

                </Button>

                {accounts.length > 0 && (

                  <Button type="button" variant="secondary" onClick={() => setShowAddAccount(false)}>

                    Cancel

                  </Button>

                )}

              </div>

            </form>

          )}



          {accounts.length > 0 && (

            <select

              className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"

              value={selectedAccount ?? ''}

              onChange={(e) => setSelectedAccount(e.target.value)}

            >

              {accounts.map((a) => (

                <option key={a.id as string} value={a.id as string}>{a.name as string}</option>

              ))}

            </select>

          )}

        </Card>

      )}



      {/* CSV Import */}

      <div id="import">

      <Card className="mb-6 p-4">

        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">

          <Upload className="h-4 w-4 text-teal-600" />

          Import bank CSV

        </h3>

        <p className="mt-2 text-xs text-slate-500">

          Export a transaction history CSV from your bank. We accept common formats — Date, Description, and Amount.

        </p>

        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={handleCsvUpload} />

        <Button

          className="mt-3"

          disabled={importing || !selectedAccount}

          onClick={() => fileRef.current?.click()}

        >

          {importing ? 'Importing…' : 'Choose CSV file'}

        </Button>

        {!selectedAccount && accounts.length === 0 && (

          <p className="mt-2 text-xs text-amber-700">Add a bank account first, then import your CSV.</p>

        )}

        {importMsg && (

          <p className="mt-2 flex items-center gap-1 text-sm text-emerald-700">

            <CheckCircle2 className="h-4 w-4" /> {importMsg}

          </p>

        )}

        {importError && <p className="mt-2 text-sm text-rose-600">{importError}</p>}

      </Card>

      </div>



      {/* Cash overview */}

      {accounts.length > 0 && (

        <Card className="mb-6 p-4">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50">

              <Landmark className="h-5 w-5 text-teal-600" />

            </div>

            <div>

              <p className="text-xs text-slate-500">Total cash</p>

              <p className="text-2xl font-bold text-slate-900">{formatZAR(balance)}</p>

            </div>

          </div>

        </Card>

      )}



      {/* Transactions */}

      <h3 className="mb-3 text-sm font-semibold text-slate-900">Transactions</h3>

      {transactions.length === 0 ? (

        <p className="text-sm text-slate-500">No transactions yet — import a bank CSV to get started.</p>

      ) : (

        <div className="space-y-2">

          {transactions.map((txn) => {

            const received = txn.received ? Number(txn.received) : 0;

            const spent = txn.spent ? Number(txn.spent) : 0;

            const isIn = received > 0;

            const amount = isIn ? received : spent;

            const selection = txn.selection as { name?: string } | null | undefined;
            const label = txnLabel(
              txn.payee as string,
              txn.description as string,
              selection?.name,
            );
            const hasCategory = !!txn.selectionId;
            const isConfirmed = !hasCategory && (txn.status === 'REVIEWED' || txn.status === 'RECONCILED');
            const counterparty = (txn.payee as string) || (txn.description as string);

            return (
              <Card key={txn.id as string} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  {hasCategory && counterparty && label !== counterparty && (
                    <p className="text-xs text-slate-500">{counterparty}</p>
                  )}
                  <p className="text-xs text-slate-500">{formatDate(txn.date as string)}</p>

                </div>

                <div className="text-right">

                  <p className={`text-sm font-semibold ${isIn ? 'text-emerald-700' : 'text-slate-900'}`}>

                    {isIn ? '+' : '-'}{formatZAR(amount)}

                  </p>

                  {hasCategory && <p className="text-[10px] text-emerald-600">Sorted ✓</p>}

                  {isConfirmed && <p className="text-[10px] text-emerald-600">Confirmed ✓</p>}

                </div>

              </Card>

            );

          })}

        </div>

      )}

    </div>

  );

}


