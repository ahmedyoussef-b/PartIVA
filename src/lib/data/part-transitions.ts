import { prisma } from '@/lib/prisma';
import { isTransitionAllowed } from '@/lib/part-status';
import { PartStatus, Prisma, UserRole } from '@/generated/prisma/client';

export class TransitionError extends Error {
  constructor(
    message: string,
    public code: 'NOT_FOUND' | 'FORBIDDEN' | 'INVALID_TRANSITION' | 'NOT_OWNER',
  ) {
    super(message);
    this.name = 'TransitionError';
  }
}

export async function transitionPartStatus(
  partId: string,
  toStatus: PartStatus,
  actor: { id: string; role: UserRole },
  reason?: string,
) {
  return prisma.$transaction(async (tx) => {
    const part = await tx.part.findUnique({ where: { id: partId } });
    if (!part) throw new TransitionError('Part introuvable', 'NOT_FOUND');

    // Vérifier la propriété si USER (sécurité #5)
    if (actor.role === 'USER' && part.clientId !== actor.id) {
      throw new TransitionError('Pièce non détenue par cet utilisateur', 'NOT_OWNER');
    }

    // Vérifier la transition (D2 + D3)
    if (!isTransitionAllowed(part.status, toStatus, actor.role)) {
      throw new TransitionError(
        `Transition ${part.status} → ${toStatus} non autorisée pour ${actor.role}`,
        'INVALID_TRANSITION',
      );
    }

    const updated = await tx.part.update({
      where: { id: partId },
      data: { status: toStatus },
    });

    // AuditLog append-only (D4) — même transaction
    await tx.auditLog.create({
      data: {
        userId: actor.id,
        action: 'PART_STATUS_TRANSITION',
        entityType: 'Part',
        entityId: partId,
        metadata: {
          from: part.status,
          to: toStatus,
          reason: reason ?? null,
        } as Prisma.InputJsonValue,
      },
    });

    return updated;
  });
}
