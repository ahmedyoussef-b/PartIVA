import { Prisma } from '@/generated/prisma/client';
import type { Part } from '@/generated/prisma/client';

const VERSIONED_FIELDS = ['status', 'ptvReference', 'partNumber', 'name', 'description'] as const;

export function extractSnapshot(part: Part): Prisma.InputJsonValue {
  const snapshot: Record<string, unknown> = {};
  for (const field of VERSIONED_FIELDS) {
    snapshot[field] = part[field];
  }
  return snapshot as Prisma.InputJsonValue;
}

export async function createPartVersion(
  tx: Prisma.TransactionClient,
  part: Part,
  actorId?: string,
  auditLogId?: string,
) {
  const last = await tx.partVersion.findFirst({
    where: { partId: part.id },
    orderBy: { versionNumber: 'desc' },
    select: { versionNumber: true },
  });

  const nextNumber = (last?.versionNumber ?? 0) + 1;

  return tx.partVersion.create({
    data: {
      partId: part.id,
      versionNumber: nextNumber,
      snapshot: extractSnapshot(part),
      auditLogId,
      createdById: actorId,
    },
  });
}
