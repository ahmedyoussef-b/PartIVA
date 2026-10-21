# HISTORIQUE DES DETTES CLÔTURÉES — PartIVA

**Dernière mise à jour :** 2026-10-21
**Source :** Scission de `DEBT.md` (E3-S2)
**Statut :** Archive (lecture seule)

## Dettes clôturées

### E9 (2)

- **`D-E9-R6-2`** (sidecar non supporté) — ✅ Clôturée E9-R7 (abandon sidecar)
- **`D-E9-R7-2`** (4 pages desktop non converties) — ✅ Résolue E9-R8

### E10 (9)

- **`D-E9-R3a-2`** (ESLint non exécuté) — ✅ Clôturée E10-R1
- **`D-E9-R3a-3`** (bridge SQLite mocké) — ✅ Clôturée E10-R1
- **`D-E9-R3b-3`** (non-migration pages) — ✅ Fusionnée dans `D-E9-R7-1b`
- **`D-E9-R3b-bis-1`** (validation GUI reportée) — ✅ Clôturée E10-R2
- **`D-E9-R3a-1`** (flash navigation) — ✅ Clôturée E10-R2b (commit `f69d84d`)
- **`D-E9-R4b1-1`** (client non miroité) — ✅ Clôturée E10-R3
- **`D-E9-R4b1-2`** (photos TEXT JSON) — ✅ Clôturée E10-R3 (requalifiée)
- **`D-E9-R7-1`** (11 pages web-only) — ✅ Clôturée E10-R4a
- **`D-E9-R7-1b`** (9 stubs web-only) — ✅ Clôturée E10-R4a

### E11 (1)

- **`D-E9-R5-1`** (validation fonctionnelle Vercel) — ✅ Clôturée E11-R1

### E12 (6)

- **`D-E12-STATUS-ENUM`** — ✅ Clôturée E12-R1d
- **`D-E12-MACHINE-FILTER`** — ✅ Clôturée E12-R2
- **`D-E12-SEED-E2E`** — ✅ Clôturée E12-R1e
- **`D-E12-LIMIT-100`** — ✅ Clôturée E12-R2
- **`D-E12-MINSCORE-MONO`** — ✅ Clôturée E12-R2
- **`D-E12-FILTERS-MONO`** — ✅ Clôturée E12-R2

### E13 (2)

- **`D-E12-NEWLINE`** — ✅ Clôturée E13-R1
- **`D-E10-R2b-1`** — ✅ Clôturée E13-R1

### E14 (1)

- **`D-E13-3D-FEATURES`** — ✅ Clôturée E14-R3

### E15 (1)

- **`D-E14-3DCARPARTS-CONNECTOR`** — ✅ Clôturée E15-R1

### E16 (1)

- **`D-E14-STEP-VIEWER`** — ✅ Clôturée E16-R4

### E17 (2)

- **`D-E16-THREE-CLOCK`** — ✅ Clôturée E17-R2 (obsolète)
- **`D-E16-DASHBOARD-FETCH`** — ✅ Clôturée E17-R4 (route `/api/dashboard` + fallback)

### E18 (1)

- **`D-E17-AUDIT-MATERIALS-API`** — ✅ Clôturée E18-R1 (routes `/api/audit` et `/api/materials` créées, fallbacks renforcés)

### E19 (1)

- **`D-E18-MATERIAL-SLUG-GETTER`** — ✅ Clôturée E19-R2 (getter client mort supprimé)

### E21 (1)

- **`D-E16-IGES-ADMIN-E2E`** — ✅ Résolue E21-R1 (blocage DB Neon levé)

### E23 (1)

- **`D-E22-NEW-PART-ROUTE`** — ✅ Clôturée E23-R1 (page `/admin/pieces/nouveau` + formulaire `pieces-form.tsx`, POST `/api/parts` sécurisé par `requireAdmin()`, 17/17 tests manuels Playwright)

### E24 (1)

- **`D-E23-E2E-CREDENTIALS`** — ✅ Clôturée E24-R2 (seed aligné sur `ADMIN_PASSWORD`, `e2e/fixtures/users.ts` auto-suffisant, `dotenv` chargé par `playwright.config.ts`)

## Notes

- **Source :** Ce fichier est extrait de `DEBT.md` (E3-S2). Il conserve l'historique des dettes clôturées.
- **Mise à jour :** Ce fichier ne doit pas être modifié. Les nouvelles clôtures de dettes sont documentées dans les rapports de session et dans `DETTES.md` (section Notes).
- **Total :** 30 dettes clôturées (E9 → E24).
