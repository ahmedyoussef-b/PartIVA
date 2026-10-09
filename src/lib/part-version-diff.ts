import type { PartVersion } from '@/generated/prisma/browser';

const VERSIONED_FIELDS = ['status', 'ptvReference', 'partNumber', 'name', 'description'] as const;

export interface VersionDiff {
  field: string;
  before: unknown;
  after: unknown;
}

export function computeVersionDiff(
  from: Pick<PartVersion, 'snapshot'>,
  to: Pick<PartVersion, 'snapshot'>,
): VersionDiff[] {
  const diffs: VersionDiff[] = [];
  const fromSnap = (from.snapshot ?? {}) as Record<string, unknown>;
  const toSnap = (to.snapshot ?? {}) as Record<string, unknown>;

  for (const field of VERSIONED_FIELDS) {
    if (fromSnap[field] !== toSnap[field]) {
      diffs.push({ field, before: fromSnap[field], after: toSnap[field] });
    }
  }

  return diffs;
}
