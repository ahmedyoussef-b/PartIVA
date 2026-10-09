import { prisma } from '@/lib/prisma';

/**
 * Génère une référence PTV unique au format PTV-AAAA-NNNNNN.
 * AAAA = année sur 4 chiffres (ex: 2026)
 * NNNNNN = séquence sur 6 chiffres, zéro-padded
 * @returns Référence PTV unique (ex: PTV-2026-000001)
 */
export async function generatePtvReference(): Promise<string> {
  const year = new Date().getFullYear();
  const prefix = `PTV-${year}-`;

  const lastPart = await prisma.part.findFirst({
    where: { ptvReference: { startsWith: prefix } },
    orderBy: { ptvReference: 'desc' },
    select: { ptvReference: true },
  });

  let nextSequence = 1;
  if (lastPart?.ptvReference) {
    const lastSeq = parseInt(lastPart.ptvReference.slice(prefix.length), 10);
    if (!isNaN(lastSeq)) nextSequence = lastSeq + 1;
  }

  return `${prefix}${String(nextSequence).padStart(6, '0')}`;
}
