'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, StatusBadge } from '@accounting/ui';
import { api } from '@/lib/api';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listSuppliers().then(setSuppliers).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Suppliers" description="Manage supplier accounts" />
      <DataTable
        data={suppliers.map((s) => ({ ...s, id: s.id as string }))}
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
