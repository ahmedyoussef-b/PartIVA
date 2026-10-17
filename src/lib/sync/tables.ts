// E8P-S04 — Registre des tables synchronisables (web → local).
// Sync unidirectionnelle (D-E8P-S01-2) — pull uniquement (D-E8P-S01-8).
// Namespace dédié /api/desktop/sync/* (D-E8P-S01-12 = B) — isole le stub POST /api/sync (D48).
// Miroir local : desktop/src-tauri/migrations/0001 → 0004.

export type SyncTableDef = {
  /** Nom local (snake_case — table SQLite côté desktop) */
  name: string;
  /** Modèle Prisma correspondant (source web) */
  model: string;
  /** Sync incrémentale possible (colonne updatedAt côté web) — sinon full-refresh (D-E8P-S03-1) */
  incremental: boolean;
  /** Limite de lignes par page de pull (pagination via skip côté client) */
  pageSize: number;
};

export const SYNC_TABLES: readonly SyncTableDef[] = [
  { name: 'part', model: 'Part', incremental: true, pageSize: 500 },
  { name: 'vehicle', model: 'Vehicle', incremental: true, pageSize: 500 },
  { name: 'fitment', model: 'Fitment', incremental: false, pageSize: 500 },
  { name: 'part_image', model: 'PartImage', incremental: false, pageSize: 500 },
  { name: 'part_version', model: 'PartVersion', incremental: false, pageSize: 500 },
  { name: 'part_specification', model: 'PartSpecification', incremental: true, pageSize: 500 },
  { name: 'part_category', model: 'PartCategory', incremental: true, pageSize: 500 },
  { name: 'material', model: 'Material', incremental: true, pageSize: 500 },
  { name: 'request', model: 'Request', incremental: true, pageSize: 500 },
];

export function getSyncTable(name: string): SyncTableDef | undefined {
  return SYNC_TABLES.find((table) => table.name === name);
}
