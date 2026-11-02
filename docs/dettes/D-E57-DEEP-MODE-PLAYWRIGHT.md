# D-E57-DEEP-MODE-PLAYWRIGHT

## Contexte
2 tests E2E en échec : `deep mode sends mode deep`, `deep mode triggers engine with deep`.

## Symptôme
Playwright `selectOption('deep')` ne met pas à jour le state React (`mode` reste `quick`).

## Preuve de non-régression produit
Test manuel humain validé : changement via l'UI + payload réseau correct (mode deep envoyé).

## Cause probable
Race condition entre l'hydratation de `useWorkspacePersistence` et l'événement Playwright, ou `selectOption` qui n'émet pas le bon événement natif sur ce select contrôlé React.

## Piste de résolution
Utiliser `page.locator(...).dispatchEvent('change')` ou attendre une condition d'hydratation avant l'action. À traiter dans une phase dédiée.