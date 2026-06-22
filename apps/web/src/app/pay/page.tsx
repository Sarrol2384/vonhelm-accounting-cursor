'use client';

import { Card } from '@accounting/ui';

export default function PayPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Pay</h1>
      <p className="mt-1 text-sm text-slate-500">Bills and suppliers</p>
      <Card className="mt-6 p-6 text-center text-sm text-slate-500">
        Bill capture ships in Sprint 4. Legacy bills view:{' '}
        <a href="/sales/bills" className="text-teal-600 underline">/sales/bills</a>
      </Card>
    </div>
  );
}
