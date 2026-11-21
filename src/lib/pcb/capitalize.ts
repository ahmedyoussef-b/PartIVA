// V36.1 — Capitalisation : fiche « projet accompli » stockée dans PcbCheckpoint.
// Aucune migration : la fiche vit dans `snapshot` (Json), label réservé 'accomplished'.
// Builder PUR ( testable sans I/O ) + chargeur/persistance I/O.

import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import type { Prisma } from '@/generated/prisma/client';

export const ACCOMPLISHED_LABEL = 'accomplished';

export const AccomplishedSnapshotSchema = z.object({
  kind: z.literal('accomplished-project'),
  version: z.literal(1),
  regime: z.enum(['internal', 'reference']),
  licence: z.string().nullable(),
  project: z.object({
    id: z.string(),
    name: z.string(),
    status: z.string(),
    kicadFilePath: z.string().nullable(),
  }),
  cdc: z.object({ requestId: z.string(), raw: z.string() }).nullable(),
  requirements: z.array(
    z.object({
      category: z.string(),
      key: z.string(),
      value: z.string(),
      status: z.string(),
    }),
  ),
  acceptedProposals: z.array(
    z.object({
      id: z.string(),
      action: z.string(),
      target: z.string(),
      payload: z.unknown(),
      reason: z.string().nullable(),
      resolvedAt: z.string().nullable(),
    }),
  ),
  components: z.array(
    z.object({
      reference: z.string(),
      name: z.string(),
      catalogId: z.string().nullable(),
      symbol: z.string().nullable(),
      footprint: z.string().nullable(),
      positionX: z.number().nullable(),
      positionY: z.number().nullable(),
      rotation: z.number().nullable(),
      status: z.string(),
    }),
  ),
  nets: z.array(z.unknown()),
  createdAt: z.string(),
});

export type AccomplishedSnapshot = z.infer<typeof AccomplishedSnapshotSchema>;

export interface SnapshotInput {
  project: { id: string; name: string; status: string; kicadFilePath: string | null };
  cdc: { requestId: string; raw: string } | null;
  requirements: Array<{ category: string; key: string; value: string; status: string }>;
  acceptedProposals: Array<{
    id: string;
    action: string;
    target: string;
    payload: unknown;
    reason: string | null;
    resolvedAt: Date | null;
  }>;
  components: Array<{
    reference: string;
    name: string;
    catalogId: string | null;
    symbol: string | null;
    footprint: string | null;
    positionX: number | null;
    positionY: number | null;
    rotation: number | null;
    status: string;
  }>;
  nets: unknown[];
  now?: Date;
}

function isoOrNull(value: Date | null | undefined): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function buildAccomplishedSnapshot(
  input: SnapshotInput,
  options?: { regime?: 'internal' | 'reference'; licence?: string | null },
): AccomplishedSnapshot {
  const snapshot = {
    kind: 'accomplished-project' as const,
    version: 1 as const,
    regime: options?.regime ?? 'internal',
    licence: options?.licence ?? null,
    project: input.project,
    cdc: input.cdc,
    requirements: input.requirements,
    acceptedProposals: input.acceptedProposals.map((p) => ({
      id: p.id,
      action: p.action,
      target: p.target,
      payload: p.payload,
      reason: p.reason,
      resolvedAt: isoOrNull(p.resolvedAt),
    })),
    components: input.components,
    nets: input.nets,
    createdAt: (input.now ?? new Date()).toISOString(),
  };

  return AccomplishedSnapshotSchema.parse(snapshot);
}

export async function loadSnapshotInput(projectId: string): Promise<SnapshotInput | null> {
  const project = await prisma.pcbProject.findUnique({
    where: { id: projectId },
    select: {
      id: true,
      name: true,
      status: true,
      kicadFilePath: true,
      requestId: true,
      requirements: true,
      components: true,
      nets: true,
    },
  });

  if (!project) return null;

  // requestId est un scalaire (pas de @relation) : requête séparée.
  let cdc: SnapshotInput['cdc'] = null;
  if (project.requestId) {
    const request = await prisma.request.findUnique({
      where: { id: project.requestId },
      select: { id: true, partDescription: true },
    });
    if (request) {
      cdc = { requestId: request.id, raw: request.partDescription };
    }
  }

  const acceptedProposals = await prisma.pcbProposal.findMany({
    where: { projectId, status: 'accepted' },
    orderBy: { resolvedAt: 'asc' },
  });

  return {
    project: {
      id: project.id,
      name: project.name,
      status: project.status,
      kicadFilePath: project.kicadFilePath,
    },
    cdc,
    requirements: project.requirements.map((r) => ({
      category: r.category,
      key: r.key,
      value: r.value,
      status: r.status,
    })),
    acceptedProposals: acceptedProposals.map((p) => ({
      id: p.id,
      action: p.action,
      target: p.target,
      payload: p.payload,
      reason: p.reason,
      resolvedAt: p.resolvedAt,
    })),
    components: project.components.map((c) => ({
      reference: c.reference,
      name: c.name,
      catalogId: c.catalogId,
      symbol: c.symbol,
      footprint: c.footprint,
      positionX: c.positionX,
      positionY: c.positionY,
      rotation: c.rotation,
      status: c.status,
    })),
    nets: project.nets,
  };
}

export async function saveAccomplishedSnapshot(
  projectId: string,
  options?: { regime?: 'internal' | 'reference'; licence?: string | null },
): Promise<{ checkpointId: string; snapshot: AccomplishedSnapshot } | null> {
  const input = await loadSnapshotInput(projectId);
  if (!input) return null;

  const snapshot = buildAccomplishedSnapshot(input, options);

  await prisma.pcbCheckpoint.deleteMany({ where: { projectId, label: ACCOMPLISHED_LABEL } });

  const checkpoint = await prisma.pcbCheckpoint.create({
    data: {
      projectId,
      label: ACCOMPLISHED_LABEL,
      snapshot: snapshot as unknown as Prisma.InputJsonValue,
    },
  });

  console.info('[PCB:CAPITALIZE]', { projectId, regime: snapshot.regime });

  return { checkpointId: checkpoint.id, snapshot };
}
