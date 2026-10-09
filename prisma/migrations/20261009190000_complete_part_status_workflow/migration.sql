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
-- DROP DEFAULT avant le changement de type : PostgreSQL ne peut pas caster
-- automatiquement un DEFAULT d'un type enum vers un autre (erreur 42804
-- sur shadow DB / base vierge). Le DEFAULT est restauré après conversion.
ALTER TABLE "parts" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "parts" ALTER COLUMN "status" TYPE "PartStatus" USING (
  CASE "status"
    WHEN 'ACTIVE' THEN 'SUBMITTED'
    WHEN 'DEPRECATED' THEN 'CANCELLED'
    ELSE "status"::text
  END::"PartStatus"
);

ALTER TABLE "parts" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

-- Supprimer l'ancien type
DROP TYPE "PartStatus_old";
