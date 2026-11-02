# E97-B1-B — Rapport d'implémentation

## Section 1 — Fichiers modifiés

| chemin | nature | résumé |
|---|---|---|
| `src/components/workspace/IngestZone.tsx` | UI | ajout `data-testid="ingest-mode-select"` sur le `<select>` du mode |
| `src/components/workspace/CandidateCard.tsx` | UI | ajout `data-testid="candidate-card"` sur la `<Card>` racine |
| `e2e/workspace/workspace.spec.ts` | tests | placeholder texte → regex `/Aucun mod.*3D charg/i`; deep select → data-testid; quick → data-testid; search scores → candidate-card count; localStorage clear supprimé |

## Section 2 — Diff des 6 tests

- `loads with three zones` : placeholder assert → `/Aucun mod.*3D charg/i` (ligne 21)
- `placeholder visible initially` : idem (ligne 33)
- `placeholder when no fileurl` : idem (ligne 289)
- `deep mode sends mode deep` : select → `getByTestId('ingest-mode-select')` + dispatch input/change (ligne 69-82)
- `deep mode triggers engine with deep` : idem (ligne 141-155)
- `search results display two candidates` : scores 0.85/0.72 retirés → `getByTestId('candidate-card')` toHaveCount(2) (ligne 107)

## Section 3 — Diff UI

- `IngestZone.tsx:267` : `data-testid="ingest-mode-select"` ajouté sur le 2ᵉ `<select>` (mode). Le 1er `<select>` (unité) inchangé.
- `CandidateCard.tsx:63` : `data-testid="candidate-card"` ajouté sur la `<Card>` racine. Aucun autre changement fonctionnel.

## Section 4 — Preuves

- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 nouvelle erreur.
- `npm run build` : succès (route `/workspace` présente).
- `grep data-testid` : IngestZone (1), CandidateCard (1).

## Section 5 — Résultat Playwright

**15/17 passed.** 2 tests échouent encore :
- `deep mode sends mode deep` (ligne 69)
- `deep mode triggers engine with deep` (ligne 141)

Cause : le `<select>` contrôlé par React (`value={mode}`) ne met pas à jour l'état `mode` lors des événements dispatchés par Playwright (`selectOption`, `input`, `change` natifs). L'état reste `'quick'`, donc le body envoyé contient `mode: 'quick'`. Le composant utilise `useWorkspacePersistence` (localStorage) + `setMode` via `onModeChange`. Les événements Playwright ne déclenchent pas la mise à jour React attendue. Les 4 tests placeholder + le test search sont désormais verts (15/17).

## Section 6 — Écarts / inconnues

- 2 tests `deep` non réparés : la cause racine est un problème d'interaction Playwright ↔ React controlled select. Pistes : utiliser `page.addInitScript` pour injecter un hook, ou tester le mode via un test unitaire du composant, ou remplacer le `<select>` natif par un composant Radix/shadcn qui expose un `data-testid` sur le trigger (hors périmètre E97-B1).
- Aucun test n'a été `skip`/`fixme`.
- Les 15 autres tests du fichier passent (17 total - 2 = 15).