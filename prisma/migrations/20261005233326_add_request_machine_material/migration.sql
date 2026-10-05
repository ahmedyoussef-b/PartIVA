-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'REVIEW', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "MachineStatus" AS ENUM ('IDLE', 'RUNNING', 'MAINTENANCE', 'OFFLINE');

-- CreateTable
CREATE TABLE "requests" (
    "id" TEXT NOT NULL,
    "clientId" TEXT,
    "machineRef" TEXT,
    "partDescription" TEXT NOT NULL,
    "partFunction" TEXT,
    "suspectedMaterial" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'MEDIUM',
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "photos" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "machines" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" "MachineStatus" NOT NULL DEFAULT 'IDLE',
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "machines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "density" DOUBLE PRECISION,
    "maxTemp" INTEGER,
    "tensileStrength" INTEGER,
    "hardness" TEXT,
    "frictionCoefficient" DOUBLE PRECISION,
    "resistanceChemical" TEXT,
    "foodGrade" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "advantages" TEXT[],
    "commonApplications" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RequestToReverseEngineeringProject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_RequestToReverseEngineeringProject_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "requests_status_idx" ON "requests"("status");

-- CreateIndex
CREATE INDEX "requests_clientId_idx" ON "requests"("clientId");

-- CreateIndex
CREATE INDEX "requests_urgency_idx" ON "requests"("urgency");

-- CreateIndex
CREATE UNIQUE INDEX "machines_code_key" ON "machines"("code");

-- CreateIndex
CREATE INDEX "machines_status_idx" ON "machines"("status");

-- CreateIndex
CREATE UNIQUE INDEX "materials_slug_key" ON "materials"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "materials_code_key" ON "materials"("code");

-- CreateIndex
CREATE INDEX "materials_category_idx" ON "materials"("category");

-- CreateIndex
CREATE INDEX "_RequestToReverseEngineeringProject_B_index" ON "_RequestToReverseEngineeringProject"("B");

-- AddForeignKey
ALTER TABLE "requests" ADD CONSTRAINT "requests_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestToReverseEngineeringProject" ADD CONSTRAINT "_RequestToReverseEngineeringProject_A_fkey" FOREIGN KEY ("A") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RequestToReverseEngineeringProject" ADD CONSTRAINT "_RequestToReverseEngineeringProject_B_fkey" FOREIGN KEY ("B") REFERENCES "reverse_engineering_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
