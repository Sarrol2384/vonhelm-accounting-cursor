'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, X, ArrowRight, Building2, Users, Truck, FileText, BookOpen, Receipt } from 'lucide-react';
import { api } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { cn } from '@accounting/ui';

const typeConfig: Record<string, { icon: typeof Users; color: string }> = {
  customer: { icon: Users, color: 'text-sky-600 bg-sky-50' },
  supplier: { icon: Truck, color: 'text-violet-600 bg-violet-50' },
  invoice: { icon: FileText, color: 'text-emerald-600 bg-emerald-50' },
  journal: { icon: BookOpen, color: 'text-amber-600 bg-amber-50' },
  vat: { icon: Receipt, color: 'text-rose-600 bg-rose-50' },
};

const routes: Record<string, string> = {
  customer: '/sales/customers',
  supplier: '/sales/suppliers',
  invoice: '/sales/invoices',
  journal: '/ledger',
  vat: '/vat',
};

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ type: string; id: string; label: string }>>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const router = useRouter();

  const search = useCallback(async (q: string) => {
    if (!q.trim()) { setResults([]); return; }
    try {
      const data = await api.search(q);
      setResults([
        ...(data.customers ?? []),
        ...(data.suppliers ?? []),
        ...(data.invoices ?? []),
        ...(data.journals ?? []),
        ...(data.vatPeriods ?? []),
      ]);
      setActiveIdx(0);
    } catch { setResults([]); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 150);
    return () => clearTimeout(t);
  }, [query, search]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && results[activeIdx]) {
        router.push(routes[results[activeIdx].type] ?? '/dashboard');
        onClose();
      }
    };
    if (open) window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose, results, activeIdx, router]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[12vh] backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3.5">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            autoFocus
            className="flex-1 text-sm outline-none placeholder:text-slate-400"
            placeholder="Search customers, invoices, VAT periods..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className="hidden rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] text-slate-400 sm:inline">ESC</kbd>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && query && (
            <p className="px-3 py-8 text-center text-sm text-slate-500">No results for &ldquo;{query}&rdquo;</p>
          )}
          {results.map((r, i) => {
            const cfg = typeConfig[r.type] ?? { icon: Building2, color: 'text-slate-600 bg-slate-50' };
            const Icon = cfg.icon;
            return (
              <button
                key={`${r.type}-${r.id}`}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors',
                  i === activeIdx ? 'bg-teal-50 text-teal-700' : 'hover:bg-slate-50',
                )}
                onClick={() => { router.push(routes[r.type] ?? '/dashboard'); onClose(); }}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', cfg.color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{r.label}</p>
                  <p className="text-xs capitalize text-slate-400">{r.type}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-300" />
              </button>
            );
          })}
          {!query && (
            <div className="px-3 py-8 text-center">
              <p className="text-sm text-slate-500">Universal search across all modules</p>
              <p className="mt-1 text-xs text-slate-400">Try a customer name, invoice number, or VAT period ref</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
