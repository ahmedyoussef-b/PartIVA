-- CreateEnum
CREATE TYPE "MachineType" AS ENUM ('CNC', 'LATHE', 'PRINTER_3D');

-- CreateEnum
CREATE TYPE "MaterialCategory" AS ENUM ('THERMOSTABLE_TECHNIQUE', 'THERMOPLASTIQUE_RENFORCE', 'POLYMERE_TECHNIQUE_POINT', 'FLUOROPOLYMERE_HAUTE_TEMP', 'POLYOLEFINE_POLYVALENTE');

-- Normalize existing machine type values before enum cast
UPDATE "machines" SET "type" = 'PRINTER_3D' WHERE "type" = '3D_PRINTER';

-- Normalize existing material category values before enum cast
UPDATE "materials" SET "category" = 'THERMOSTABLE_TECHNIQUE' WHERE "category" = 'Thermostable technique';
UPDATE "materials" SET "category" = 'THERMOPLASTIQUE_RENFORCE' WHERE "category" = 'Thermoplastique renforcé';
UPDATE "materials" SET "category" = 'POLYMERE_TECHNIQUE_POINT' WHERE "category" = 'Polymère technique de pointe';
UPDATE "materials" SET "category" = 'FLUOROPOLYMERE_HAUTE_TEMP' WHERE "category" = 'Fluoropolymère haute température';
UPDATE "materials" SET "category" = 'POLYOLEFINE_POLYVALENTE' WHERE "category" = 'Polyoléfine polyvalente';

-- AlterTable
ALTER TABLE "machines" ALTER COLUMN "type" TYPE "MachineType" USING ("type"::"MachineType");

-- AlterTable
ALTER TABLE "materials" ALTER COLUMN "category" TYPE "MaterialCategory" USING ("category"::"MaterialCategory");
