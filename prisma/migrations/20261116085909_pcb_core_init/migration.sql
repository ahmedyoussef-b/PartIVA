-- CreateTable
CREATE TABLE "pcb_projects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_requirements" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_components" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "catalogId" TEXT,
    "symbol" TEXT,
    "footprint" TEXT,
    "model3d" TEXT,
    "properties" JSONB,
    "positionX" DOUBLE PRECISION,
    "positionY" DOUBLE PRECISION,
    "rotation" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_components_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_pins" (
    "id" TEXT NOT NULL,
    "componentId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_pins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_nets" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "pins" JSONB,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_nets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_proposals" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "requiresValidation" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "pcb_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_validations" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "report" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_validations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_checkpoints" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_checkpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_versions" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_component_catalog" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "footprint" TEXT NOT NULL,
    "model3d" TEXT,
    "supplier" TEXT,
    "supplierRef" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_component_catalog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_component_prices" (
    "id" TEXT NOT NULL,
    "catalogId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "supplier" TEXT,
    "stockStatus" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_component_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_requirement_forms" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "blocks" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_requirement_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pcb_requirement_answers" (
    "id" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "blockId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'proposed',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pcb_requirement_answers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "pcb_requirements_projectId_idx" ON "pcb_requirements"("projectId");

-- CreateIndex
CREATE INDEX "pcb_components_projectId_idx" ON "pcb_components"("projectId");

-- CreateIndex
CREATE INDEX "pcb_pins_componentId_idx" ON "pcb_pins"("componentId");

-- CreateIndex
CREATE INDEX "pcb_nets_projectId_idx" ON "pcb_nets"("projectId");

-- CreateIndex
CREATE INDEX "pcb_proposals_projectId_idx" ON "pcb_proposals"("projectId");

-- CreateIndex
CREATE INDEX "pcb_validations_projectId_idx" ON "pcb_validations"("projectId");

-- CreateIndex
CREATE INDEX "pcb_checkpoints_projectId_idx" ON "pcb_checkpoints"("projectId");

-- CreateIndex
CREATE INDEX "pcb_versions_projectId_idx" ON "pcb_versions"("projectId");

-- CreateIndex
CREATE INDEX "pcb_component_prices_catalogId_idx" ON "pcb_component_prices"("catalogId");

-- CreateIndex
CREATE INDEX "pcb_requirement_forms_projectId_idx" ON "pcb_requirement_forms"("projectId");

-- CreateIndex
CREATE INDEX "pcb_requirement_answers_formId_idx" ON "pcb_requirement_answers"("formId");

-- AddForeignKey
ALTER TABLE "pcb_requirements" ADD CONSTRAINT "pcb_requirements_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_components" ADD CONSTRAINT "pcb_components_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_pins" ADD CONSTRAINT "pcb_pins_componentId_fkey" FOREIGN KEY ("componentId") REFERENCES "pcb_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_nets" ADD CONSTRAINT "pcb_nets_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_proposals" ADD CONSTRAINT "pcb_proposals_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_validations" ADD CONSTRAINT "pcb_validations_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_checkpoints" ADD CONSTRAINT "pcb_checkpoints_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_versions" ADD CONSTRAINT "pcb_versions_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "pcb_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "pcb_component_prices" ADD CONSTRAINT "pcb_component_prices_catalogId_fkey" FOREIGN KEY ("catalogId") REFERENCES "pcb_component_catalog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
