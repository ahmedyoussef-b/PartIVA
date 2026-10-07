import { prisma } from '@/lib/prisma';
import type { Material } from '@/generated/prisma/client';

export type MaterialWithDetails = Material;

export async function getMaterials(options?: {
  category?: string;
  foodGrade?: boolean;
}): Promise<MaterialWithDetails[]> {
  const where: Record<string, unknown> = {};

  if (options?.category) {
    where.category = options.category;
  }

  if (options?.foodGrade !== undefined) {
    where.foodGrade = options.foodGrade;
  }

  return prisma.material.findMany({
    where,
    orderBy: { name: 'asc' },
  });
}

export async function getMaterialBySlug(slug: string): Promise<MaterialWithDetails | null> {
  return prisma.material.findUnique({
    where: { slug },
  });
}

export async function getMaterialById(id: string): Promise<MaterialWithDetails | null> {
  return prisma.material.findUnique({
    where: { id },
  });
}
