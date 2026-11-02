# PLAN E100 — Enrichissement LLM (subdivisé en 3 sous-phases)

**Dette concernée** : `D-E57-LLM-ENRICHMENT`
**Effort total estimé** : Moyen-Élevé (mais subdivisé pour rester gérable)
**Dépendances** : `groq-client.ts` (E99), `select-candidates.ts` (E98)
**Prérequis** : DB locale `partiva_test` (E101), auth Playwright (E101)

---

## Vue d''ensemble des 3 sous-étapes

| Sous-étape | Objectif | Fichiers | Effort | Risque | Priorité |
|---|---|---|---|---|---|
| **E100-B1** | Migrer `vision.ts` vers `callGroq` + parsing Zod + `structuredWarnings` | `vision.ts`, `vision.test.ts` (nouveau), `types.ts` si besoin | Moyen | Moyen | **Élevée** (cohérence E99) |
| **E100-B2** | Enrichir `extract-params.ts` avec `extractedFeatures` + contraintes + tests | `extract-params.ts`, `extract-params.test.ts` (nouveau) | Moyen | Faible | **Élevée** (impact direct CAO) |
| **E100-B3** | Améliorer l''affichage UI des `structuredWarnings` (optionnel mais recommandé) | `AssistantZone.tsx`, `engine-error-messages.ts` (extension) | Faible | Faible | Moyenne (UX) |

**Règle absolue** : chaque sous-étape est **indépendante** et **validable séparément**. Si l''une échoue, on ne bloque pas les autres.

---

## Étape 1 — `E100-B1` : Migration `vision.ts`

### Objectif
Migrer `vision.ts` du `fetch` direct vers `callGroq` (normalisé E99), ajouter un parsing Zod, et exposer `structuredWarnings`.

### Périmètre strict
- `src/core/ai-engine/skills/vision/vision.ts`
- `src/core/ai-engine/skills/vision/types.ts` (ajout de types si nécessaire)
- `src/core/ai-engine/skills/vision/vision.test.ts` **(nouveau)**
- `src/lib/ai/engine-error-messages.ts` (ajout des codes `VISION_*`)

**Rien d''autre.**

### Contrat
1. Supprimer le `fetch` direct vers `https://api.groq.com/openai/v1/chat/completions` dans `vision.ts`.
2. Utiliser `callGroq` avec model/temperature/maxTokens/messages appropriés.
3. Parser avec Zod (`visionResponseSchema`), strip code fence, sur échec → `VISION_PARSE_FAILED`.
4. Ajouter `structuredWarnings: EngineWarning[]` au retour (en plus de `warnings: string[]`).
5. Codes d''erreur : `VISION_DOWNLOAD_FAILED`, `VISION_TOO_MANY_IMAGES`, `VISION_IMAGE_TOO_LARGE`, `VISION_PARSE_FAILED` + propagation `GROQ_*`.
6. Mettre à jour `engine-error-messages.ts` avec messages FR pour `VISION_*`.

### Tests
- Test 1 : succès avec JSON valide
- Test 2 : JSON invalide → parse fail
- Test 3 : > 3 images → too many images

### Vérifications
1. `npx tsc --noEmit` → 0 erreur
2. `npm run lint` → 0 nouvelle erreur
3. `npm run test:unit` → tests verts
4. `npx playwright test e2e/workspace/workspace.spec.ts --project=workspace --reporter=list` → 15 passed / 2 skipped

---

## Étape 2 — `E100-B2` : Enrichissement `extract-params.ts`

### Objectif
Enrichir le prompt avec `extractedFeatures`, contraintes explicites, et `structuredWarnings` sur échec.

### Périmètre strict
- `src/core/ai-engine/skills/reconstruct/extract-params.ts`
- `src/core/ai-engine/skills/reconstruct/extract-params.test.ts` **(nouveau)**
- `src/lib/ai/engine-error-messages.ts` (ajout `EXTRACT_PARAMS_FAILED`)

### Contrat
1. Enrichir `buildPrompt` avec contexte + contraintes + demandes de valeurs plausibles
2. Conserver `callGroq`, température 0, maxTokens 512, schéma Zod
3. `structuredWarnings` sur échec
4. Mise à jour `engine-error-messages.ts`

### Tests
- Test 1 : prompt contient extractedFeatures
- Test 2 : échec callGroq → DEFAULT_PARAMS + structuredWarnings
- Test 3 : JSON valide → parsing OK

---

## Étape 3 — `E100-B3` : Affichage UI

### Objectif
Améliorer l''affichage des `structuredWarnings` dans `AssistantZone.tsx`.

### Périmètre strict
- `src/components/workspace/AssistantZone.tsx`
- `src/lib/ai/engine-error-messages.ts` (peaufinage)

### Contrat
1. Grouper par stage
2. Encart visuel
3. Conserver rétrocompatibilité `warnings: string[]`

---

## Ordre d''exécution
1. E100-B1 (priorité 1)
2. E100-B2 (priorité 2)
3. E100-B3 (optionnel)

**Validation finale** : après B1+B2, clôturer `D-E57-LLM-ENRICHMENT`.
