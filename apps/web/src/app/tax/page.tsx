'use client';

import { Card } from '@accounting/ui';

export default function TaxOwnerPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Tax</h1>
      <p className="mt-1 text-sm text-slate-500">Your tax status in plain English</p>
      <Card className="mt-6 p-6 text-center text-sm text-slate-500">
        Owner tax view ships in Sprint 4. Accountant VAT wizard:{' '}
        <a href="/vat" className="text-teal-600 underline">/vat</a>
      </Card>
    </div>
  );
}
