'use client';

import { PageHeader } from '@accounting/ui';
import { useAuth } from '@/lib/auth-context';

export default function AdminPage() {
  const { user } = useAuth();

  return (
    <div>
      <PageHeader title="Administration" description="User access and account settings" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold">My Account</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-slate-500">Name</dt><dd>{user?.firstName} {user?.lastName}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Email</dt><dd>{user?.email}</dd></div>
            <div className="flex justify-between"><dt className="text-slate-500">Role</dt><dd className="capitalize">{user?.role?.toLowerCase().replace('_', ' ')}</dd></div>
          </dl>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="mb-4 text-sm font-semibold">Control User Access</h2>
          <p className="text-sm text-slate-600">Manage firm users and company memberships. Role-based access: Firm Admin, Accountant, Bookkeeper, Client Read-only.</p>
        </div>
      </div>
    </div>
  );
}
