-- CreateTable
CREATE TABLE "part_versions" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "auditLogId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "part_versions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "part_versions_partId_idx" ON "part_versions"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "part_versions_partId_versionNumber_key" ON "part_versions"("partId", "versionNumber");

-- AddForeignKey
ALTER TABLE "part_versions" ADD CONSTRAINT "part_versions_partId_fkey" FOREIGN KEY ("partId") REFERENCES "parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_versions" ADD CONSTRAINT "part_versions_auditLogId_fkey" FOREIGN KEY ("auditLogId") REFERENCES "audit_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "part_versions" ADD CONSTRAINT "part_versions_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
