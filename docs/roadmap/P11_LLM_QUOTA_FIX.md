# P11 — Correctifs anti-fuite de quota LLM

**Version :** 1.0
**Date :** 2026-11-24
**Statut :** Implémenté (Lots A→F) — à valider (build/lint/tests CI)

---

## 1. Objectif

Réduire la consommation des quotas gratuits (Groq et fallback) en supprimant les appels LLM inutiles, répétés ou concurrents, sans dégrader la fiabilité.

## 2. Correctifs appliqués

### Lot A — Mesure + gains P0
- **0.2** `groq-client` : log `[LLM:usage]` (tokens par provider) + cumul.
- **1.1** `/api/pcb/analyze` : `doublePass` et `rankCandidates` → **`false` par défaut** (1 appel au lieu de 3).
- **1.2** `/api/pcb/analyze` : **idempotence** — si des exigences existent et `force` absent, renvoi sans LLM.
- **1.3** Prompt unique déjà mutualisé entre les 2 passes.
- **2.1** `src/lib/pcb/ai-engine.ts` : utilise `groq-client` (fallback + JSON strict) ; `llm-client.ts` supprimé.

### Lot B — Robustesse
- **2.5** Modèle vision par défaut valide : `meta-llama/llama-4-scout-17b-16e-instruct` (`.env` corrigé).
- **3.1** Anti double-clic : `RequirementForm`, `analyze-button`, `ComponentSourcingPanel`.

### Lot C — Concurrence
- Verrou serveur `acquireLlmGuard` (TTL 120 s) sur `analyze`, `compile`, `source-components` → **429** si déjà en cours.

### Lot D — Caches
- `compile` : cache TTL 1 h par `hash(description)`.
- `source-components` : cache `sourcingCache` conservé + **mode `peek`** (aucun LLM au montage).
- `ComponentSourcingPanel` : montage en `peek`, génération explicite via bouton.

### Lot E — Hors PCB
- `query-normalizer` : cache par requête.
- `vision` : cache par images.
- `extract-params` : `response_format` + clé API vérifiée.

### Lot F — Garde-fous
- **6.1** Budget : `LLM_DAILY_TOKEN_BUDGET` → alerte à 80 % / dépassement (pas de coupure dure).
- **6.2** `AI_MOCK=true` → réponse déterministe sans appel réseau.
- **6.3** Tests unitaires : `src/lib/utils/llm-guard.test.ts`.
- **6.4** Présente note.

### Lot G — Résidus R1–R3
- **R1** `/api/ai/chat` : **authentification** (`getCurrentUser`) + **rate-limit** (20/min/user) + **verrou** + **debounce** (`AssistantZone`).
- **R2** `/api/pcb/requirements/parse` : **verrou** `acquireLlmGuard`.
- **R3** `/api/pcb/propose` : **verrou + cache** par `hash(answers)`.

### Lot H — Résidus R4–R6
- **R4** `source-components` : retry ramené à **1 tentative** (le fallback multi-provider couvre déjà les pannes).
- **R5** `engine` (description) : **cache + verrou** par hash des entrées ; `extract-params` : **cache** par hash du prompt.
- **R6** Embeddings : cache `embedTexts` (Cloudflare) et `computeImageEmbedding` (HF) par hash d'entrée.

### Lot I — Correctifs racine (2026-11-24)
- **I1** Cooldown providers **persistant en base** (`llm_provider_cooldowns`) : partagé entre instances serverless, avec L1 mémoire et timeout DB 800 ms. Quota journalier → reprise au prochain minuit UTC (au lieu de 24 h pleines).
- **I2** Cache LLM **persistant L2** (`llm_cache_entries`) pour `compile` et `propose` ; L1 mémoire conservé ; timeout DB 800 ms.
- **I3** Fallback élargi aux clés déjà présentes : **Together, DeepInfra, Mistral, SambaNova** (+ OpenRouter/Google/OpenAI). `hasLlmProvider()` permet de fonctionner sans `GROQ_API_KEY`.
- **I4** `maxTokens` réduits : `analyze` 4096→2048 (ranking 1024), `compile` 4096→2048, `source-components` 4096→2560.
- **I5** `/api/pcb/requirements/parse` : **appel LLM mort supprimé** (l'enrichissement n'était ni persisté ni renvoyé) → **0 appel** à la validation.
- **I6** `query-normalizer` : court-circuit déterministe pour les MPN/références (ex. `LM7805`, `R_0603`) → **0 appel** ; cache persistant 24 h pour le reste.
- **I7** `extract-params` : plus de dépendance dure à `GROQ_API_KEY` (fallback multi-provider).
- **I8** Invalidation par empreinte CDC : `PcbProject.cdcHash` pour `analyze` et `sourcingCache.cdcHash` pour `source-components`. Un CDC modifié force une nouvelle analyse/génération ; un CDC inchangé ne coûte **0 appel**.
- **I9** Découplage client/serveur : `providers-meta.ts` (métadonnées pures) remplace l'import de `providers.ts` dans `AssistantZone`. Sans cela, le client embarquait `groq-client` → `prisma` → `pg` et le build Turbopack échouait (`Can't resolve 'dns'/'fs'/'net'/'tls'`).

### Lot J — Re-analyse et coupe-circuit (2026-11-24)
- **J1 (B1)** Coupe-circuit journalier dur : `llm-budget.ts`, compteur `LlmDailyUsage` (jour UTC), `assertDailyBudget()` **refuse** tout appel au-delà de `LLM_DAILY_TOKEN_BUDGET` (défaut **100 000** tokens/j). `addDailyTokens()` écrit en base en arrière-plan (timeout 800 ms, repli mémoire). Migration `20261124130000_add_llm_daily_usage`.
- **J2 (B2)** `/api/ai/chat` : cache L2 par hash `(message + context + provider)` — couvre aussi la génération de fiche technique.
- **J3 (B3)** `/api/engine` : idempotence (cache résultat 5 min + verrou), cache L2 de la description, `hasLlmProvider()` remplace la garde dure `GROQ_API_KEY`.
- **J4 (B4)** `/api/search/photo` : rate limit 10/min/utilisateur ; `vision.ts` passe par `hasLlmProvider()` + `callGroq` (fallback 9 providers).
- **J5 (B5)** Migration `20261124130000_add_llm_daily_usage` à appliquer avec `npx prisma migrate deploy` dès que Neon répond (repli mémoire sinon).

## 3. Checklist « aucune fuite résiduelle »

- [x] `analyze` : 1 appel par défaut, 0 si même CDC déjà analysé (hash CDC)
- [x] `source-components` : cache invalidé si le CDC change (hash CDC)
- [x] `compile` : cache + verrou + debounce
- [x] `parse` : **0 appel** (enrichissement mort supprimé)
- [x] `source-components` : cache + `peek` + verrou + retry borné
- [x] `propose` : passe par `groq-client` + cache L2
- [x] `query-normalizer` : cache L2 + court-circuit MPN (0 appel)
- [x] `engine` deep : déjà borné (uniquement si partiel)
- [x] `vision` : cache par images
- [x] `extract-params` : `response_format` + clé vérifiée
- [x] cooldown providers + fallbacks configurés
- [x] verrou concurrence
- [x] compteur tokens + alerte budget
- [x] tests CI (nb d'appels / lock / cache)

## 4. Limites

- Les verrous `acquireLlmGuard` restent **en mémoire par instance** (TTL 120 s) : le risque résiduel est un appel concurrent sur deux instances simultanées, pas une fuite structurelle.
- Le cooldown et les caches `compile`/`propose` sont persistants **si la migration `20261124120000_add_llm_state` est appliquée**. Sans migration, le code retombe automatiquement sur le L1 mémoire (timeout DB 800 ms), sans bloquer les appels LLM.
- `source-components` garde son cache projet `sourcingCache` (déjà persistant).

## 5. Variables d'environnement

| Variable | Rôle | Défaut |
|---|---|---|
| `LLM_DAILY_TOKEN_BUDGET` | Plafond journalier de tokens (coupe-circuit dur) | `100000` |
| `AI_MOCK` | Mode dégradé sans appel | `false` |
| `GROQ_VISION_MODEL` | Modèle vision | `meta-llama/llama-4-scout-17b-16e-instruct` |
| `TOGETHER_API_KEY` / `TOGETHER_MODEL` | Fallback Together | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| `DEEPINFRA_API_KEY` / `DEEPINFRA_MODEL` | Fallback DeepInfra | `meta-llama/Meta-Llama-3.1-70B-Instruct` |
| `MISTRAL_API_KEY` / `MISTRAL_MODEL` | Fallback Mistral | `mistral-small-latest` |
| `SAMBANOVA_API_KEY` / `SAMBANOVA_MODEL` | Fallback SambaNova | `Meta-Llama-3.3-70B-Instruct` |

**Migration requise :** `npx prisma migrate deploy` (migrations `20261124120000_add_llm_state` + `20261124130000_add_llm_daily_usage`).

---

## 6. Résidus B1–B5 (audit final)

| # | Correctif | Détail |
|---|---|---|
| **B1** | Coupe-circuit journalier **dur** | `src/lib/utils/llm-budget.ts` : compteur `LlmDailyUsage` (UTC), `assertDailyBudget()` **refuse** tout appel au-delà du plafond (défaut 100 000, `LLM_DAILY_TOKEN_BUDGET`). Persistant L2 + repli mémoire L1. |
| **B2** | Cache L2 `/api/ai/chat` + fiche technique | Clé = `hash(message + context + provider)` via `getLlmCacheAsync`/`setLlmCacheAsync`. |
| **B3** | Idempotence `/api/engine` | Cache résultat 5 min + verrou ; description en cache **L2** ; `hasLlmProvider()` au lieu de `GROQ_API_KEY`. |
| **B4** | Rate-limit photo + vision multi-providers | `/api/search/photo` : 10/min/user. `vision.ts` : `hasLlmProvider()` + appel sans clé Groq figée (fallback 9 providers). |
| **B5** | Migration | `20261124130000_add_llm_daily_usage` créée ; à appliquer avec `prisma migrate deploy` dès que Neon répond (repli mémoire sinon). |

**F6 (verrous/rate-limit en mémoire)** reste P2 : acceptable pour un déploiement mono-instance ; à durcir (Redis/table) si multi-instance.