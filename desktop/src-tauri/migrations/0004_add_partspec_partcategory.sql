-- E8P-S04 — Migration 0004 : part_specification + part_category
-- Tables Must du cadrage §6.2 (modes recherche specs / multi), oubliées en E8P-S03.
-- Miroir lecture seule web → local (sync unidirectionnelle D-E8P-S01-2).
-- Sources : prisma/schema.prisma — PartSpecification (l.175-189), PartCategory (l.143-156).

CREATE TABLE IF NOT EXISTS part_category (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    slug        TEXT NOT NULL UNIQUE,
    description TEXT,
    parent_id   TEXT,
    created_at  TEXT NOT NULL,
    updated_at  TEXT NOT NULL,
    FOREIGN KEY (parent_id) REFERENCES part_category(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_part_category_parent ON part_category(parent_id);

CREATE TABLE IF NOT EXISTS part_specification (
    id             TEXT PRIMARY KEY,
    part_id        TEXT NOT NULL,
    key            TEXT NOT NULL,
    value          TEXT NOT NULL,
    unit           TEXT,
    tolerance_min  REAL,
    tolerance_max  REAL,
    created_at     TEXT NOT NULL,
    updated_at     TEXT NOT NULL,
    FOREIGN KEY (part_id) REFERENCES part(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_spec_part_key ON part_specification(part_id, key);
CREATE INDEX IF NOT EXISTS idx_part_spec_part ON part_specification(part_id);
