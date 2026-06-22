'use client';

import { useEffect, useState } from 'react';
import { PageHeader, DataTable, formatZAR } from '@accounting/ui';
import { api } from '@/lib/api';

export default function ItemsPage() {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);

  useEffect(() => {
    api.listItems().then(setItems).catch(console.error);
  }, []);

  return (
    <div>
      <PageHeader title="Items" description="Products and services catalogue" />
      <DataTable
        data={items.map((i) => ({ ...i, id: i.id as string }))}
        columns={[
          { key: 'code', header: 'Code' },
          { key: 'description', header: 'Description' },
          { key: 'unitPrice', header: 'Unit Price', render: (r) => formatZAR(r.unitPrice as number) },
          { key: 'vatCode', header: 'VAT Code' },
        ]}
      />
    </div>
  );
}
