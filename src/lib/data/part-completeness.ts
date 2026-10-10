import { prisma } from '@/lib/prisma';
import { REQUIRED_SPEC_KEYS } from '@/lib/part-required-specs';

export type PartCompleteness = {
  partId: string;
  score: number;
  total: number;
  present: number;
  missing: string[];
};

export async function getPartCompleteness(partId: string): Promise<PartCompleteness | null> {
  const part = await prisma.part.findUnique({
    where: { id: partId },
    select: { id: true },
  });
  if (!part) return null;

  const specifications = await prisma.partSpecification.findMany({
    where: { partId },
    select: { key: true },
  });

  const presentKeys = new Set(specifications.map((s) => s.key));
  const missing = REQUIRED_SPEC_KEYS.filter((key) => !presentKeys.has(key));
  const present = REQUIRED_SPEC_KEYS.length - missing.length;
  const score = present / REQUIRED_SPEC_KEYS.length;

  return {
    partId,
    score,
    total: REQUIRED_SPEC_KEYS.length,
    present,
    missing,
  };
}
