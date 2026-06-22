'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, StatusBadge, formatZAR, formatDate } from '@accounting/ui';
import { api } from '@/lib/api';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listInvoices().then(setInvoices).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Tax Invoices" description="Customer tax invoices" />
      <DataTable
        data={invoices.map((i) => ({ ...i, id: i.id as string }))}
        columns={[
          { key: 'number', header: 'Invoice #' },
          { key: 'customer', header: 'Customer', render: (r) => (r.customer as Record<string, string>)?.name },
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date as string) },
          { key: 'total', header: 'Total', render: (r) => formatZAR(r.total as number) },
          { key: 'amountPaid', header: 'Paid', render: (r) => formatZAR(r.amountPaid as number) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status as string} /> },
        ]}
      />
    </div>
  );
}
