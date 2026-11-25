-- Validations explicites des étapes du wizard PCB
CREATE TABLE "pcb_wizard_validations" (
    "id"          TEXT NOT NULL,
    "projectId"   TEXT NOT NULL,
    "step"        TEXT NOT NULL,
    "validatedBy" TEXT,
    "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_wizard_validations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "pcb_wizard_validations_projectId_step_key" ON "pcb_wizard_validations"("projectId", "step");
CREATE INDEX "pcb_wizard_validations_projectId_idx" ON "pcb_wizard_validations"("projectId");
