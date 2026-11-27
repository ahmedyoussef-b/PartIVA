-- Première compilation IA du cahier des charges, conservée telle quelle.
-- `description` continue de recevoir le dernier texte validé (source de l'analyse).
ALTER TABLE "pcb_projects" ADD COLUMN IF NOT EXISTS "initialDescription" TEXT;
