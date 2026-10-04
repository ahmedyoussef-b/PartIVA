'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface SimilarityScoreProps {
  score: number // 0..1
  label?: string
  showPercentage?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function SimilarityScore({
  score,
  label,
  showPercentage = true,
  size = 'md',
}: SimilarityScoreProps) {
  const pct = Math.min(100, Math.max(0, Math.round(score * 100)))
  const variant = pct >= 90 ? 'success' : pct >= 70 ? 'warning' : 'danger'
  const barColor = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
  }[variant]

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground">{label}</span>
          {showPercentage && (
            <span
              className={cn(
                'font-mono font-medium',
                pct >= 70 ? 'text-emerald-500 font-bold' : 'text-muted-foreground'
              )}
            >
              {pct}%
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'w-full bg-muted rounded-full overflow-hidden',
          size === 'sm' ? 'h-1.5' : size === 'md' ? 'h-2' : 'h-3'
        )}
      >
        <div
          className={cn('h-full transition-all duration-500 ease-out', barColor)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
