import { prisma } from '@/lib/prisma';
import type {
  Request,
  User,
  ReverseEngineeringProject,
  RequestStatus,
  UrgencyLevel,
} from '@/generated/prisma/client';

export type RequestWithRelations = Request & {
  client: User | null;
  projects: ReverseEngineeringProject[];
};

export async function getRequests(options?: {
  status?: string;
  clientId?: string;
  urgency?: string;
  limit?: number;
}): Promise<RequestWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as RequestStatus;
  }

  if (options?.clientId) {
    where.clientId = options.clientId;
  }

  if (options?.urgency) {
    where.urgency = options.urgency.toUpperCase() as UrgencyLevel;
  }

  return prisma.request.findMany({
    where,
    include: {
      client: true,
      projects: true,
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit ? { take: options.limit } : {}),
  });
}

export async function getRequestById(id: string): Promise<RequestWithRelations | null> {
  return prisma.request.findUnique({
    where: { id },
    include: {
      client: true,
      projects: true,
    },
  });
}

export async function getRequestsCount(options?: { status?: string }): Promise<number> {
  const where = options?.status
    ? { status: options.status.toUpperCase() as RequestStatus }
    : undefined;
  return prisma.request.count({ where });
}
