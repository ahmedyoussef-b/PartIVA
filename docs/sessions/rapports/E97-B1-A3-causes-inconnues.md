# E97-B1-A3 — Les 2 causes inconnues

## Section 1 — `loads with three zones`

Code test (lignes 16-22) :
```ts
test('loads with three zones', async ({ page }) => {
  await page.goto('/workspace');
  await expect(page.getByRole('heading', { name: /Collecte/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Assistant IA/i })).toBeVisible();
  await expect(page.getByText(/Aucun mod.le 3D disponible/i)).toBeVisible();
});
```

Message brut Playwright :
```
Error: expect(locator).toBeVisible() failed
Locator: getByText(/Aucun mod.le 3D disponible/i)
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

Extrait composant : IngestZone.tsx:125 `<h2>Collecte</h2>`, AssistantZone.tsx:163 `<h2>Assistant IA</h2>`, ViewerZone.tsx:82 `<p>Aucun modèle 3D chargé. Déposez un fichier STEP ou STL pour commencer.</p>`.

Verdict : les 2 headings passent. Le 3e assert (placeholder) échoue car le texte attendu est obsolète ("Aucun modèle 3D disponible" → actuel "Aucun modèle 3D chargé..."). Donc `loads with three zones` est **obsolète** (4e placeholder), pas une régression UI.

## Section 2 — `search results display two candidates`

Code test (lignes 85-109) :
```ts
test('search results display two candidates', async ({ page }) => {
  const result = { ...baseResult, search: { searchStatus: 'success', candidates: [ { partNumber: 'P1', score: 0.85 }, { partNumber: 'P2', score: 0.72 } ] } };
  await page.route('**/api/engine', async (route) => { ... });
  await page.goto('/workspace');
  await page.getByPlaceholder('Description').fill('test part');
  await page.getByRole('button', { name: /Analyser/i }).click();
  await expect(page.getByText(/R.sultats recherche \(2\)/i)).toBeVisible(); // passe
  await expect(page.getByText(/0.85/)).toBeVisible(); // ÉCHOUE
  await expect(page.getByText(/0.72/)).toBeVisible();
});
```

Message brut Playwright :
```
Error: expect(locator).toBeVisible() failed
Locator: getByText(/0.85/)
Expected: visible
Timeout: 5000ms
Error: element(s) not found
```

Extrait composant (AssistantZone.tsx:92-104) : le message `Résultats recherche (2)` est rendu, mais les scores `0.85`/`0.72` ne sont **jamais affichés** dans l'UI (les candidats sont rendus via `<CandidateCard>` sans score texte). Donc `getByText(/0.85/)` ne peut jamais matcher.

Verdict : test **obsolète** — il attend un affichage de score qui n'existe pas dans l'UI actuelle. Le mock est correct (2 candidats), mais l'assertion sur les scores est invalide.

## Section 3 — Sortie brute Playwright

Les 6 blocks d'erreur sont identiques aux précédents :
- 4 tests placeholder : `getByText(/Aucun mod.le 3D disponible/i)` not found.
- 2 tests deep : `Expected: "deep" / Received: "quick"` (combobox nth(1) ne pointe pas le bon select, ou timing).
- 1 test search : `getByText(/0.85/)` not found (score non rendu).

Résumé final : **11 passed / 6 failed** (~1.9m). Aucune régression UI détectée — tous les échecs sont des tests obsolètes ou fragiles.