'use client';

import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from 'lucide-react';

export type KpiCardVariant = 'default' | 'warning' | 'success' | 'info';
export type KpiCardTrend = 'up' | 'down' | 'neutral';

interface KpiCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: KpiCardTrend;
  className?: string;
  variant?: KpiCardVariant;
}

/**
 * Conteneur des styles par variante.
 * Le type `Record<KpiCardVariant, string>` garantit qu'une nouvelle variante
 * ajoutée à l'union force son style ici (pas d'indexation implicite).
 */
const VARIANT_CLASSES: Record<KpiCardVariant, string> = {
  default: 'border-border bg-card text-card-foreground',
  warning:
    'border-orange-200 bg-orange-50/50 text-orange-900 dark:border-orange-500/30 dark:bg-orange-950/20 dark:text-orange-200',
  success:
    'border-emerald-200 bg-emerald-50/50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/20 dark:text-emerald-200',
  info: 'border-blue-200 bg-blue-50/50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/20 dark:text-blue-200',
};

const TREND_META: Record<KpiCardTrend, { icon: LucideIcon; className: string; label: string }> = {
  up: {
    icon: ArrowUpRight,
    className: 'text-emerald-600 dark:text-emerald-400',
    label: 'En hausse',
  },
  down: { icon: ArrowDownRight, className: 'text-red-600 dark:text-red-400', label: 'En baisse' },
  neutral: { icon: Minus, className: 'text-muted-foreground', label: 'Stable' },
};

export function KpiCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  className,
  variant = 'default',
}: KpiCardProps) {
  const trendMeta = trend ? TREND_META[trend] : null;
  const TrendIcon = trendMeta?.icon ?? null;

  return (
    <Card
      className={cn(
        'shadow-sm transition-shadow hover:shadow-md',
        VARIANT_CLASSES[variant],
        className,
      )}
    >
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-2">
          <p className="text-muted-foreground text-xs font-semibold tracking-tight uppercase">
            {title}
          </p>
          {Icon ? <Icon className="text-muted-foreground h-4 w-4 shrink-0" /> : null}
        </div>
        <div className="mt-3 flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold tracking-tight tabular-nums">{value}</span>
            {trendMeta && TrendIcon ? (
              <span
                className={cn('inline-flex items-center', trendMeta.className)}
                title={trendMeta.label}
                aria-label={trendMeta.label}
              >
                <TrendIcon className="h-4 w-4" />
              </span>
            ) : null}
          </div>
          {description ? <p className="text-muted-foreground text-xs">{description}</p> : null}
        </div>
      </CardContent>
    </Card>
  );
}
