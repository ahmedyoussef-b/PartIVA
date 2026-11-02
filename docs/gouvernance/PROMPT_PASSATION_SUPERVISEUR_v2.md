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
- Workspace E2E : 15/2 (pass/fail selon `D-E24-E2E-TIMEOUT-SOURCES`).
- tsc / lint : OK.
- Unitaires : verts (dernière exécution).

### Rapports clés
- `docs/sessions/rapports/SESSION-2026-10-31-E90-0.md` et suivants (E90-E92).
- `docs/etat/ETAT_COURANT.md`, `docs/etat/DETTES.md`, `docs/etat/DECISIONS.md`.
