-- Compteur de tokens LLM par jour UTC (coupe-circuit budgétaire partagé).
CREATE TABLE "llm_daily_usage" (
    "day" TEXT NOT NULL,
    "tokens" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "llm_daily_usage_pkey" PRIMARY KEY ("day")
);