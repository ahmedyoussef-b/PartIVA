'use client'

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { ArrowLeft, ArrowRight } from 'lucide-react'

interface PageHeaderProps {
  title: string
  description?: string
  badge?: {
    label: string
    variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'
  }
  actions?: {
    label: string
    onClick?: () => void
    href?: string
    variant?: 'default' | 'outline' | 'ghost'
    icon?: React.ReactNode
  }[]
  backHref?: string
  onBack?: () => void
  children?: React.ReactNode
  className?: string
}

export function PageHeader({
  title,
  description,
  badge,
  actions = [],
  backHref,
  onBack,
  children,
  className,
}: PageHeaderProps) {
  const BackButton = backHref || onBack ? (
    <Button
      variant="ghost"
      size="sm"
      onClick={onBack}
      asChild={!!backHref}
      className="h-8 -ml-2"
    >
      {backHref ? (
        <a href={backHref}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </a>
      ) : (
        <>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Retour
        </>
      )}
    </Button>
  ) : null

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {BackButton}
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            {badge && (
              <Badge variant={badge.variant || 'secondary'}>{badge.label}</Badge>
            )}
          </div>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        
        {(actions.length > 0 || children) && (
          <div className="flex items-center gap-2 shrink-0">
            {actions.map((action, idx) => (
              <Button
                key={idx}
                variant={action.variant || 'default'}
                size="sm"
                onClick={action.onClick}
                asChild={!!action.href}
                className="h-8"
              >
                {action.href ? (
                  <a href={action.href}>
                    {action.icon}
                    {action.label}
                  </a>
                ) : (
                  <>
                    {action.icon}
                    {action.label}
                  </>
                )}
              </Button>
            ))}
            {children}
          </div>
        )}
      </div>
    </div>
  )
}
