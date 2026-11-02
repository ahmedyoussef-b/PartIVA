# E97-B1-D — Rapport d'implémentation

## Section 1 — Fichiers modifiés

| chemin | nature | résumé |
|---|---|---|
| `src/lib/hooks/use-workspace-persistence.ts` | UI | restauration localStorage déplacée de `useEffect` vers `useLayoutEffect` (synchrone avant paint) |
| `e2e/workspace/workspace.spec.ts` | tests | 2 tests deep : `addInitScript` (clear localStorage) + `selectOption('deep')` + `toHaveValue('deep')` |

## Section 2 — Diff `use-workspace-persistence.ts`

- Import `useLayoutEffect` ajouté.
- Bloc de restauration (lignes 55-62) : `useEffect` → `useLayoutEffect`.

## Section 3 — Diff des 2 tests deep

- `addInitScript(() => localStorage.removeItem('partiva-workspace-state'))` avant `goto`.
- `selectOption('deep')` + `toHaveValue('deep')` (assertion d'hydratation).
- `localStorage.clear()` rétabli (via addInitScript).

## Section 4 — Preuves

- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 nouvelle erreur.
- `npm run build` : succès.
- Playwright : voir Section 5.

## Section 5 — Résultat Playwright

**15/17 passed.** 2 tests échouent encore :
- `deep mode sends mode deep`
- `deep mode triggers engine with deep`

Cause persistante : `selectOption('deep')` ne met pas à jour la valeur contrôlée du `<select>` (toHaveValue reste `'quick'`). Même avec `useLayoutEffect` (hydratation synchrone) et `addInitScript` (localStorage vidé), le select contrôlé par React (`value={mode}`) ne reflète pas la sélection. Hypothèse : React 19 + Playwright `selectOption` sur un select contrôlé ne déclenche pas la mise à jour d'état (problème d'interaction Playwright ↔ React, non résolu par les correctifs testés).

## Section 6 — Confirmation

- `localStorage.clear()` rétabli via `addInitScript`.
- `git diff --stat` : 2 fichiers modifiés (hook + tests). Aucun fichier hors périmètre.
- Aucun test `skip`/`fixme`.