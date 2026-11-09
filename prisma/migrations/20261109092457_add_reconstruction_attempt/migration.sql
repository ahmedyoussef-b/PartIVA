-- CreateTable
CREATE TABLE "reconstruction_attempts" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "metadata" JSONB,
    "files" JSONB,
    "decision" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reconstruction_attempts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reconstruction_attempts_requestId_idx" ON "reconstruction_attempts"("requestId");

-- AddForeignKey
ALTER TABLE "reconstruction_attempts" ADD CONSTRAINT "reconstruction_attempts_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;
