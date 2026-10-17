-- Migration 0005 : table material (miroir local de Material, Prisma)
-- Pilote E9-R4a — domaine `material`
-- Miroir lecture seule web → local (sync unidirectionnelle D-E8P-S01-2).
-- Source : prisma/schema.prisma — Material (l.362-383).

CREATE TABLE IF NOT EXISTS material (
    id                     TEXT PRIMARY KEY,
    slug                   TEXT NOT NULL UNIQUE,
    code                   TEXT NOT NULL UNIQUE,
    name                   TEXT NOT NULL,
    category               TEXT NOT NULL,
    density                REAL,
    max_temp               INTEGER,
    tensile_strength       INTEGER,
    hardness               TEXT,
    friction_coefficient   REAL,
    resistance_chemical    TEXT,
    food_grade             INTEGER NOT NULL DEFAULT 0,
    description            TEXT,
    advantages             TEXT NOT NULL DEFAULT '[]',
    common_applications    TEXT NOT NULL DEFAULT '[]',
    created_at             TEXT NOT NULL,
    updated_at             TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_material_category ON material(category);
CREATE INDEX IF NOT EXISTS idx_material_slug ON material(slug);
CREATE INDEX IF NOT EXISTS idx_material_updated_at ON material(updated_at);
