import { prisma } from '@/lib/prisma';
import type { Machine, MachineStatus } from '@/generated/prisma/client';

export type MachineWithRelations = Machine;

export async function getMachines(options?: {
  status?: string;
  type?: string;
}): Promise<MachineWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as MachineStatus;
  }

  if (options?.type) {
    where.type = options.type;
  }

  return prisma.machine.findMany({
    where,
    orderBy: { createdAt: 'desc' },
  });
}

export async function getMachineById(id: string): Promise<MachineWithRelations | null> {
  return prisma.machine.findUnique({
    where: { id },
  });
}

export async function getMachinesCount(options?: { status?: string }): Promise<number> {
  const where = options?.status
    ? { status: options.status.toUpperCase() as MachineStatus }
    : undefined;
  return prisma.machine.count({ where });
}
