-- Historique des tentatives de routage (score et violations)
CREATE TABLE "pcb_routing_attempts" (
    "id"         TEXT NOT NULL,
    "projectId"  TEXT NOT NULL,
    "score"      INTEGER,
    "tracks"     INTEGER NOT NULL DEFAULT 0,
    "violations" INTEGER NOT NULL DEFAULT 0,
    "placement"  INTEGER NOT NULL DEFAULT 0,
    "routing"    INTEGER NOT NULL DEFAULT 0,
    "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pcb_routing_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "pcb_routing_attempts_projectId_idx" ON "pcb_routing_attempts"("projectId");
