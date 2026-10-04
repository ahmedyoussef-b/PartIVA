'use client'

import * as React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface KPICardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'info'
  className?: string
}

const variantStyles = {
  default: 'border-border/60',
  success: 'border-emerald-500/30 bg-emerald-500/5',
  warning: 'border-amber-500/30 bg-amber-500/5',
  critical: 'border-rose-500/30 bg-rose-500/5',
  info: 'border-blue-500/30 bg-blue-500/5',
}

const valueStyles = {
  default: 'text-foreground',
  success: 'text-emerald-600 dark:text-emerald-400',
  warning: 'text-amber-600 dark:text-amber-400',
  critical: 'text-rose-600 dark:text-rose-400',
  info: 'text-blue-600 dark:text-blue-400',
}

export function KPICard({
  title,
  value,
  subtitle,
  icon,
  trend,
  variant = 'default',
  className,
}: KPICardProps) {
  return (
    <Card className={cn('rounded-xl', variantStyles[variant], className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              {title}
            </p>
            <p className={cn('text-2xl font-bold font-mono', valueStyles[variant])}>
              {value}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {trend && (
              <p className={cn(
                'text-xs font-medium',
                trend.value >= 0 ? 'text-emerald-600' : 'text-rose-600'
              )}>
                {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
              </p>
            )}
          </div>
          {icon && (
            <div className="p-2 rounded-lg bg-muted/50 text-muted-foreground">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
