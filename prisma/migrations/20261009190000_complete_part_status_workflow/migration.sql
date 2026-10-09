-- AlterEnum: PartStatus workflow complet (D1 E1-S03)
-- Anciennes valeurs : DRAFT, ACTIVE, ARCHIVED, DEPRECATED
-- Nouvelles valeurs : DRAFT, SUBMITTED, ON_HOLD, IDENTIFYING, IDENTIFIED, MEASURING, READY, ORDERED, DELIVERED, ARCHIVED, CANCELLED

-- Mapping legacy : ACTIVE -> SUBMITTED (état actif le plus proche)
-- DEPRECATED -> CANCELLED (sortie de cycle)
-- ARCHIVED reste ARCHIVED (terminal)

-- Renommer l'ancien type
ALTER TYPE "PartStatus" RENAME TO "PartStatus_old";

-- Créer le nouveau type enum
CREATE TYPE "PartStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'ON_HOLD', 'IDENTIFYING', 'IDENTIFIED', 'MEASURING', 'READY', 'ORDERED', 'DELIVERED', 'ARCHIVED', 'CANCELLED');

-- Convertir la colonne vers le nouveau type avec mapping legacy
ALTER TABLE "parts" ALTER COLUMN "status" TYPE "PartStatus" USING (
  CASE "status"
    WHEN 'ACTIVE' THEN 'SUBMITTED'
    WHEN 'DEPRECATED' THEN 'CANCELLED'
    ELSE "status"::text
  END::"PartStatus"
);

-- Supprimer l'ancien type
DROP TYPE "PartStatus_old";
