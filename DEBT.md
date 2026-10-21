# DEBT — PartIVA

**Dernière mise à jour :** 2026-10-21
**Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
**Encodage :** UTF-8 sans BOM
**Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)

## Dettes actives

### Haute (0)

Aucune.

### Moyenne (2)

#### `D-E16-DASHBOARD-FETCH` — Fetch dashboard non optimisé

- **Statut :** Active
- **Priorité :** Moyenne
- **Session origine :** E16-R3
- **Cause :** Le tableau de bord admin refetch les données à chaque navigation sans mise en cache client — rechargements redondants et risque de flash de contenu vide.
- **Périmètre :** `src/app/admin/dashboard/**` (à confirmer selon implémentation réelle).
- **Effort estimé :** Moyen (1-2 sessions).
- **Bloquant :** Non.
- **Prochaine session :** Post-E16.

#### `D-E22-NEW-PART-ROUTE` — Route de création de pièce manquante

- **Statut :** Active
- **Priorité :** Moyenne
- **Session origine :** E22-R1
- **Cause :** Le bouton « Nouvelle pièce » redirige vers `/admin/pieces` car `/admin/pieces/nouveau` n'existe pas — aucun parcours de création de pièce n'est atteignable depuis l'UI admin.
- **Périmètre :** `src/app/admin/pieces/nouveau/page.tsx` (à créer), `src/app/admin/dashboard/dashboard-client.tsx` (CTA), `src/app/admin/pieces/pieces-client.tsx` (CTA inerte).
- **Effort estimé :** Moyen (1-2 sessions).
- **Bloquant :** Non.
- **Prochaine session :** Feature « CRUD Pièces ».

### Faible (2)

#### `D-E22-KPI-MOCK-DATA` — Données KPI factices

- **Statut :** Active
- **Priorité :** Faible
- **Session origine :** E22-R1
- **Cause :** Les KPI du dashboard utilisent des données en dur (`+ 2`, `+ 184 réf.`, `74.2%`) en attendant un endpoint d'agrégats — les compteurs affichés ne reflètent pas l'état réel de la base.
- **Périmètre :** `src/app/admin/dashboard/dashboard-client.tsx`, `src/app/api/dashboard/route.ts`.
- **Effort estimé :** Faible (1 session).
- **Bloquant :** Non.
- **Prochaine session :** Feature « Agrégats Dashboard ».

#### `D-E22-PART-STATUS-BADGE` — PartStatusBadge Server/Client mixte

- **Statut :** Active
- **Priorité :** Faible
- **Session origine :** E22-R1
- **Cause :** `PartStatusBadge` est un Server Component (pas de directive `'use client'`) qui rend `Badge`, un Client Component. Fonctionne, mais l'import de valeur `PartStatus` depuis `@/generated/prisma/browser` a été converti en `import type` pour éviter de tirer le namespace Prisma *browser* dans le bundle serveur — à surveiller.
- **Périmètre :** `src/components/part-status-badge.tsx` (le composant `src/components/domain/part-status-badge.tsx` est distinct et n'est pas concerné).
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Prochaine session :** À surveiller (E23+).





### Acceptée — facteur externe (1)

#### `D-E14-PRINT-ON-DEMAND` — Print-on-demand (Faible, accepté)

- **Statut :** Acceptée (facteur externe)
- **Priorité :** Faible
- **Session origine :** E14-R3
- **Cause :** Pas de partenariat avec un service d'impression professionnelle.
- **Périmètre :** `src/app/api/print-order/route.ts` (nouveau), intégration Stripe + partenaire.
- **Effort estimé :** Élevé (post-E17, nécessite partenariat externe).
- **Bloquant :** Non.
- **Prochaine session :** Quand partenariat disponible.


#### `D-E17-AUDIT-MATERIALS-API` — Routes /api/audit et /api/materials absentes (Faible)

- **Statut :** Clôturée E18-R1
- **Priorité :** Faible
- **Session origine :** E17-R4
- **Cause :** `getAuditLogs()` et `getMaterials()` appellent des routes inexistantes → même bug que `D-E16-DASHBOARD-FETCH` (HTML 404 → `SyntaxError` masqué par le `catch`).
- **Périmètre :** `src/app/api/audit/route.ts` (créé), `src/app/api/materials/route.ts` (créé), `src/lib/data-client.ts` (fallbacks renforcés).
- **Effort estimé :** Faible (même pattern que dashboard).
- **Bloquant :** Non.
- **Prochaine session :** N/A — clôturée.
- **Résolution :** Routes API créées avec `requireAdmin()`, mapping Prisma → contrat `AuditEntry`, gestion JSON 500. Getters client vérifient `res.ok` et `content-type`, retournent `[]` / `null` en cas d'échec.

### Reportée (0)

Aucune.

## Dettes clôturées

### E9 (2)

- **`D-E9-R6-2`** (sidecar non supporté) — ✅ Clôturée E9-R7 (abandon sidecar)
- **`D-E9-R7-2`** (4 pages desktop non converties) — ✅ Résolue E9-R8

### E10 (9)

- **`D-E9-R3a-2`** (ESLint non exécuté) — ✅ Clôturée E10-R1 (setState-in-effect, apostrophes, window.location corrigés)
- **`D-E9-R3a-3`** (bridge SQLite mocké) — ✅ Clôturée E10-R1 (aucun mock dans le code, bridge utilise invoke réel + fetch)
- **`D-E9-R3b-3`** (non-migration pages) — ✅ Fusionnée dans `D-E9-R7-1b` (redondance — même périmètre : 9 stubs)
- **`D-E9-R3b-bis-1`** (validation GUI reportée) — ✅ Clôturée E10-R2 (oubli documentaire historique, aucune dette technique résiduelle)
- **`D-E9-R3a-1`** (flash navigation) — ✅ Clôturée E10-R2b (5 transitions `router.push` → `window.location.href`, commit `f69d84d`)
- **`D-E9-R4b1-1`** (client non miroité) — ✅ Clôturée E10-R3 (obsolète — cause introuvable après 3 sessions, aucune trace code/JOURNAL/docs)
- **`D-E9-R4b1-2`** (photos TEXT JSON) — ✅ Clôturée E10-R3 (requalifiée — choix de conception assumé, `Json?` suffisant pour 10 photos <1 Mo, refactor coûteux non justifié)
- **`D-E9-R7-1`** (11 pages web-only) — ✅ Clôturée E10-R4a (obsolète — 11/11 fonctionnelles : 9 Server Components courts + 2 via `readFileSync`)
- **`D-E9-R7-1b`** (9 stubs web-only) — ✅ Clôturée E10-R4a (obsolète — 9/9 fonctionnelles : Server Components courts + Client Components lourds, pattern Next.js standard)

### E11 (1)

- **`D-E9-R5-1`** (validation fonctionnelle Vercel) — ✅ Clôturée E11-R1 (8/8 tests Playwright passés, commit `c8e40da`)

### E12 (6)

- **`D-E12-STATUS-ENUM`** (Zod `status` désynchronisé de `PartStatus`) — ✅ Clôturée E12-R1d (`z.enum(PART_STATUS_VALUES)` sur les 11 valeurs dans `schemas/search.ts` + `statusOrder` tri aligné dans `api/search/route.ts` + source unique `src/lib/search-constants.ts` — nécessaire au clic des facettes statut ; `VALIDATED` (faux statut) retiré)
- **`D-E12-MACHINE-FILTER`** (`machineId` non filtrable) — ✅ Clôturée E12-R2 (supprimée : `machineId` n'existe pas dans `Modèle Part`, aucune FK `Part` → `Machine` ; filtre `machineId` et facette `machines` retirés de la spec et de l'API — commit `649c2b6`)
- **`D-E12-SEED-E2E`** (Seed E2E nécessite la branche « dev ») — ✅ Clôturée E12-R1e (`prisma/seed.ts` branche prod étendue : 3 utilisateurs E2E `user@partiva.dev` / `viewer@partiva.dev` / `admin@partiva.dev` créés sans `ADMIN_EMAIL`/`ADMIN_PASSWORD` — commit `99a3ddc`)
- **`D-E12-LIMIT-100`** (`limit` max 50, spec 100) — ✅ Clôturée E12-R2 (`max(50)` → `max(100)` dans `MultiSearchQuerySchema` + `PartSearchQuerySchema` — commit `649c2b6`)
- **`D-E12-MINSCORE-MONO`** (`minScore` non applicable en mono-mode) — ✅ Clôturée E12-R2 (`minScore` appliqué en mode `multi` uniquement ; branches mono-mode `reference`/`specs`/`dimensions`/`text` l'ignorent — commit `649c2b6`)
- **`D-E12-FILTERS-MONO`** (Filtres non supportés en mono-mode) — ✅ Clôturée E12-R2 (Stratégie B confirmée : filtres `material`/`status`/dates appliqués en mode `multi` uniquement, documentés dans `docs/e12-advanced-search-spec.md` §6.1 — commit `649c2b6`)

### E13 (2)

- **`D-E12-NEWLINE`** — ✅ Clôturée E13-R1 (newline finale ajoutée à `CONTEXT.md`)
- **`D-E10-R2b-1`** — ✅ Clôturée E13-R1 (`sessionStorage` restauré dans `search-bar.tsx` : sauvegarde `{ query, mode }` au blur, restauration au montage)

### E14 (1)

- **`D-E13-3D-FEATURES`** — ✅ Clôturée E14-R3 (6 fonctionnalités : 3 traitées en E14-R1/R2/R4/R5, 3 reportées en `D-E14-3DCARPARTS-CONNECTOR`, `D-E14-STEP-VIEWER`, `D-E14-PRINT-ON-DEMAND`)

### E15 (1)

- **`D-E14-3DCARPARTS-CONNECTOR`** — ✅ Clôturée E15-R1 (connecteur mock + fixtures + tests E2E, commit `308cec8`)

### E16 (1)

- **`D-E14-STEP-VIEWER`** (viewer STEP/IGES) — ✅ Clôturée E16-R4 (`CadViewer` occt-import-js : STEP + IGES + BREP, `ModelViewer` auto-détection, fixtures reproductibles, E2E admin + public 2/2 ; commits `714a966` (R1), `2cc2dbc` (R3), `ab2601b` + `cad26d4` (R2), doc `docs/3d-format-support.md` (R4))

### E17 (2)

#### `D-E16-THREE-CLOCK` — ✅ Clôturée E17-R2 (obsolète)

- **Statut :** Clôturée
- **Cause :** Avertissement `THREE.Clock` déprécié venait de `@react-three/fiber` (interne), pas du code applicatif.
- **Vérification :** Aucun `THREE.Clock` / `requestAnimationFrame` / `useFrame` custom dans `src/` (0 occurrence) ; cleanups `useEffect` complets (worker `terminate()` + `clearTimeout` + flag `cancelled`) ; `OrbitControls` via drei (démontage React) ; render loop gérée nativement par fiber (teardown `cancelAnimationFrame` présent dans son bundle).
- **Nuances mineures (non bloquantes) :** `dispose={null}` sur `<primitive>` STL (mesh local jamais disposé explicitement — GC + destruction du contexte WebGL au démontage du Canvas suffisent) ; lumières/`AxesHelper` recréés à chaque render de `StlViewerCanvas` (allocation par render, re-renders rares).
- **Commit :** `6cf257e`

- **`D-E16-DASHBOARD-FETCH`** — ✅ Clôturée E17-R4 (route `/api/dashboard` créée, fallback `getDashboard()`, test E2E `dashboard.spec.ts` — à exécuter quand DB accessible)

### E18 (1)

#### `D-E17-AUDIT-MATERIALS-API` — ✅ Clôturée E18-R1 (routes `/api/audit` et `/api/materials` créées, fallbacks `getAuditLogs()`/`getMaterials()` renforcés)

- **Statut :** Clôturée E18-R1
- **Cause :** `getAuditLogs()` et `getMaterials()` appellent des routes inexistantes → même bug que `D-E16-DASHBOARD-FETCH` (HTML 404 → `SyntaxError` masqué par le `catch`).
- **Périmètre :** `src/app/api/audit/route.ts`, `src/app/api/materials/route.ts`, `src/lib/data-client.ts`.
- **Résolution :** Routes API créées avec `requireAdmin()`, mapping Prisma → contrat `AuditEntry`, gestion JSON 500. Getters client vérifient `res.ok` et `content-type`, retournent `[]` / `null` en cas d'échec.

### E19 (1)

#### `D-E18-MATERIAL-SLUG-GETTER` — ✅ Clôturée E19-R1 (getter client mort supprimé)

- **Statut :** Clôturée E19-R1
- **Cause :** `getMaterialBySlug()` dans `src/lib/data-client.ts` n'était importé nulle part côté web (getter mort). La page publique `[slug]` utilise la version serveur (`src/lib/data/materials.ts`).
- **Périmètre :** `src/lib/data-client.ts` (suppression du getter client).
- **Résolution :** Getter client supprimé. `getMaterialBySlug()` côté serveur conservé (utilisé par la page publique).
- **Commit :** E19-R2 (à venir)

### E21 (1)

#### `D-E16-IGES-ADMIN-E2E` — ✅ Résolue E21-R1 (blocage DB Neon levé)

- **Statut :** Résolue E21-R1
- **Cause :** Base de données Neon inaccessible dans l'environnement de test → authentification admin échouait → tests E2E admin (`e2e/admin/cad-viewer.spec.ts`) non exécutables.
- **Résolution :** Base de données Neon accessible (`prisma migrate status` up-to-date, 18 migrations), seed terminé (4 users, 13 parts, etc.), setup E2E auth réussi (3 rôles : ADMIN, USER, VIEWER), production Vercel fonctionnelle (dashboard admin chargé, login OK).
- **Périmètre :** `e2e/admin/cad-viewer.spec.ts` (2 tests IGES) désormais exécutables.
- **Commit :** E21-R1

## Notes

- **Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
- **Encodage :** UTF-8 sans BOM (standard git)
- **Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)
- **Redondance :** `D-E9-R3b-3` fusionnée dans `D-E9-R7-1b` (même périmètre : 9 stubs)
- **Prochaine session :** E10-R2b (`D-E9-R3a-1` : 5 edits)
- **Requalification E10-R3 :** `D-E9-R4b1-2` (photos TEXT JSON) n'est pas une dette technique mais un choix de conception. Refactor `Json?` → `Bytes?` = migration + 8 fichiers + rupture compat. Non justifié pour 10 photos <1 Mo.
- **Requalification E10-R4a :** `D-E9-R7-1`/`R7-1b` mal calibrées en E9-R7. Les 9 « stubs » (251–973 o) sont des Server Components courts déléguant à des Client Components lourds (11–36 Ko). Aucune page vide. Leçon : « petit fichier » ≠ « stub ».
- **Clôture E11 :** `D-E9-R5-1` validée (8/8 tests Playwright — 6 pages admin + login/register + healthcheck API). `D-E10-R2b-1` reste active (post-E11).
- **Fixture IGES :** `public/models/test.iges` est une copie de la fixture de référence `occt-import-js` (cube 10mm, LGPL-2.1). Licence : `public/models/license.occt-import-js.txt`. Script : `scripts/generate-test-iges.mjs` (copie depuis `node_modules/occt-import-js/test/`).
