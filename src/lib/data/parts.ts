import { prisma } from '@/lib/prisma';
import { generatePtvReference } from '@/lib/ptv-reference';
import { Prisma } from '@/generated/prisma/client';
import type {
  Attachment,
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
  attachments: Attachment[];
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
  clientId?: string;
  limit?: number;
}): Promise<PartWithSerializedSuppliers[]> {
  const where: Record<string, unknown> = {};

  if (options?.status) {
    where.status = options.status.toUpperCase() as Part['status'];
  }

  if (options?.categoryId) {
    where.categoryId = options.categoryId;
  }

  if (options?.clientId) {
    where.clientId = options.clientId;
  }

  const raw = (await prisma.part.findMany({
    where,
    include: {
      category: true,
      images: { orderBy: { order: 'asc' } },
      specifications: true,
      attachments: { orderBy: { createdAt: 'asc' } },
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
      attachments: { orderBy: { createdAt: 'asc' } },
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

const PTV_RETRY_DELAYS_MS = [50, 100, 200];

export async function createPartWithPtvReference(
  data: Prisma.PartCreateInput,
  maxRetries = 3,
): Promise<Part> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const ptvReference = await generatePtvReference();

    try {
      return await prisma.part.create({
        data: { ...data, ptvReference },
      });
    } catch (error) {
      lastError = error;

      const isUniqueViolation =
        error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';

      if (!isUniqueViolation || attempt === maxRetries) {
        throw error;
      }

      const delay = PTV_RETRY_DELAYS_MS[attempt] ?? 200;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}
