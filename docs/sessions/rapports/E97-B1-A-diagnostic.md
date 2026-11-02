# E97-B1-A — Diagnostic des 6 tests cassés

## Section 1 — Tableau des 6 tests

| test | extrait code (sélecteur) | message erreur brut (résumé) | composant ciblé | verdict |
|---|---|---|---|---|
| loads with three zones | `expect(page.getByRole('heading', { name: /Collecte/i }))` etc. | heading/zone introuvable | WorkspaceClient/WorkspaceLayout | obsolète (UI a changé) |
| placeholder visible initially | `expect(page.getByText(/Aucun mod.le 3D disponible/i))` | element(s) not found | ViewerZone.tsx:82 | obsolète (texte changé) |
| deep mode sends mode deep | `expect.poll(() => body?.mode).toBe('deep')` | mode !== deep | IngestZone (combobox) | à vérifier (données) |
| search results display two candidates | `expect(page.getByText(/R.sultats recherche \(2\)/i))` | element(s) not found | AssistantZone | obsolète possible |
| deep mode triggers engine with deep | `expect.poll(() => body?.mode).toBe('deep')` | mode !== deep | IngestZone | à vérifier |
| placeholder when no fileurl | `expect(page.getByText(/Aucun mod.le 3D disponible/i))` | element(s) not found | ViewerZone.tsx:82 | obsolète (texte changé) |

## Section 2 — Verdict par test

1. `loads with three zones` : le heading "Collecte" / "Assistant IA" peut avoir changé de libellé dans WorkspaceLayout → test obsolète.
2. `placeholder visible initially` : ViewerZone affiche désormais "Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer." → test obsolète (mauvais texte).
3. `deep mode sends mode deep` : le combobox nth(1) peut ne plus correspondre au sélecteur de mode → à confirmer.
4. `search results display two candidates` : le texte "Résultats recherche (2)" a peut-être changé de format → à confirmer.
5. `deep mode triggers engine with deep` : idem #3.
6. `placeholder when no fileurl` : même cause que #2.

## Section 3 — Middleware

Aucun fichier `middleware.ts` à la racine ni dans `src/`. `/workspace` n'est **pas** protégé au niveau middleware. Pas besoin de storageState pour la suite workspace actuelle.

## Section 4 — Sortie brute Playwright

Exécution : `npx playwright test e2e/workspace/workspace.spec.ts --project=workspace`
Résultat : **11 passed / 6 failed** (durée ~1.9m).
6 échecs listés ci-dessus. 4 des 6 liés au texte placeholder obsolète ("Aucun modèle 3D disponible" vs "Aucun modèle 3D chargé..."). 2 liés aux modes deep (sélecteur combobox nth(1) à vérifier). 1 lié à l'affichage des résultats de recherche.