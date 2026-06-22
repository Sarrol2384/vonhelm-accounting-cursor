'use client';

import Link from 'next/link';
import { Card } from '@accounting/ui';
import { Settings, Receipt, FileBarChart } from 'lucide-react';

const links = [
  { href: '/tax', label: 'Tax & compliance', icon: Receipt, note: 'Sprint 4' },
  { href: '/admin', label: 'Settings', icon: Settings, note: '' },
  { href: '/reports', label: 'Reports (accountant)', icon: FileBarChart, note: 'Legacy' },
];

export default function MorePage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">More</h1>
      <p className="mt-1 text-sm text-slate-500">Tax, settings, and documents</p>
      <div className="mt-6 space-y-2">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="flex items-center gap-3 p-4 hover:bg-slate-50">
                <Icon className="h-5 w-5 text-teal-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  {item.note && <p className="text-xs text-slate-400">{item.note}</p>}
                </div>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
