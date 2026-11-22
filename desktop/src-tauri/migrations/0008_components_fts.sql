-- Migration 0008 : recherche FTS5 sur le catalogue de composants (PCB)
-- Pilote desktop — domaine `components_fts`
-- Table FTS5 STANDALONE (pas external content : components.id est TEXT/cuid,
-- pas un rowid entier). L'index est reconstruit après chaque sync (A7.1-b).

CREATE VIRTUAL TABLE IF NOT EXISTS components_fts USING fts5(
    component_id UNINDEXED,
    mpn,
    manufacturer,
    description,
    category,
    package,
    footprint,
    symbol,
    tokenize = 'porter unicode61'
);

-- Index initial (vide si components est vide ; reconstruit en A7.1-b).
-- Pas de triggers : le miroir est read-only, l'index est reconstruit
-- après chaque sync (DELETE + INSERT ... SELECT).