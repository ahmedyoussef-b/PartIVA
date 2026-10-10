CREATE TABLE "scoring_weights" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL DEFAULT 'default',
  "text" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "reference" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "specs" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "dimensions" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "photo" DOUBLE PRECISION NOT NULL DEFAULT 0.2,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "scoring_weights_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "scoring_weights_name_key" ON "scoring_weights"("name");
