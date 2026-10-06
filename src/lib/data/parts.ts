import { prisma } from '@/lib/prisma';
import type { Part, PartCategory, PartImage, PartSpecification, PartSupplier } from '@/generated/prisma/client';

export type PartWithRelations = Part & {
  category: PartCategory | null;
  images: PartImage[];
  specifications: PartSpecification[];
  suppliers: (PartSupplier & { supplier: { id: string; name: string; code: string } })[];
  material?: string;
  files?: {
    cad: string[];
    plans: string[];
    photos: string[];
  };
};

export async function getParts(options?: {
  status?: string;
  categoryId?: string;
  limit?: number;
}): Promise<PartWithRelations[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as Part['status'];
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  return prisma.part.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      specifications: true,
      suppliers: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
    ...(options?.limit ? { take: options.limit } : {}),
  }) as Promise<PartWithRelations[]>;
}

export async function getPartById(id: string): Promise<PartWithRelations | null> {
  return prisma.part.findUnique({
    where: { id },
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      specifications: true,
      suppliers: {
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              code: true,
            },
          },
        },
      },
    },
  }) as Promise<PartWithRelations | null>;
}

export async function getPartsCount(options?: { status?: string }): Promise<number> {
  const where = options?.status ? { status: options.status.toUpperCase() as Part['status'] } : undefined;
  return prisma.part.count({ where });
}
