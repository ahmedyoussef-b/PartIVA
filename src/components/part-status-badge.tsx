'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type PartStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'ON_HOLD'
  | 'IDENTIFYING'
  | 'IDENTIFIED'
  | 'MEASURING'
  | 'READY'
  | 'ORDERED'
  | 'DELIVERED'
  | 'ARCHIVED'
  | 'CANCELLED'
  | 'PENDING'
  | 'VALIDATED'
  | 'MACHINING'
  | 'COMPLETED'
  | 'DEPRECATED'
  | string;

export interface PartStatusBadgeProps {
  status: PartStatus;
  className?: string;
}

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumise',
  ON_HOLD: 'En attente',
  IDENTIFYING: 'Identification en cours',
  IDENTIFIED: 'Identifiée',
  MEASURING: 'Mesures en cours',
  READY: 'Prête',
  ORDERED: 'Commandée',
  DELIVERED: 'Livrée',
  ARCHIVED: 'Archivée',
  CANCELLED: 'Annulée',
  PENDING: 'En attente',
  VALIDATED: 'Validée',
  MACHINING: 'Usinage',
  COMPLETED: 'Terminée',
  DEPRECATED: 'Obsolète',
  // Minuscules / Aliases courants
  draft: 'Brouillon',
  submitted: 'Soumise',
  on_hold: 'En attente',
  identifying: 'Identification en cours',
  identified: 'Identifiée',
  measuring: 'Mesures en cours',
  ready: 'Prête',
  ordered: 'Commandée',
  delivered: 'Livrée',
  archived: 'Archivée',
  cancelled: 'Annulée',
  pending: 'En attente',
  validated: 'Validée',
  machining: 'Usinage',
  completed: 'Terminée',
  deprecated: 'Obsolète',
};

export function getPartStatusLabel(status: string): string {
  if (STATUS_LABELS[status]) {
    return STATUS_LABELS[status];
  }
  const upper = status.toUpperCase();
  if (STATUS_LABELS[upper]) {
    return STATUS_LABELS[upper];
  }
  return status.replace(/_/g, ' ');
}

function getStatusStyles(status: string): string {
  const normalized = status.toUpperCase();
  switch (normalized) {
    // Statuts terminés / succès
    case 'READY':
    case 'ORDERED':
    case 'DELIVERED':
    case 'VALIDATED':
    case 'COMPLETED':
      return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400';

    // Statuts en attente / alerte
    case 'PENDING':
    case 'ON_HOLD':
    case 'MEASURING':
    case 'DRAFT':
      return 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400';

    // Statuts destructifs / annulés / obsolètes
    case 'CANCELLED':
    case 'DEPRECATED':
      return 'bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400';

    // Statuts archivés
    case 'ARCHIVED':
      return 'bg-gray-500/10 text-gray-600 border-gray-500/20 dark:text-gray-400';

    // Statuts actifs / neutres (Tech identity)
    case 'SUBMITTED':
    case 'IDENTIFYING':
    case 'IDENTIFIED':
    case 'MACHINING':
    default:
      return 'bg-tech-primary/10 text-tech-primary border-tech-primary/20';
  }
}

export function PartStatusBadge({ status, className }: PartStatusBadgeProps) {
  if (!status) return null;

  const label = getPartStatusLabel(status);
  const styles = getStatusStyles(status);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border px-2.5 py-0.5 font-sans text-xs font-medium tracking-wide uppercase transition-colors',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}
