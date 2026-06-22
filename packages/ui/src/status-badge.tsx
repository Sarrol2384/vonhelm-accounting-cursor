import { cn } from './utils';

const variants: Record<string, string> = {
  open: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  closed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  new: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  reviewed: 'bg-violet-50 text-violet-700 ring-violet-600/20',
  reconciled: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  completed: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  critical: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  warning: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  info: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  draft: 'bg-slate-50 text-slate-600 ring-slate-500/20',
  sent: 'bg-sky-50 text-sky-700 ring-sky-600/20',
  paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  submitted: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  not_submitted: 'bg-slate-50 text-slate-600 ring-slate-500/20',
};

export function StatusBadge({
  status,
  className,
  dot = true,
}: {
  status: string;
  className?: string;
  dot?: boolean;
}) {
  const key = status.toLowerCase().replace(/ /g, '_');
  const normalized = key.includes('_') ? key : key.split('_')[0];
  const style = variants[key] ?? variants[normalized] ?? 'bg-slate-50 text-slate-600 ring-slate-500/20';

  const dotColor = style.includes('emerald') ? 'bg-emerald-500'
    : style.includes('amber') ? 'bg-amber-500'
    : style.includes('rose') ? 'bg-rose-500'
    : style.includes('sky') ? 'bg-sky-500'
    : style.includes('violet') ? 'bg-violet-500'
    : 'bg-slate-400';

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium capitalize ring-1 ring-inset',
        style,
        className,
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColor)} />}
      {status.replace(/_/g, ' ')}
    </span>
  );
}
