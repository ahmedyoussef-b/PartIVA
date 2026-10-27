# SESSION-2026-10-27-E62-FIX — Correction bug regex auth.setup

## §1 — Contexte
Correction de la regex invalide dans auth.setup.ts.

## §2 — Bug identifié
Ligne 62 : `/\\/login/` invalide. Remplacé par `/\/login/`.

## §3 — Correction appliquée
Deux occurrences corrigées.

## §4 — Résultats
- `npx playwright test --project=admin --list` → 53 tests.
- `npm run build` → EXIT 0.

## §5 — Dettes
Aucune nouvelle.

## §6 — Preuves
Admin list OK. Build OK.
