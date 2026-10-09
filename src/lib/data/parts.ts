import { prisma } from '@/lib/prisma';
import type {
  Part,
  PartCategory,
  PartImage,
  PartSpecification,
  PartSupplier,
} from '@/generated/prisma/client';

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

export type PartWithSerializedSuppliers = Omit<PartWithRelations, 'suppliers'> & {
  suppliers: (Omit<PartSupplier, 'price'> & {
    price: string | null;
    supplier: { id: string; name: string; code: string };
  })[];
};

export async function getParts(options?: {
  status?: string;
  categoryId?: string;
  limit?: number;
}): Promise<PartWithSerializedSuppliers[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as Part['status'];
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  const raw = (await prisma.part.findMany({
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
  })) as PartWithRelations[];

  return raw.map((part) => ({
    ...part,
    suppliers: part.suppliers.map((s) => ({
      ...s,
      price: s.price ? s.price.toString() : null,
    })),
  }));
}

export async function getPartById(id: string): Promise<PartWithSerializedSuppliers | null> {
  const raw = (await prisma.part.findUnique({
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
  })) as PartWithRelations | null;

  if (!raw) {
    return null;
  }

  return {
    ...raw,
    suppliers: raw.suppliers.map((s) => ({
      ...s,
      price: s.price ? s.price.toString() : null,
    })),
  };
}

export async function getPartsCount(options?: { status?: string }): Promise<number> {
  const where = options?.status
    ? { status: options.status.toUpperCase() as Part['status'] }
    : undefined;
  return prisma.part.count({ where });
}
