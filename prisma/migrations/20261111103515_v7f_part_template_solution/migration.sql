-- CreateTable
CREATE TABLE "part_templates" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" TEXT,
    "material" TEXT,
    "dimensions" JSONB,
    "cadParams" JSONB,
    "analysisData" JSONB,
    "printableModelUrl" TEXT,
    "sourceMethod" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "part_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solutions" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "partTemplateId" TEXT,
    "method" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION,
    "validatedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "part_templates_name_idx" ON "part_templates"("name");

-- CreateIndex
CREATE INDEX "part_templates_categoryId_idx" ON "part_templates"("categoryId");

-- CreateIndex
CREATE INDEX "part_templates_sourceMethod_idx" ON "part_templates"("sourceMethod");

-- CreateIndex
CREATE INDEX "solutions_requestId_idx" ON "solutions"("requestId");

-- CreateIndex
CREATE INDEX "solutions_partTemplateId_idx" ON "solutions"("partTemplateId");

-- CreateIndex
CREATE INDEX "solutions_method_idx" ON "solutions"("method");

-- AddForeignKey
ALTER TABLE "part_templates" ADD CONSTRAINT "part_templates_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "part_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_partTemplateId_fkey" FOREIGN KEY ("partTemplateId") REFERENCES "part_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
