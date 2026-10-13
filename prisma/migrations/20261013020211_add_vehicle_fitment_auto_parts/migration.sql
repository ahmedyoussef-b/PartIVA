/*
 * E6-S07 — Modèle Prisma + migration auto-parts (fitment)
 *
 * Ajoute :
 *   - table `vehicles` (Vehicle : make, model, year, engine, ktype, vin)
 *   - table `fitments` (Fitment : partId, vehicleId, notes, @@unique([partId, vehicleId]))
 *   - colonnes `parts.material` et `parts.autoCategory` (optionnelles, rétro-compatibles)
 *
 * R.4.1-ter (drift GIN/HNSW) : migration créée manuellement via `prisma migrate diff`
 * puis appliquée via `prisma migrate resolve --applied`. Le `DROP INDEX
 * "part_images_embedding_hnsw"` généré par le diff (drift HNSW structurel, D-hnsw-drift)
 * est volontairement EXCLU — Prisma ne modélise pas les index HNSW sur colonnes
 * `Unsupported("vector(768)")` ; l'index existe en DB et doit être préservé.
 *
 * Le drift GIN sur `parts.search_vector` (index créé en SQL brut par la migration
 * `20261010002927_add_part_search_index`, non modélisé par Prisma) est également
 * pré-existant et non lié à cette migration.
 */

-- AlterTable
ALTER TABLE "parts" ADD COLUMN     "autoCategory" TEXT,
ADD COLUMN     "material" TEXT;

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "engine" TEXT,
    "ktype" TEXT,
    "vin" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fitments" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fitments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_ktype_key" ON "vehicles"("ktype");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vin_key" ON "vehicles"("vin");

-- CreateIndex
CREATE INDEX "vehicles_make_model_year_idx" ON "vehicles"("make", "model", "year");

-- CreateIndex
CREATE INDEX "vehicles_ktype_idx" ON "vehicles"("ktype");

-- CreateIndex
CREATE INDEX "fitments_partId_idx" ON "fitments"("partId");

-- CreateIndex
CREATE INDEX "fitments_vehicleId_idx" ON "fitments"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "fitments_partId_vehicleId_key" ON "fitments"("partId", "vehicleId");

-- AddForeignKey
ALTER TABLE "fitments" ADD CONSTRAINT "fitments_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fitments" ADD CONSTRAINT "fitments_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
