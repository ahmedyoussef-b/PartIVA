'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

const STEPS = [
  { id: 'new', label: 'Reçue' },
  { id: 'searching', label: 'Recherche' },
  { id: 'candidate_found', label: 'Candidat' },
  { id: 'reverse_engineering', label: 'Reverse CAO' },
  { id: 'validated', label: 'Validée' },
  { id: 'machining', label: 'Usinage' },
  { id: 'completed', label: 'Terminée' },
] as const

interface PipelineStepperProps {
  currentStep: string
  className?: string
}

export function PipelineStepper({ currentStep, className }: PipelineStepperProps) {
  const currentIdx = STEPS.findIndex((s) => s.id === currentStep)

  return (
    <div className={cn('flex items-center gap-2 overflow-x-auto py-2', className)}>
      {STEPS.map((step, idx) => {
        const done = currentIdx >= 0 && idx < currentIdx
        const active = idx === currentIdx

        return (
          <div key={step.id} className="flex items-center gap-2 shrink-0">
            <div
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                done && 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30',
                active && 'bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/20',
                !done && !active && 'bg-muted/60 text-muted-foreground border border-border/40'
              )}
            >
              {done ? (
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 stroke-[2.5]" />
              ) : (
                <span className="w-3.5 h-3.5 flex items-center justify-center font-mono text-[10px]">
                  {idx + 1}
                </span>
              )}
              <span>{step.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={cn(
                  'w-4 h-0.5 shrink-0 transition-colors',
                  done ? 'bg-emerald-500/50' : 'bg-border/60'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
