'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

const STEPS = [
  { id: 'new', label: 'Reçue' },
  { id: 'searching', label: 'Recherche' },
  { id: 'candidate_found', label: 'Candidat' },
  { id: 'reverse_engineering', label: 'Reverse CAO' },
  { id: 'validated', label: 'Validée' },
  { id: 'machining', label: 'Usinage' },
  { id: 'completed', label: 'Terminée' },
] as const;

interface PipelineStepperProps {
  currentStep: string;
  className?: string;
}

export function PipelineStepper({ currentStep, className }: PipelineStepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep);

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto py-2', className)}>
      {STEPS.map((step, idx) => {
        const done = currentIdx >= 0 && idx < currentIdx;
        const active = idx === currentIdx;

        return (
          <div key={step.id} className="flex shrink-0 items-center gap-2">
            <div
              className={cn(
                'flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                done &&
                  'border border-emerald-500/30 bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
                active && 'bg-primary text-primary-foreground ring-primary/20 shadow-sm ring-2',
                !done && !active && 'border-border/40 bg-muted/60 text-muted-foreground border',
              )}
            >
              {done ? (
                <Check className="h-3.5 w-3.5 stroke-[2.5] text-emerald-600 dark:text-emerald-400" />
              ) : (
                <span className="flex h-3.5 w-3.5 items-center justify-center font-mono text-[10px]">
                  {idx + 1}
                </span>
              )}
              <span>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'h-0.5 w-4 shrink-0 transition-colors',
                  done ? 'bg-emerald-500/50' : 'bg-border/60',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
