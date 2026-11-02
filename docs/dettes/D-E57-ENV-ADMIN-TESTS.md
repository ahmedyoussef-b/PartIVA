# D-E57 — Tests E2E admin E93/E94 (résolu par E101)

## Statut
Résolu — 2026-11-01 (E101).

## Cause racine (historique)
- `.auth/admin.json` corrompu (36 octets).
- `DATABASE_URL` pointait vers Neon non migré.
- BDD locale Tauri incompatible.

## Solution
- `.env.test` → Postgres local `partiva_test`.
- `playwright.config.ts` charge `.env.test` + `globalSetup`.
- `e2e/global-setup.ts` : garde-fou + `prisma migrate deploy` + `db:seed`.
- `storageState` régénéré via `--project=setup`.

## Résultat
- 4 tests E93/E94 passent.
- Non-régression workspace 15 passed / 2 skipped.
