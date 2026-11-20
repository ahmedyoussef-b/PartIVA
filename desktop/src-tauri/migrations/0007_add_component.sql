-- Migration 0007 : catalogue de composants (PCB)
-- Pilote desktop — domaine `components`
-- Miroir lecture seule web → local (sync unidirectionnelle D-E8P-S01-2).
-- Note : pas de table virtuelle components_vec ici (sqlite-vec = A7).

CREATE TABLE IF NOT EXISTS components (
    id            TEXT PRIMARY KEY,
    mpn           TEXT,
    manufacturer  TEXT,
    description   TEXT,
    category      TEXT,
    package       TEXT,
    footprint     TEXT,
    symbol        TEXT,
    electrical    TEXT,
    price         REAL,
    currency      TEXT,
    supplier      TEXT,
    supplier_ref  TEXT,
    stock         INTEGER,
    datasheet_url TEXT,
    lifecycle     TEXT,
    source        TEXT,
    licence       TEXT,
    created_at    TEXT NOT NULL,
    updated_at    TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_components_mpn          ON components(mpn);
CREATE INDEX IF NOT EXISTS idx_components_category     ON components(category);
CREATE INDEX IF NOT EXISTS idx_components_supplier     ON components(supplier);
CREATE INDEX IF NOT EXISTS idx_components_updated_at  ON components(updated_at);