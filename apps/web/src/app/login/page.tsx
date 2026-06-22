'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { COMPANY_NAME, PRODUCT_NAME, PRODUCT_TAGLINE } from '@/lib/brand';
import { Sun, Landmark, Shield, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithSupabase, supabaseEnabled, apiReachable } = useAuth();
  const [email, setEmail] = useState('admin@demo.co.za');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (supabaseEnabled) {
        await loginWithSupabase(email, password);
      } else {
        await login(email, password);
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'Login failed';
      setError(
        raw === 'Internal server error'
          ? 'Database not running. Stop dev servers, then from the project root run: pnpm dev (starts the DB automatically). If it persists: pnpm db:fresh'
          : raw,
      );
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Sun, title: 'Today at a glance', desc: 'See what was handled overnight and what needs you' },
    { icon: Landmark, title: 'Money without jargon', desc: 'Cash, bank imports, and plain-English questions' },
    { icon: Shield, title: 'Built for South Africa', desc: 'ZAR, VAT-ready books, and SARS-aligned compliance' },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Left panel — brand & value props */}
      <div className="hidden w-1/2 flex-col justify-between gradient-brand p-12 text-white lg:flex">
        <div>
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20 text-lg font-bold backdrop-blur">
            V
          </div>
          <p className="mt-6 text-sm font-medium text-teal-100">{PRODUCT_NAME}</p>
          <h1 className="mt-2 text-4xl font-bold leading-tight tracking-tight">
            Run your business.<br />
            We handle the money.
          </h1>
          <p className="mt-4 max-w-md text-lg text-teal-100">{PRODUCT_TAGLINE}</p>
        </div>
        <div className="space-y-5">
          {features.map((f) => (
            <div key={f.title} className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{f.title}</p>
                <p className="text-sm text-teal-100">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-teal-200/80">© 2026 {COMPANY_NAME}</p>
      </div>

      {/* Right panel — form */}
      <div className="flex w-full flex-col items-center justify-center bg-white p-6 lg:w-1/2 lg:p-12">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl gradient-brand text-sm font-bold text-white">
              V
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900">{PRODUCT_NAME}</p>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back</h2>
          <p className="mt-1 text-sm text-slate-500">Sign in to {PRODUCT_NAME}</p>

          {!apiReachable && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              API unreachable at {process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'}. Run{' '}
              <code className="rounded bg-amber-100 px-1">pnpm dev</code> from the project root.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
            )}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Email address</label>
              <input
                type="email"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-colors outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Password</label>
              <input
                type="password"
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-2.5 text-sm transition-colors outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 active:scale-[0.98] disabled:opacity-50"
            >
              {loading ? (
                'Signing in...'
              ) : (
                <>
                  Sign in <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
          <p className="mt-8 rounded-xl bg-slate-50 px-4 py-3 text-center text-xs text-slate-500">
            Demo credentials: <span className="font-medium text-slate-700">admin@demo.co.za</span> / password123
          </p>
        </div>
      </div>
    </div>
  );
}
