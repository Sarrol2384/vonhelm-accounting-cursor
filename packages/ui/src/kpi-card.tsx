import { cn } from './utils';
import { MiniChart } from './mini-chart';

export function KpiCard({
  label,
  value,
  hint,
  trend,
  trendLabel,
  icon,
  sparkline,
  accent = 'teal',
  className,
}: {
  label: string;
  value: string;
  hint?: string;
  trend?: 'up' | 'down' | 'neutral';
  trendLabel?: string;
  icon?: React.ReactNode;
  sparkline?: number[];
  accent?: 'teal' | 'indigo' | 'amber' | 'rose';
  className?: string;
}) {
  const accentColors = {
    teal: { bg: 'bg-teal-50', text: 'text-teal-600', chart: '#0d9488' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-600', chart: '#6366f1' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', chart: '#d97706' },
    rose: { bg: 'bg-rose-50', text: 'text-rose-600', chart: '#e11d48' },
  };
  const colors = accentColors[accent];

  const trendColor =
    trend === 'up' ? 'text-emerald-600' : trend === 'down' ? 'text-rose-600' : 'text-slate-500';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && (
              <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', colors.bg, colors.text)}>
                {icon}
              </div>
            )}
            <p className="text-sm font-medium text-slate-500">{label}</p>
          </div>
          <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          {(hint || trendLabel) && (
            <p className={cn('mt-1.5 text-xs font-medium', trendColor)}>
              {trendLabel ?? hint}
            </p>
          )}
        </div>
        {sparkline && sparkline.length > 1 && (
          <div className="w-24 opacity-80">
            <MiniChart data={sparkline} color={colors.chart} height={36} />
          </div>
        )}
      </div>
    </div>
  );
}
