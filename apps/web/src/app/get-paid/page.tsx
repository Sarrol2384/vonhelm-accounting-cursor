'use client';

import { Card } from '@accounting/ui';

export default function GetPaidPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Get Paid</h1>
      <p className="mt-1 text-sm text-slate-500">Invoices and customers</p>
      <Card className="mt-6 p-6 text-center text-sm text-slate-500">
        Invoice creation ships in Sprint 3. Your existing invoices are at{' '}
        <a href="/sales/invoices" className="text-teal-600 underline">/sales/invoices</a> (legacy view).
      </Card>
    </div>
  );
}
