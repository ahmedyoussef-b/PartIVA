-- Cooldown LLM persistant (partagé entre instances serverless)
CREATE TABLE "llm_provider_cooldowns" (
    "provider" TEXT NOT NULL,
    "until" TIMESTAMP(3) NOT NULL,
    "reason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_provider_cooldowns_pkey" PRIMARY KEY ("provider")
);

CREATE INDEX "llm_provider_cooldowns_until_idx" ON "llm_provider_cooldowns"("until");

-- Cache LLM persistant L2 (partagé entre instances serverless)
CREATE TABLE "llm_cache_entries" (
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_cache_entries_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "llm_cache_entries_expiresAt_idx" ON "llm_cache_entries"("expiresAt");

-- Empreinte du CDC analysé : évite de relancer le LLM si le CDC n'a pas changé,
-- et force une nouvelle analyse dès qu'il change.
ALTER TABLE "pcb_projects" ADD COLUMN "cdcHash" TEXT;
