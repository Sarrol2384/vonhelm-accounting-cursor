'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Landmark,
  Receipt,
  BookOpen,
  Users,
  Truck,
  Package,
  FileBarChart,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Menu,
  X,
  PanelLeftClose,
  PanelLeft,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { CommandPalette } from './command-palette';
import { cn } from '@accounting/ui';

const navGroups = [
  {
    label: 'Overview',
    items: [
      { href: '/console', label: 'Company Console', icon: Building2 },
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Money',
    items: [
      { href: '/banking', label: 'Banking', icon: Landmark },
      { href: '/vat', label: 'VAT Returns', icon: Receipt },
      { href: '/ledger', label: 'General Ledger', icon: BookOpen },
    ],
  },
  {
    label: 'Sales & Purchases',
    items: [
      { href: '/sales/customers', label: 'Customers', icon: Users },
      { href: '/sales/suppliers', label: 'Suppliers', icon: Truck },
      { href: '/sales/items', label: 'Items', icon: Package },
      { href: '/sales/invoices', label: 'Tax Invoices', icon: FileBarChart },
      { href: '/sales/bills', label: 'Supplier Bills', icon: FileBarChart },
    ],
  },
  {
    label: 'Insights',
    items: [{ href: '/reports', label: 'Reports', icon: FileBarChart }],
  },
  {
    label: 'Settings',
    items: [{ href: '/admin', label: 'Administration', icon: Settings }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, company, logout, switchCompany } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [companyMenuOpen, setCompanyMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activityDismissed, setActivityDismissed] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  if (pathname === '/login') return <>{children}</>;

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-200 lg:static',
          collapsed ? 'w-[68px]' : 'w-64',
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className={cn('flex h-14 items-center border-b border-slate-100', collapsed ? 'justify-center px-2' : 'gap-3 px-4')}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl gradient-brand text-sm font-bold text-white shadow-sm">
            A
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-slate-900">Accountant</p>
              <p className="truncate text-[10px] text-slate-500">Edition · South Africa</p>
            </div>
          )}
          <button className="lg:hidden" onClick={() => setMobileOpen(false)}>
            <X className="h-5 w-5 text-slate-400" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {navGroups.map((group) => (
            <div key={group.label} className="mb-3">
              {!collapsed && (
                <p className="mb-1 px-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">{group.label}</p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href || (item.href !== '/console' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      'mb-0.5 flex items-center rounded-lg text-sm font-medium transition-all duration-150',
                      collapsed ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2',
                      active
                        ? 'bg-teal-50 text-teal-700 shadow-sm ring-1 ring-teal-100'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                    )}
                  >
                    <Icon className={cn('h-[18px] w-[18px] shrink-0', active && 'text-teal-600')} />
                    {!collapsed && item.label}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-100 p-2">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-50 hover:text-slate-600 lg:flex"
          >
            {collapsed ? <PanelLeft className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="glass-header sticky top-0 z-30 flex h-14 items-center gap-3 px-4 lg:px-6">
          <button className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <button
            className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2 text-sm text-slate-500 transition-colors hover:border-slate-300 hover:bg-white lg:max-w-md"
            onClick={() => setPaletteOpen(true)}
          >
            <Search className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Search anything...</span>
            <span className="sm:hidden">Search</span>
            <kbd className="ml-auto hidden rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:inline">⌘K</kbd>
          </button>

          <div className="flex items-center gap-1">
            {!activityDismissed && (
              <button
                onClick={() => setActivityDismissed(true)}
                className="hidden items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 transition-colors hover:bg-teal-100 md:flex"
              >
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-teal-500" />
                </span>
                Bank feeds syncing
              </button>
            )}

            <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100">
              <Bell className="h-[18px] w-[18px]" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
            </button>

            {/* Company switcher */}
            <div className="relative">
              <button
                className="flex max-w-[180px] items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:border-slate-300 lg:max-w-[220px]"
                onClick={() => { setCompanyMenuOpen(!companyMenuOpen); setUserMenuOpen(false); }}
              >
                <Building2 className="h-4 w-4 shrink-0 text-teal-600" />
                <span className="truncate">{company?.name ?? 'Select company'}</span>
                <ChevronDown className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              </button>
              {companyMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCompanyMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Switch company</p>
                    </div>
                    <div className="max-h-64 overflow-y-auto py-1">
                      {user?.companies.map((c) => (
                        <button
                          key={c.id}
                          className={cn(
                            'flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50',
                            c.id === company?.id && 'bg-teal-50 text-teal-700',
                          )}
                          onClick={() => { switchCompany(c); setCompanyMenuOpen(false); }}
                        >
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                            {c.name[0]}
                          </div>
                          <span className="truncate font-medium">{c.name}</span>
                        </button>
                      ))}
                    </div>
                    <Link
                      href="/console"
                      className="flex items-center gap-2 border-t border-slate-100 px-4 py-3 text-sm font-medium text-teal-600 hover:bg-slate-50"
                      onClick={() => setCompanyMenuOpen(false)}
                    >
                      <Sparkles className="h-4 w-4" /> Company Console
                    </Link>
                  </div>
                </>
              )}
            </div>

            {/* User menu */}
            <div className="relative">
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-xs font-bold text-white shadow-sm"
                onClick={() => { setUserMenuOpen(!userMenuOpen); setCompanyMenuOpen(false); }}
              >
                {initials || 'U'}
              </button>
              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="text-sm font-semibold text-slate-900">{user?.firstName} {user?.lastName}</p>
                      <p className="text-xs text-slate-500">{user?.email}</p>
                    </div>
                    <Link href="/admin" className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50" onClick={() => setUserMenuOpen(false)}>
                      Settings
                    </Link>
                    <button
                      onClick={() => { logout(); setUserMenuOpen(false); }}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Sign out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-8">
          <div className="mx-auto max-w-7xl animate-fade-in">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm lg:hidden" onClick={() => setMobileOpen(false)} />}
    </div>
  );
}
