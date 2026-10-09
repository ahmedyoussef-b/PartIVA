import { PartStatus } from '@/generated/prisma/browser';
import { getPartStatusLabel } from '@/lib/enum-labels';
import { Badge } from '@/components/ui/badge';
import type { VariantProps } from 'class-variance-authority';
import { badgeVariants } from '@/components/ui/badge';

type BadgeVariant = NonNullable<VariantProps<typeof badgeVariants>['variant']>;

const STATUS_VARIANT: Record<PartStatus, BadgeVariant> = {
  DRAFT: 'outline',
  SUBMITTED: 'info',
  ON_HOLD: 'warning',
  IDENTIFYING: 'info',
  IDENTIFIED: 'info',
  MEASURING: 'warning',
  READY: 'success',
  ORDERED: 'success',
  DELIVERED: 'success',
  ARCHIVED: 'secondary',
  CANCELLED: 'destructive',
};

export function PartStatusBadge({ status }: { status: PartStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{getPartStatusLabel(status)}</Badge>;
}
