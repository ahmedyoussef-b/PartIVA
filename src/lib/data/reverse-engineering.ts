import { prisma } from '@/lib/prisma';
import type { ReverseEngineeringProject, ReverseEngineeringStep, CadFile, Request, Part } from '@/generated/prisma/client';

export type REProjectWithRelations = ReverseEngineeringProject & {
  part: Part | null;
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
  requests: Request[];
  steps: ReverseEngineeringStep[];
  cadFiles: CadFile[];
};

export async function getReverseEngineeringProjects(options?: {
  status?: string;
  userId?: string;
  partId?: string;
}): Promise<REProjectWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as ReverseEngineeringProject['status'];
  }

  if (options?.userId) {
    where.userId = options.userId;
  }

  if (options?.partId) {
    where.partId = options.partId;
  }

  return prisma.reverseEngineeringProject.findMany({
    where,
    include: {
      part: true,
      user: { select: { id: true, name: true, email: true } },
      requests: true,
      steps: { orderBy: { order: 'asc' } },
      cadFiles: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getReverseEngineeringProjectById(id: string): Promise<REProjectWithRelations | null> {
  return prisma.reverseEngineeringProject.findUnique({
    where: { id },
    include: {
      part: true,
      user: { select: { id: true, name: true, email: true } },
      requests: true,
      steps: { orderBy: { order: 'asc' } },
      cadFiles: { orderBy: { createdAt: 'desc' } },
    },
  });
}

export async function getReverseEngineeringProjectsCount(options?: { status?: string }): Promise<number> {
  const where = options?.status
    ? { status: options.status.toUpperCase() as ReverseEngineeringProject['status'] }
    : undefined;
  return prisma.reverseEngineeringProject.count({ where });
}
