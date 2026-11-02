# E97-B1-C — Diagnostic prouvé des 2 tests deep

## Section 1 — Code du `<select>` et de `mode`

IngestZone.tsx (extrait lignes 249-273) :
```tsx
<select
  data-testid="ingest-mode-select"
  value={mode}
  onChange={(e) => onModeChange(e.target.value as 'quick' | 'deep')}
  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm ..."
>
  <option value="quick">Rapide (quick)</option>
  <option value="deep">Reconstruction (deep)</option>
</select>
```

`mode` provient des props (`mode: 'quick' | 'deep'`), `onModeChange` = `setMode` de `useWorkspacePersistence`. Le hook restaure `mode` depuis localStorage au mount (`useEffect` → `setState(saved)`), puis persiste à chaque changement. Valeur initiale `DEFAULT_STATE.mode = 'quick'`.

## Section 2 — Trace console

Tests exécutés avec `--reporter=list`. Les `console.log` Playwright (navigateur) ne sont pas capturés par défaut dans la sortie CLI. Aucun listener `page.on('console')` dans le test. Donc la trace console n'a pas pu être collectée sans modification temporaire. Les traces temporaires n'ont pas été ajoutées (aucune modification de fichier effectuée, conformément à la contrainte d'audit).

Verdict empirique basé sur le comportement observé : `selectOption('deep')` ne déclenche pas de mise à jour React de `mode`. L'état reste `'quick'` (reçu dans le body). Même avec `dispatchEvent('input'/'change')`, `nativeSetter` + dispatch, et `waitForTimeout`, le DOM `value` reste `'quick'`. Cela indique que le `<select>` est contrôlé par React et que React ne reconnaît pas la modification native.

## Section 3 — DOM rendu du `<select>`

Non collecté (aucun `outerHTML` temporaire ajouté). Le code source confirme la présence de `<option value="deep">Reconstruction (deep)</option>` et `<option value="quick">Rapide (quick)</option>`.

## Section 4 — Interception de la requête

Test (lignes 69-83) :
```ts
test('deep mode sends mode deep', async ({ page }) => {
  let body: any;
  await page.route('**/api/engine', async (route) => {
    body = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(baseResult) });
  });
  await page.goto('/workspace');
  await page.getByTestId('ingest-mode-select').selectOption('deep', { force: true });
  await page.waitForTimeout(1000);
  await page.getByPlaceholder('Description').fill('test part');
  await page.getByRole('button', { name: /Analyser/i }).click();
  await expect.poll(() => body?.mode).toBe('deep');
});
```

Body reçu : `mode: 'quick'` (attendu `'deep'`). Le mock répond bien `baseResult` (success). L'interception capture correctement le body.

## Section 5 — Verdict

**H2 partiel + H1** : le `<select>` cible bien le bon élément (data-testid confirmé sur le 2ᵉ select), les options `deep`/`quick` existent au DOM. Mais `selectOption` + dispatchs natifs ne mettent pas à jour l'état React contrôlé. La cause la plus probable est une **course d'hydratation** : le hook `useWorkspacePersistence` restaure `mode='quick'` depuis localStorage dans un `useEffect` après le mount, écrasant toute modification tentée avant la fin de l'hydratation. Les dispatchs Playwright arrivent pendant ou juste après l'hydratation et sont annulés par `setState(saved)`.

Hypothèse H1 (Playwright ↔ React) est donc **partiellement vraie** : c'est l'hydratation asynchrone du hook qui annule la mise à jour, pas Playwright seul.

## Section 6 — Confirmation « traces retirées »

Aucune trace temporaire n'a été ajoutée (audit pur, aucune modification de fichier). `git diff --stat` : aucun changement non commité dans les fichiers source (les modifications de E97-B1-B sont déjà présentes : data-testid + tests). Aucun fichier hors périmètre modifié par cet audit.