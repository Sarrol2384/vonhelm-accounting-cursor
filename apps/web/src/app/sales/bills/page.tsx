'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, StatusBadge, formatZAR, formatDate } from '@accounting/ui';
import { api } from '@/lib/api';

export default function BillsPage() {
  const [bills, setBills] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listBills().then(setBills).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Supplier Bills" description="Supplier purchase bills" />
      <DataTable
        data={bills.map((b) => ({ ...b, id: b.id as string }))}
        columns={[
          { key: 'number', header: 'Bill #' },
          { key: 'supplier', header: 'Supplier', render: (r) => (r.supplier as Record<string, string>)?.name },
          { key: 'date', header: 'Date', render: (r) => formatDate(r.date as string) },
          { key: 'total', header: 'Total', render: (r) => formatZAR(r.total as number) },
          { key: 'amountPaid', header: 'Paid', render: (r) => formatZAR(r.amountPaid as number) },
          { key: 'status', header: 'Status', render: (r) => <StatusBadge status={r.status as string} /> },
        ]}
      />
    </div>
  );
}
