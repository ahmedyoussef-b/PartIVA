// Script helper E2E — crée une part SUBMITTED via Prisma et imprime
// { id, partNumber } en JSON sur stdout. Exécuté par la fixture
// ensureSubmittedPart via `npx tsx` (tsx résout les aliases @/* via
// tsconfig, contrairement au loader Playwright CJS).
//
// Usage : npx tsx e2e/fixtures/create-submitted-part.mts "<partNumber>" "<name>"
import { prisma } from '@/lib/prisma';

const [partNumber, name] = process.argv.slice(2);
if (!partNumber || !name) {
  console.error('Usage: tsx create-submitted-part.mts <partNumber> <name>');
  process.exit(1);
}

const part = await prisma.part.create({
  data: {
    partNumber,
    name,
    description: 'Part créée par fixture E2E (D-e2e-submitted-consumption)',
    status: 'SUBMITTED',
  },
});

// Version initiale (pattern seed prisma/seed.ts:462) — les tests
// part-versions vérifient versionNumber > 1 après transition,
// donc la part doit avoir une version 1 initiale.
await prisma.partVersion.create({
  data: {
    partId: part.id,
    versionNumber: 1,
    snapshot: {
      partNumber: part.partNumber,
      name: part.name,
      status: 'SUBMITTED',
    },
  },
});

console.log(JSON.stringify({ id: part.id, partNumber: part.partNumber }));
await prisma.$disconnect();
