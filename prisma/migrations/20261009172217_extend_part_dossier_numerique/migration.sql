/*
  Warnings:

  - Added the required column `mimeType` to the `attachments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AttachmentKind" AS ENUM ('DOCUMENT', 'CAD', 'SCAN', 'OTHER');

-- AlterTable
ALTER TABLE "attachments" ADD COLUMN     "kind" "AttachmentKind" NOT NULL DEFAULT 'DOCUMENT',
ADD COLUMN     "mimeType" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "part_images" ADD COLUMN     "caption" TEXT,
ADD COLUMN     "isPrimary" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "part_specifications" ADD COLUMN     "toleranceMax" DOUBLE PRECISION,
ADD COLUMN     "toleranceMin" DOUBLE PRECISION;
