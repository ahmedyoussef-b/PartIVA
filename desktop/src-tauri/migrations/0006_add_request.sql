-- Migration 0006 : table request (miroir local de Request, Prisma)
-- Pilote E9-R4b-1 — domaine `request`

CREATE TABLE IF NOT EXISTS request (
    id                  TEXT PRIMARY KEY,
    client_id           TEXT,
    machine_ref         TEXT,
    part_description    TEXT NOT NULL,
    part_function       TEXT,
    suspected_material  TEXT,
    quantity            INTEGER NOT NULL DEFAULT 1,
    urgency             TEXT NOT NULL DEFAULT 'MEDIUM',
    status              TEXT NOT NULL DEFAULT 'PENDING',
    photos              TEXT,
    created_at          TEXT NOT NULL,
    updated_at          TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_request_status ON request(status);
CREATE INDEX IF NOT EXISTS idx_request_client_id ON request(client_id);
CREATE INDEX IF NOT EXISTS idx_request_urgency ON request(urgency);
CREATE INDEX IF NOT EXISTS idx_request_updated_at ON request(updated_at);
