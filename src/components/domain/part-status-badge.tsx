'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PartStatusBadgeProps {
  status: 'draft' | 'validated' | 'deprecated' | string;
  className?: string;
}

export function PartStatusBadge({ status, className }: PartStatusBadgeProps) {
  switch (status) {
    case 'validated':
      return (
        <Badge variant="success" className={cn('capitalize', className)}>
          Validée
        </Badge>
      );
    case 'draft':
      return (
        <Badge variant="warning" className={cn('capitalize', className)}>
          Brouillon
        </Badge>
      );
    case 'deprecated':
      return (
        <Badge variant="destructive" className={cn('capitalize', className)}>
          Obsolète
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={cn('capitalize', className)}>
          {status}
        </Badge>
      );
  }
}
