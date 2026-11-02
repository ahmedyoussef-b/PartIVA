# E97-A — Audit des tests E2E du Workspace (D-E57)

## Section A — Infrastructure

- Framework : **Playwright** (`@playwright/test ^1.64.0`)
- Config : `F:\PartIVA\playwright.config.ts` (voir bloc ci-dessous)
- Scripts package.json : `"test:e2e": "playwright test"`, `"test:unit": "npx vitest run"`
- Dossier tests : `F:\PartIVA\e2e/` (racine) + sous-dossiers `admin/`, `public/`, `user/`, `viewer/`, `workspace/`, `fixtures/`, `setup/`
- Projet dédié : `workspace` → `testDir: './e2e/workspace'`, Chrome, retries 1, **sans storageState** (pas d'auth).

```ts
// playwright.config.ts (extrait pertinent)
projects: [
  { name: 'workspace', testDir: './e2e/workspace', use: { ...devices['Desktop Chrome'] }, retries: 1 },
],
webServer: { command: 'npm run build && npm run start', url: 'http://localhost:3000', ... }
```

## Section B — Inventaire des tests E2E

| Fichier | # tests | Résumé |
|---|---|---|
| `e2e/workspace/workspace.spec.ts` | 17 | Page `/workspace` (zones, analyse, modes quick/deep, recherche, reconstruct, archive, viewers) |
| `e2e/admin/analyze-workspace.spec.ts` | 2 | E89-D : bouton "Analyser avec le Workspace" sur fiche demande (fallback DB distante) |
| (autres fichiers e2e/) | — | non liés au workspace (auth, search, parts, tecdoc, etc.) |

Total tests touchant le workspace : **19** (17 + 2).

## Section C — Tests workspace identifiés

| Fichier | Titre du test | Phase E89→E94 |
|---|---|---|
| `e2e/workspace/workspace.spec.ts` | loads with three zones | E92 (UI workspace) |
| `e2e/workspace/workspace.spec.ts` | analyse button present and clickable | E92 |
| `e2e/workspace/workspace.spec.ts` | placeholder visible initially | E92 |
| `e2e/workspace/workspace.spec.ts` | submit ingestion form triggers analyse | E92 |
| `e2e/workspace/workspace.spec.ts` | assistant shows ingestion warnings | E92 |
| `e2e/workspace/workspace.spec.ts` | deep mode sends mode deep | E91/E92 |
| `e2e/workspace/workspace.spec.ts` | search results display two candidates | E91 |
| `e2e/workspace/workspace.spec.ts` | empty search shows not found | E91 |
| `e2e/workspace/workspace.spec.ts` | quick mode sends mode quick | E91 |
| `e2e/workspace/workspace.spec.ts` | deep mode triggers engine with deep | E91 |
| `e2e/workspace/workspace.spec.ts` | reconstruct success shows 3d viewer | E92 (reverse eng.) |
| `e2e/workspace/workspace.spec.ts` | reconstruct partial shows placeholder and warning | E92 |
| `e2e/workspace/workspace.spec.ts` | archive success shows archived | E90 (archive/analysisData) |
| `e2e/workspace/workspace.spec.ts` | archive partial shows draft | E90 |
| `e2e/workspace/workspace.spec.ts` | cadviewer for step | E92 |
| `e2e/workspace/workspace.spec.ts` | modelviewer for stl | E92 |
| `e2e/workspace/workspace.spec.ts` | placeholder when no fileurl | E92 |
| `e2e/admin/analyze-workspace.spec.ts` | affiche le bouton "Analyser avec le Workspace"… | E89 |
| `e2e/admin/analyze-workspace.spec.ts` | déclenche l'état de chargement au clic… | E89 |

## Section D — Lacunes par phase

| Phase | Couvert | Tests manquants suggérés |
|---|---|---|
| E89 — Bouton "Analyser avec le Workspace" depuis `/admin/demandes/[id]` | partiel | Vérifier redirection/navigate réelle vers `/workspace?analysisData=...`; succès complet (pas seulement fallback DB distante) |
| E90 — Stockage `analysisData` + affichage fiche pièce | partiel | Affichage de la fiche pièce depuis workspace; persistance DB (part créée avec analysisData); KPI dashboard consomme les données |
| E91 — Recherche classique unifiée (`engine=true`) | partiel | Recherche via API `engine=true` côté admin; intégration au dashboard; mode quick/deep réellement branché à la recherche classique |
| E92 — Workspace + reverse engineering (bouton + modale) | oui (UI) | Modale de reverse engineering (ouverture, sélection, validation); bouton reverse eng. déclenchement; tests d'intégration CAD viewer réel |
| E93 — Recommandation de machine (`MachineRecommendationPanel`) | **non** | Aucun test E2E. Manquant : affichage du panneau sur fiche pièce, recommandation selon dimensions, interaction sélection machine |
| E94 — KPI workspace sur le tableau de bord | **non** | Aucun test E2E. Manquant : cartes KPI visibles sur `/admin` dashboard, valeurs cohérentes avec données seed |

## Section E — Tests désactivés / TODO

- Aucun `test.skip` / `describe.skip` dans `e2e/workspace/` ni dans `e2e/admin/analyze-workspace.spec.ts`.
- Aucun TODO/FIXME détecté dans ces fichiers.
- `test.skip` présents ailleurs (mappings, part-attachments, part-transitions, part-version-diff, part-versions, search, traceparts, tecdoc, wikidata) mais hors périmètre workspace.

## Section F — Preuves d'exécution récente

- Aucun rapport/artefact Playwright (`.playwright/`, `playwright-report/`, `test-results/`) détecté dans le dépôt.
- Aucun log CI référencé. Aucune preuve d'exécution récente disponible pour les tests E2E workspace.

## Section G — Inconnues / points à clarifier

1. Le "17/17" de la passation = les 17 tests de `e2e/workspace/workspace.spec.ts` (projet `workspace`, sans auth). Statut "stables" non vérifié par exécution récente (Section F).
2. `analyze-workspace.spec.ts` dépend de `dynamicIds` (fixture DB distante Neon) et gère un fallback DB hors-ligne : comportement réel non testable localement sans Neon accessible.
3. Le projet `workspace` n'a pas de `storageState` ni de dépendance `setup` → les tests workspace ne sont pas authentifiés. Incertain si `/workspace` requiert auth.
4. Aucune couverture E2E pour E93 (machine recommendation) ni E94 (KPI dashboard), et couverture partielle pour E89/E90/E91.
5. Deux fichiers `.txt` suspects (`part-versions-content.txt`, `part-versions-modified.txt`) dans `e2e/` — artefacts non liés au workspace.