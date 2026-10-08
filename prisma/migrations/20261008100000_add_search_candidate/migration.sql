-- CreateTable
CREATE TABLE "search_candidates" (
    "id" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "manufacturer" TEXT,
    "imageUrl" TEXT,
    "cadAvailable" BOOLEAN NOT NULL DEFAULT false,
    "datasheetAvailable" BOOLEAN NOT NULL DEFAULT false,
    "scores" JSONB NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_candidates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_candidates_source_idx" ON "search_candidates"("source");

-- CreateIndex
CREATE INDEX "search_candidates_reference_idx" ON "search_candidates"("reference");

-- CreateIndex
CREATE INDEX "search_candidates_createdAt_idx" ON "search_candidates"("createdAt");
