'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sun,
  Landmark,
  FileText,
  CreditCard,
  MoreHorizontal,
  Plus,
  Menu,
  X,
  LogOut,
  Bell,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { PRODUCT_NAME } from '@/lib/brand';
import { cn } from '@accounting/ui';

const primaryNav = [
  { href: '/today', label: 'Today', icon: Sun },
  { href: '/money', label: 'Money', icon: Landmark },
  { href: '/get-paid', label: 'Get Paid', icon: FileText },
  { href: '/pay', label: 'Pay', icon: CreditCard },
  { href: '/more', label: 'More', icon: MoreHorizontal },
];

export function OwnerShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, company, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (pathname === '/login') return <>{children}</>;

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Top header */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-600 text-sm font-bold text-white">
            V
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{company?.name ?? 'Your business'}</p>
            <p className="text-[10px] text-slate-500">{PRODUCT_NAME}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
            <Bell className="h-5 w-5" />
          </button>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-100 text-xs font-bold text-teal-700">
            {initials || 'U'}
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Desktop sidebar */}
        <aside className="hidden w-56 flex-col border-r border-slate-200/80 bg-white p-3 lg:flex">
          <nav className="flex-1 space-y-1">
            {primaryNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    active
                      ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-500 hover:bg-rose-50 hover:text-rose-600"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </aside>

        {/* Mobile drawer */}
        {mobileOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-black/30 lg:hidden" onClick={() => setMobileOpen(false)} />
            <aside className="fixed inset-y-0 left-0 z-50 w-64 bg-white p-4 shadow-xl lg:hidden">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-semibold text-slate-900">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <nav className="space-y-1">
                {primaryNav.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium',
                        active ? 'bg-teal-50 text-teal-700' : 'text-slate-600',
                      )}
                    >
                      <Icon className="h-[18px] w-[18px]" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </aside>
          </>
        )}

        <main className="mx-auto w-full max-w-3xl flex-1 p-4 pb-24 lg:p-8 lg:pb-8">{children}</main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around border-t border-slate-200 bg-white px-2 py-2 lg:hidden">
        {primaryNav.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium',
                active ? 'text-teal-600' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
        <Link
          href="/money#import"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600 text-white shadow-lg"
        >
          <Plus className="h-6 w-6" />
        </Link>
        {primaryNav.slice(2).map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-medium',
                active ? 'text-teal-600' : 'text-slate-500',
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
