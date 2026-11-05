-- CreateTable
CREATE TABLE "WebSearchCache" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebSearchCache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WebSearchCache_cacheKey_key" ON "WebSearchCache"("cacheKey");

-- CreateIndex
CREATE INDEX "WebSearchCache_expiresAt_idx" ON "WebSearchCache"("expiresAt");

-- CreateIndex
CREATE INDEX "WebSearchCache_source_idx" ON "WebSearchCache"("source");
