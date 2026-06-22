'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, StatusBadge, formatZAR, formatDate } from '@accounting/ui';
import { api } from '@/lib/api';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listCustomers().then(setCustomers).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Customers" description="Manage customer accounts" />
      <DataTable
        data={customers.map((c) => ({ ...c, id: c.id as string }))}
        columns={[
          { key: 'name', header: 'Name' },
          { key: 'email', header: 'Email' },
          { key: 'phone', header: 'Phone' },
          { key: 'isActive', header: 'Status', render: (r) => <StatusBadge status={r.isActive ? 'active' : 'inactive'} /> },
        ]}
      />
    </div>
  );
}
