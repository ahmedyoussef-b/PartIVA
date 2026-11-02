# E97-A2 — Auth + fixtures + exécution de référence

## Section 1 — Auth workspace

- `/workspace` (page.tsx) : composant `WorkspaceClient` rendu sans guard serveur → **non protégé côté page**.
- Aucun `getServerSession`/`auth()` dans `src/app/workspace/page.tsx` ni layout segment.
- Middleware : à vérifier côté `middleware.ts` (non inspecté ici). Le projet `workspace` n'a pas de `storageState` dans la config → tests exécutés **non authentifiés**.

## Section 2 — Fixtures disponibles

| chemin | contenu | utilisable pour |
|---|---|---|
| `e2e/fixtures/users.ts` | credentials ADMIN/USER/VIEWER | E89 (admin), E90 |
| `e2e/setup/auth.setup.ts` | login + storageState `.auth/*.json` | E89/E90 si auth requise |
| `e2e/fixtures/dynamic-ids.ts` / `-fixture.ts` | ids dynamiques DB | E89 (request id) |
| `e2e/fixtures/submitted-part.ts` | part seedée | E90 (fiche pièce) |

Pas de fixture part avec `analysisData` seedé ni machine seedée identifiée.

## Section 3 — Composants cibles

| cible | fichier | props/data | sélecteur testid possible |
|---|---|---|---|
| MachineRecommendationPanel | `src/app/admin/pieces/[id]/machine-recommendation-panel.tsx` | `{ part, machines }` | à ajouter (aucun data-testid actuel) |
| KPI dashboard | `src/app/api/dashboard/kpi/route.ts` (engineAnalysesCount via analysisData) | parts avec analysisData | à ajouter sur cartes dashboard |

## Section 4 — Exécution de référence

Commande : `npx playwright test e2e/workspace/workspace.spec.ts --project=workspace`
Résultat : **11 passed / 6 failed** (durée ~1.9m).
Échecs :
- `loads with three zones` (ligne 17)
- `placeholder visible initially` (ligne 31)
- `deep mode sends mode deep` (ligne 69)
- `search results display two candidates` (ligne 85)
- `deep mode triggers engine with deep` (ligne 142)
- `placeholder when no fileurl` (ligne 275)

Cause apparente : texte placeholder `/Aucun mod.le 3D disponible/i` non trouvé (UI changée ?) et modes deep. Preuve que le "17/17 stable" n'est plus valide.

## Section 5 — Inconnues restantes

1. L'état de la page `/workspace` a évolué (placeholder texte) → tests désynchronisés de l'UI.
2. Nécessité de data-testid sur composants cibles (E93/E94) avant écriture des tests.
3. Vérifier middleware pour `/workspace` (auth).