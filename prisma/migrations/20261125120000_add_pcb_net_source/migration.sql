-- Provenance des nets : llm | heuristic | manual
ALTER TABLE "pcb_nets" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'llm';
