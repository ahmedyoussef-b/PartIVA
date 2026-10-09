import { prisma } from '@/lib/prisma';
import { PART_STATUS_TRANSITIONS, PART_TRANSITION_ROLES } from '@/lib/part-status';
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

    // Vérifier la transition (D2) : la cible est-elle autorisée depuis l'état source ?
    const allowedTargets = PART_STATUS_TRANSITIONS[part.status] ?? [];
    if (!allowedTargets.includes(toStatus)) {
      throw new TransitionError(
        `Transition ${part.status} → ${toStatus} impossible`,
        'INVALID_TRANSITION',
      );
    }

    // Vérifier le rôle (D3) : l'acteur est-il autorisé pour cette transition ?
    const roles = PART_TRANSITION_ROLES[`${part.status}->${toStatus}`] ?? [];
    if (!roles.includes(actor.role)) {
      throw new TransitionError(
        `Transition ${part.status} → ${toStatus} non autorisée pour ${actor.role}`,
        'FORBIDDEN',
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
