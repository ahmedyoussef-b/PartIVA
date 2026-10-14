-- E8P-S03 — Migration initiale BDD locale PartIVA (SQLite)
-- Miroir des tables web PostgreSQL Neon — LECTURE SEULE (sync unidirectionnelle web → local, D-E8P-S01-2)
-- Colonnes alignées sur prisma/schema.prisma (source de vérité web)
-- Horodatages stockés en TEXT ISO 8601 (format de sync web → local)
-- Conventions : snake_case SQLite, ids cuid() générés côté web (rejoués tels quels à la sync)

CREATE TABLE IF NOT EXISTS part (
    id             TEXT PRIMARY KEY,
    part_number    TEXT NOT NULL UNIQUE,
    ptv_reference  TEXT UNIQUE,
    name           TEXT NOT NULL,
    description    TEXT,
    status         TEXT NOT NULL DEFAULT 'DRAFT'
                   CHECK (status IN ('DRAFT','SUBMITTED','ON_HOLD','IDENTIFYING','IDENTIFIED','MEASURING','READY','ORDERED','DELIVERED','ARCHIVED','CANCELLED')),
    category_id    TEXT,
    client_id      TEXT,
    material       TEXT,
    auto_category  TEXT,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL
    -- search_vector (tsvector PostgreSQL, généré côté web) NON miroité :
    -- recherche plein texte locale à concevoir en E8P-S06+ (FTS5 SQLite)
);

CREATE INDEX IF NOT EXISTS idx_part_part_number ON part(part_number);
CREATE INDEX IF NOT EXISTS idx_part_status ON part(status);
CREATE INDEX IF NOT EXISTS idx_part_category_id ON part(category_id);
CREATE INDEX IF NOT EXISTS idx_part_client_id ON part(client_id);

CREATE TABLE IF NOT EXISTS vehicle (
    id          TEXT PRIMARY KEY,
    make        TEXT NOT NULL,
    model       TEXT NOT NULL,
    year        INTEGER NOT NULL,
    engine      TEXT,
    ktype       TEXT UNIQUE,
    vin         TEXT UNIQUE,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_vehicle_make_model_year ON vehicle(make, model, year);
CREATE INDEX IF NOT EXISTS idx_vehicle_ktype ON vehicle(ktype);

CREATE TABLE IF NOT EXISTS fitment (
    id          TEXT PRIMARY KEY,
    part_id     TEXT NOT NULL,
    vehicle_id  TEXT NOT NULL,
    notes       TEXT,
    created_at  TEXT NOT NULL
    -- PAS d'updated_at : colonne absente du schéma web (confirmé prisma/schema.prisma)
    -- → Option B (D-E8P-S03-1) : sync full-refresh sur cette table
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_fitment_part_vehicle ON fitment(part_id, vehicle_id);
CREATE INDEX IF NOT EXISTS idx_fitment_part ON fitment(part_id);
CREATE INDEX IF NOT EXISTS idx_fitment_vehicle ON fitment(vehicle_id);
