-- AlterTable
ALTER TABLE "parts" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "ptvReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "parts_ptvReference_key" ON "parts"("ptvReference");

-- CreateIndex
CREATE INDEX "parts_clientId_idx" ON "parts"("clientId");

-- AddForeignKey
ALTER TABLE "parts" ADD CONSTRAINT "parts_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
