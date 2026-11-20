-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('PIECE', 'PCB');

-- AlterTable
ALTER TABLE "pcb_projects" ADD COLUMN     "requestId" TEXT;

-- AlterTable
ALTER TABLE "requests" ADD COLUMN     "type" "RequestType" NOT NULL DEFAULT 'PIECE';

-- CreateIndex
CREATE INDEX "pcb_projects_requestId_idx" ON "pcb_projects"("requestId");
