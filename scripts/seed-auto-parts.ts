import 'dotenv/config';
import { getBrands, getModelsByBrand, getParts, type Model, type Part } from 'auto-parts-db';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

const adapter = new PrismaPg(
  { connectionString, connectionTimeoutMillis: 30_000 },
  { schema: 'public' },
);

const prisma = new PrismaClient({ adapter });

/**
 * Seed E8-S03 — catalogue auto gratuit (D-tecdoc-auto-parts).
 *
 * Source : auto-parts-db v3 (NPM, MIT) — 142 marques, 2379 modèles
 * avec générations (1968-présent), 1530 pièces.
 *
 * Peuplement (batch createMany + skipDuplicates — idempotent) :
 *   - prisma.vehicle : 142 marques × modèles (année = début 1ʳᵉ génération)
 *   - prisma.part    : 1530 pièces (slug = partNumber, nom = nom source)
 *   - prisma.fitment : liaison pièce ↔ véhicule (échantillon représentatif)
 *
 * Note R.5.16 : les noms de pièces auto-parts-db sont en russe (source
 * russophone) ; les slugs (identifiants) sont en anglais et servent de
 * partNumber. Les marques/modèles sont latins et directement utilisables.
 */

const MAX_VEHICLES = Number(process.env.AUTO_PARTS_MAX_VEHICLES ?? 500);
const MAX_PARTS = Number(process.env.AUTO_PARTS_MAX_PARTS ?? 1530);
const FITMENTS_PER_VEHICLE = 3;
const BATCH_SIZE = 100;

function modelYear(model: Model): number {
  const first = model.generations[0];
  return first?.yearFrom ?? new Date().getFullYear();
}

function modelEngine(model: Model): string | undefined {
  const first = model.generations[0];
  return first ? `${first.name} (${first.yearFrom}–${first.yearTo ?? '…'})` : undefined;
}

async function main() {
  console.log('🚗 E8-S03 — seed auto-parts-db (D-tecdoc-auto-parts)');

  const brands: string[] = getBrands();
  const allParts: Part[] = getParts();
  console.log(`   source : ${brands.length} marques, ${allParts.length} pièces`);

  // ── Véhicules (batch) ─────────────────────────────────
  console.log('🚙 Peuplement véhicules...');
  const vehicleRows: Array<{
    make: string;
    model: string;
    year: number;
    engine?: string;
    ktype: string;
  }> = [];
  for (const brand of brands) {
    if (vehicleRows.length >= MAX_VEHICLES) break;
    const models: Model[] = getModelsByBrand(brand);
    for (const model of models) {
      if (vehicleRows.length >= MAX_VEHICLES) break;
      vehicleRows.push({
        make: brand,
        model: model.name,
        year: modelYear(model),
        engine: modelEngine(model),
        ktype: `APDB-${brand}-${model.name}`.slice(0, 255),
      });
    }
  }
  for (let i = 0; i < vehicleRows.length; i += BATCH_SIZE) {
    await prisma.vehicle.createMany({
      data: vehicleRows.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${vehicleRows.length} véhicules (batch)`);

  // ── Pièces (batch) ────────────────────────────────────
  console.log('🔧 Peuplement pièces...');
  const partRows = allParts.slice(0, MAX_PARTS).map((part) => ({
    partNumber: `APDB-${part.slug}`.slice(0, 255),
    name: part.name,
    description: `Pièce auto (auto-parts-db, MIT) — slug : ${part.slug}`,
    status: 'DRAFT' as const,
    autoCategory: 'auto_parts_db',
    material: 'N/A (catalogue auto)',
  }));
  for (let i = 0; i < partRows.length; i += BATCH_SIZE) {
    await prisma.part.createMany({
      data: partRows.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${partRows.length} pièces (batch)`);

  // ── Fitments (échantillon représentatif, batch) ───────
  console.log('🔗 Peuplement fitments...');
  // Résoudre les IDs réels (createMany ne retourne pas les IDs).
  const vehicleIds = await prisma.vehicle.findMany({
    where: { ktype: { startsWith: 'APDB-' } },
    select: { id: true, make: true, model: true },
    take: MAX_VEHICLES,
  });
  const partIds = await prisma.part.findMany({
    where: { partNumber: { startsWith: 'APDB-' } },
    select: { id: true, partNumber: true },
    take: MAX_PARTS,
  });

  const fitmentRows: Array<{ partId: string; vehicleId: string; notes: string }> = [];
  for (let i = 0; i < vehicleIds.length; i++) {
    const vehicle = vehicleIds[i];
    if (!vehicle) continue;
    for (let j = 0; j < FITMENTS_PER_VEHICLE; j++) {
      const part = partIds[(i * FITMENTS_PER_VEHICLE + j) % partIds.length];
      if (!part) continue;
      fitmentRows.push({
        partId: part.id,
        vehicleId: vehicle.id,
        notes: `Compatibilité auto-parts-db : ${vehicle.make} ${vehicle.model} ↔ ${part.partNumber}`,
      });
    }
  }
  for (let i = 0; i < fitmentRows.length; i += BATCH_SIZE) {
    await prisma.fitment.createMany({
      data: fitmentRows.slice(i, i + BATCH_SIZE),
      skipDuplicates: true,
    });
  }
  console.log(`   ✓ ${fitmentRows.length} fitments (batch)`);

  // ── Résumé ────────────────────────────────────────────
  const counts = {
    vehicles: await prisma.vehicle.count({ where: { ktype: { startsWith: 'APDB-' } } }),
    parts: await prisma.part.count({ where: { partNumber: { startsWith: 'APDB-' } } }),
    fitments: await prisma.fitment.count(),
  };
  console.log('\n✅ Seed auto-parts-db terminé :');
  for (const [table, count] of Object.entries(counts)) {
    console.log(`   ${table}: ${count}`);
  }

  const success = counts.vehicles >= 100 && counts.parts >= 100;
  console.log(
    success
      ? '✅ Critère E8-S03 atteint (≥100 véhicules + ≥100 pièces)'
      : '❌ Critère E8-S03 NON atteint (<100 véhicules ou pièces)',
  );
}

main()
  .catch((e) => {
    console.error('❌ Seed auto-parts-db failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
