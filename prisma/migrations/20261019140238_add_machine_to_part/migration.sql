-- DropIndex
DROP INDEX "part_images_embedding_hnsw";

-- AlterTable
ALTER TABLE "parts" ADD COLUMN     "machineId" TEXT;

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "machines"("id") ON DELETE SET NULL ON UPDATE CASCADE;
