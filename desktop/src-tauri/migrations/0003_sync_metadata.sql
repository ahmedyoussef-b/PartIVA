-- E8P-S03 — Table locale de suivi de synchronisation (NON synchronisée depuis le web)
-- Utilisée par le client sync (E8P-S05) : curseurs de pull incrémental et diagnostics

CREATE TABLE IF NOT EXISTS sync_metadata (
    table_name             TEXT PRIMARY KEY,
    last_sync_at           TEXT,
    last_sync_since        TEXT,
    row_count              INTEGER NOT NULL DEFAULT 0,
    full_refresh_required  INTEGER NOT NULL DEFAULT 0 CHECK (full_refresh_required IN (0, 1))
);

-- Tables full-refresh (Option B — D-E8P-S03-1) : pas d'updated_at côté web
INSERT OR IGNORE INTO sync_metadata (table_name, full_refresh_required) VALUES
    ('fitment', 1),
    ('part_image', 1),
    ('part_version', 1);

-- Tables incrémentales (updated_at présent côté web)
INSERT OR IGNORE INTO sync_metadata (table_name, full_refresh_required) VALUES
    ('part', 0),
    ('vehicle', 0);
