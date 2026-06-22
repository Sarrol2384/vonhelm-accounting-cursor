import { cn } from './utils';

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'complete' | 'current' | 'upcoming';
}

export function WorkflowSteps({ steps }: { steps: WorkflowStep[] }) {
  return (
    <div className="flex items-center gap-0 overflow-x-auto pb-2">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold transition-colors',
                step.status === 'complete' && 'bg-teal-600 text-white',
                step.status === 'current' && 'bg-teal-100 text-teal-700 ring-2 ring-teal-600 ring-offset-2',
                step.status === 'upcoming' && 'bg-slate-100 text-slate-400',
              )}
            >
              {step.status === 'complete' ? '✓' : i + 1}
            </div>
            <span
              className={cn(
                'mt-2 max-w-[80px] text-center text-[10px] font-medium leading-tight',
                step.status === 'current' ? 'text-teal-700' : 'text-slate-500',
              )}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={cn(
                'mx-2 h-0.5 w-8 shrink-0',
                step.status === 'complete' ? 'bg-teal-600' : 'bg-slate-200',
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
