# PROMPT_PASSATION_SUPERVISEUR_v2.md

## 1. Contexte projet

PartIVA — application Next.js (Prisma + Postgres/Neon) de gestion de pièces mécaniques et de workspace de reconstruction 3D. Gouvernance documentée sous `docs/gouvernance/`, état sous `docs/etat/`. Branche de travail `master`, commits pushés.

## 2. État actuel (E89-E100)

Phases clôturées : E89, E90, E91, E92, E93, E94, E95, E96, E97, E98, E99, E100 (B1+B2), E101. E102 et E103 skippées.

- **E95/E96** : réparation SW/PWA, cartes demandes cliquables ; prettier.
- **E98** : durcissement détection formats CAO (`1fca92e`) — whitelist centralisée + garde-fou `selectCandidates` + validation `IngestZone`.
- **E99** : gestion d'erreurs moteur normalisée — codes explicites, map FR, UI actionnable.
- **E100-B1** (`c2d301b`) : `vision.ts` migré vers `callGroq` + Zod + `structuredWarnings`.
- **E100-B2** (`45ae24f`) : enrichissement `extract-params.ts` + tests.
- **E101** (`575f5c0`) : infrastructure Postgres locale `partiva_test` + auth Playwright réparée.
- **Docs** (`65e62b5`) : clôture E100 + mise à jour dettes.

## 3. Dettes

### Résolues
- `D-E52-FILE-FORMAT-DETECTION` (E98)
- `D-E56-GESTION-ERREURS-MOTEUR` (E99)
- `D-E57-LLM-ENRICHMENT` (E100-B1+B2)

### Skippées documentées
- `D-E101-E2E-HYDRATION` (E93/E94)
- `D-E57-ENV-ADMIN-TESTS` (partiel)

### Restantes (voir `docs/etat/DETTES.md`)
- `D-E24-E2E-TIMEOUT-SOURCES` (active, faible) — 2 tests `source=all`.
- `D-E48-WEB-SEARCH-RESILIENCE` (ouverte).
- `D-E57-WORKSPACE-E2E` (ouverte) — aucun E2E workspace.
- `D-E52-CAD-GENERATION` (partiellement résolu) — cas réels Groq non validés.
- `D-E14-PRINT-ON-DEMAND` (acceptée, facteur externe).
- `D-E37-GITHUB-RELEASES` (reportée).

## 4. Garde-fous / Règles

- Ne pas modifier `.env` ; utiliser `.env.test` + `globalSetup`.
- Subdiviser les phases (audit → implémentation → preuves).
- Garder `warnings: string[]` rétrocompatible.
- Skipper proprement avec dette documentée plutôt que bricoler.
- Audit avant implémentation ; preuves obligatoires (tsc/lint/build/tests).
- Ne pas élargir le périmètre sans autorisation ; mettre à jour `ETAT_COURANT.md`.

## 5. Workflow recommandé (audit → implémentation → preuves)

1. Audit préalable avec rapport dans `docs/sessions/rapports/`.
2. Implémentation ciblée, subdivisée en sous-phases (A/B/C).
3. Vérifications : `npm run typecheck`, `npm run lint`, `npm run build`, tests unitaires/E2E.
4. Mise à jour de `docs/etat/ETAT_COURANT.md` et `DETTES.md`.
5. Commit avec message `feat/fix/docs: ... (E###)`.

## 6. Outils/chemins critiques

- `src/core/ai-engine/skills/reconstruct/` (extract-params, generate-cad, select-candidates, types)
- `src/lib/ai/groq-client.ts`, `src/lib/ai/engine.ts`, `engine-error-messages.ts`
- `src/lib/utils/file-formats.ts`
- `e2e/` (projects `workspace`, `admin`), `playwright.config.ts`
- Postgres local : `partiva_test` ; `.env.test` + globalSetup
- Commandes : `npm run typecheck`, `npm run lint`, `npm run build`, `npm run test:unit`, `npx playwright test --project=workspace`

## 7. Recommandations pour la suite (E104+ ou consolidation)

### Leçons campagne V0
8. Un test ciblé vert ne prouve rien. Seul le run complet sur build frais fait foi. Règle E2E-PROOF : `npm run build` avant tout `npx playwright test`, et la preuve contractuelle est la ligne finale `15 passed, 2 skipped, 0 failed`.
9. L'ordre des commandes de fiche est contractuel. `campaign:snapshot` → RAPPORT.md → `campaign:record` → `campaign:dashboard` → `campaign:snapshot --retest`. Ne jamais enregistrer un verdict avant le RAPPORT.md complet.
10. Encodage UTF-8 des registres. Les notes PowerShell peuvent sortir mal encodées (`après` → `aprÃ¨s`). Dette `D-CAMPAGNE-ENCODING` à corriger (writeFile UTF-8 explicite).

- Valider les cas réels Groq pour `D-E52-CAD-GENERATION`.
- Résoudre `D-E57-WORKSPACE-E2E` (tests E2E workspace).
- Résoudre `D-E24-E2E-TIMEOUT-SOURCES`.
- Durcir `D-E48-WEB-SEARCH-RESILIENCE`.
- Consolider la documentation d'état et les rapports de session.

## 8. Annexes

### Commits clés
- `575f5c0` — E101 (infra Postgres locale + auth Playwright)
- `1fca92e` — E98 (détection formats CAO)
- `c2d301b` — E100-B1 (vision.ts → callGroq + Zod)
- `45ae24f` — E100-B2 (enrichissement extract-params)
- `65e62b5` — docs (clôture E100 + dettes)

### État tests
- Workspace E2E : 15/2/0 après rebuild obligatoire (correction E-TESTS-FIX-WORKSPACE-WARNINGS-v2). Tests unitaires : 12 suites, 52 tests, tous verts.
- tsc / lint : OK.
- Unitaires : verts (dernière exécution).

## Campagne tests réels admin (2026-11-03) — CLÔTURÉE

### 13 leçons gravées
49. Incohérence URL/affichage = bug UX grave
50. Un bouton invisible = bouton mort
51. Patchwork UI pire qu'absence de fonctionnalité
52. Capture partielle ne prouve rien
53. Composant existant mais non rendu = faux-semblant
54. Simplifier plutôt que complexifier
55. Patchwork UI = pire qu'absence
56. Rapport de synthèse sans preuve = faux-semblant
57. Rapport honnête = mieux qu'optimisme
58. State supprimé mais référencé = bug de compilation
59. Simplification complète (imports, props)
60. Bouton sans onClick = faux-semblant d'UI
61. Chaque correction révèle d'autres problèmes

### 9 dettes d'infrastructure
D-CAMPAGNE-ENCODING, D-CAMPAGNE-BUILD-FRESH, D-CAMPAGNE-RECORD-ORDER, D-CAMPAGNE-ENV-TEST-SYNC, D-CAMPAGNE-ENV-PRIORITY, D-CAMPAGNE-CLOUDINARY-CHECK, D-CAMPAGNE-GROQ-CHECK, D-ADMIN-TEST-COVERAGE, D-WS-REFACTOR

### Bilan
5 bugs + 3 dettes corrigés. Typecheck exit 0, lint 0 erreurs, build vert.
