-- E8P-S03 — Tables secondaires BDD locale (SQLite)
-- Miroir lecture seule des tables web PartImage / PartVersion
-- PartImage : embedding vector(768) NON synchronisé (D-E8P-S01-11 — différé)
-- PartImage / PartVersion : PAS d'updated_at côté web → Option B : full-refresh (D-E8P-S03-1)

CREATE TABLE IF NOT EXISTS part_image (
    id          TEXT PRIMARY KEY,
    part_id     TEXT NOT NULL,
    url         TEXT NOT NULL,
    public_id   TEXT,
    alt_text    TEXT,
    caption     TEXT,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    is_primary  INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
    created_at  TEXT NOT NULL,
    FOREIGN KEY (part_id) REFERENCES part(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_part_image_part ON part_image(part_id);

CREATE TABLE IF NOT EXISTS part_version (
    id              TEXT PRIMARY KEY,
    part_id         TEXT NOT NULL,
    version_number  INTEGER NOT NULL,
    snapshot        TEXT NOT NULL,
    audit_log_id    TEXT,
    created_by_id   TEXT,
    created_at      TEXT NOT NULL,
    FOREIGN KEY (part_id) REFERENCES part(id) ON DELETE CASCADE
    -- audit_log_id / created_by_id : colonnes webs conservées pour fidélité du miroir,
    -- SANS foreign key (tables AuditLog / User non synchronisées en V1)
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_version_part_number ON part_version(part_id, version_number);
CREATE INDEX IF NOT EXISTS idx_part_version_part ON part_version(part_id);
