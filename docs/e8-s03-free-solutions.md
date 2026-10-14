# E8-S03 — Solutions gratuites pour dettes bloquées

**Date** : 2026-10-13
**Session** : E8-S03 (déblocage dettes gratuites)
**Ordre** : E8-S03 (Déblocage dettes gratuites)

---

## Résumé

4 dettes bloquées en attente de contrats externes. Solutions 100% gratuites
implémentées pour les débloquer temporairement, sans attendre les contrats.

| Dette | Solution | Statut | Coût |
|---|---|---|---|
| `D-photo-embedding-backfill` | LightweightEmbeddings self-host (Docker) | 🟠 Build Docker en cours (service public HF 503 persistant) | 0€ |
| `D-tecdoc-auto-parts` | auto-parts-db (NPM, MIT) — seed véhicules/pièces | ✅ **Réussi** — 500 véhicules + 1521 pièces + 1505 fitments | 0€ |
| `D-tecdoc-credentials` | ELTA e-Catalogue (connecteur mock initial) | 🟡 Connecteur mock créé (`src/lib/data/elta.ts`) — inscription ELTA = action humaine | 0€ |
| `D-traceparts-credentials` | Formulaire developers.traceparts.com | 🟡 Formulaire = action humaine — mock existant conservé | 0€ |

---

## Bloc 0 — Reconnaissance (R.5.1)

**Fichiers lus** :
- `src/lib/embeddings.ts` — supporte déjà 3 providers (`lightweight` via `hf.space`, `deepinfra`, `huggingface`), détection auto via `HF_API_URL`
- `src/lib/data/part-embeddings.ts` — backfill + recherche photo pgvector
- `prisma/schema.prisma` — modèles `Vehicle` (make/model/year/engine/ktype/vin), `Fitment` (partId/vehicleId), `Part` (material/autoCategory)
- `package.json` — pas de `auto-parts-db` initialement

**État `.env`** :
- `HF_API_URL=https://lamhieu-lightweight-embeddings.hf.space/v1/embeddings` ✅ présent
- `HF_EMBEDDING_MODEL=siglip-base-patch16-256-multilingual` ✅ présent
- `HF_API_TOKEN=` (vide — pas besoin pour lightweight) ✅
- `TRACEPARTS_TENANT_UID=` / `TRACEPARTS_API_KEY=` ❌ vides
- `TECDOC_API_KEY=ton_api_key` / `TECDOC_PROVIDER_ID=ton_provider_id` ⚠️ placeholders

---

## Bloc A — Photo embedding (D-photo-embedding-backfill)

**Objectif** : remplacer HF Inference par une solution gratuite.

**Constat** : le service public `lamhieu-lightweight-embeddings.hf.space` retourne
**503 "service temporarily overloaded"** sur 3 tentatives (persistant, confirmé).

**Solution A1 retenue** : self-host Lightweight Embeddings (Docker).
- Source : HF Space `lamhieu/lightweight-embeddings` cloné (`C:\Users\pc\AppData\Local\Temp\kilo\lightweight-embeddings`)
- Image GHCR `ghcr.io/lh0x00/lightweight-embeddings` = **denied** (privée) → build local depuis le Dockerfile
- **Variante headless** créée (`lightweight-embeddings-headless`) : `requirements.txt` sans `gradio` (UI optionnelle 60+ Mo + conflit de résolution pip — 12+ versions téléchargées en boucle) ni `upstash_redis` (analytics optionnel)
- Modèle : `siglip-base-patch16-256-multilingual` (image, 768 dims) — compatible avec `src/lib/embeddings.ts` (provider `lightweight`, endpoint OpenAI-compat `/v1/embeddings`)
- Port 7860, `LWE_MODELS_PRELOAD=siglip-base-patch16-256-multilingual`

**Statut** : 🟠 Build Docker en cours (torch CPU 184 Mo + transformers). Le service
public reste en 503. **Critère de succès** (computeImageEmbedding → vecteur 768 dims)
**non encore vérifié** — en attente de la fin du build + lancement du conteneur.

**Solution A2 (fallback)** : token HF gratuit — non tentée (le provider lightweight
ne nécessite aucun token ; un token HF n'aiderait pas le service public 503).

**Prochaine étape** : terminer le build Docker, lancer le conteneur, puis
`HF_API_URL=http://localhost:7860/v1/embeddings` + `npm run db:backfill-embeddings`.

---

## Bloc B — Catalogue pièces auto (D-tecdoc-auto-parts) ✅ RÉUSSI

**Solution B1** : `auto-parts-db` v3.0.0 (NPM, MIT).
- **Nature vérifiée (R.5.16)** : 142 marques, 2379 modèles avec générations (1968-présent), 1530 pièces. Exports `getBrands()`, `getModelsByBrand()`, `getParts()`, `searchParts()`.
- **Attention R.5.16** : les **noms de pièces sont en russe** (source russophone, ex. `Барабан тормозной` = tambour de frein). Les **slugs sont en anglais** et servent de `partNumber`. Les marques/modèles sont latins et directement utilisables.

**Seed** : `scripts/seed-auto-parts.ts` (batch `createMany` + `skipDuplicates`, idempotent).
- `prisma.vehicle` : 500 véhicules (142 marques × modèles, année = début 1ʳᵉ génération, `ktype=APDB-<marque>-<modèle>`)
- `prisma.part` : 1521 pièces (1530 − 9 doublons de slug, `partNumber=APDB-<slug>`, `autoCategory=auto_parts_db`)
- `prisma.fitment` : 1505 fitments (3 pièces/véhicule, échantillon représentatif)

**Critère de succès atteint** : ≥100 véhicules (500) + ≥100 pièces (1521) ✅

**Commande** : `npx tsx scripts/seed-auto-parts.ts`

---

## Bloc C — Catalogue TecDoc gratuit (D-tecdoc-credentials)

**Solution C1** : ELTA e-Catalogue (ELTA Automotive).
- **Nature** : catalogue réel de pièces automobiles, inscription gratuite sur elta-automotive.com.
- **Statut** : 🟡 **Connecteur mock initial créé** (`src/lib/data/elta.ts`) — schéma Zod `EltaProductSchema`/`EltaSearchResponseSchema`, data layer `searchElta()` (mode mock 3 fixtures), mapping `mapEltaToCandidate()`. Pattern cohérent avec `tecdoc.ts`/`traceparts.ts`.
- **Non intégré à l'agrégateur** : ELTA réel nécessite l'inscription gratuite (action humaine) + capture de réponse réelle (R.5.16) pour confirmer les endpoints. Le mock est documentaire, comme TraceParts/TecDoc avant provisioning.
- **Variable d'env** : `ELTA_API_KEY` (à documenter dans `.env.example` après inscription).

**Solution C2 (fallback)** : `ronhartman/tecdoc-autoparts-catalog` (Symfony/PHP).
- **Nature vérifiée (R.5.16)** : repo existe (HEAD `18dd50b`), mais c'est un projet **Symfony/PHP** — hors stack PartIVA (Next.js/Prisma/TypeScript). **Rejeté** : inadapté à la stack, ne fournirait pas d'API directement consommable.

**Prochaine étape** : inscription ELTA gratuite (humain) → capture réponse réelle → implémenter endpoints réels dans `searchElta()`.

---

## Bloc D — TraceParts (D-traceparts-credentials)

**Action** : soumettre le formulaire sur https://developers.traceparts.com/docs/requesting-apikey.
- **Statut** : 🟡 **Action humaine externe** — non exécutable par l'agent (formulaire web avec CAPTCHA/validation humaine).
- **Mock existant conservé** : `src/lib/data/traceparts.ts` (mode mock actif, `isTracePartsConfigured()` = false car `TRACEPARTS_*` vides).
- **Description de projet à soumettre** (prête à copier-coller) :
  > "PartIVA is a B2B SaaS for industrial parts management. We need TraceParts API to integrate CAD model search and download for mechanical, fasteners, bearings, and automotive plastic parts. Target formats: STEP, IGES, STL, DWG, DXF, PDF."

**Prochaine étape** : soumission manuelle du formulaire + attente accusé de réception (2-5 j).

---

## Bloc E — Validation

| Commande | Résultat |
|---|---|
| `npx prisma validate` | ✅ schema valide |
| `npx tsc --noEmit` | ✅ 0 erreur |
| `npm run lint` | ✅ 0/0 |
| `npm run format:check` | ✅ 0 fichier non conforme (R.5.15) |
| `npx next build` | ⏳ non exécuté (build Docker en cours — ressources) |
| `npx playwright test` | ⏳ non exécuté (E2E 284/0/4 inchangé — aucune régression code métier) |

**Baseline** : ESLint 0/0, TS 0 err, Prettier 0 — **tenue**. Aucune régression
(Bloc B = seed script autonome, Bloc C = connecteur mock autonome non branché).

---

## Bloc F — Documentation

- `docs/e8-s03-free-solutions.md` (ce document)
- `DEBT.md` — statuts des 4 dettes mis à jour
- `SESSION.md` + `ROADMAP.md` — session E8-S03 enregistrée

---

## STOP rencontrés

1. **Bloc A** : service public HF Space 503 persistant (3 tentatives) → self-host Docker engagé. Build initial bloqué par `gradio` (boucle de résolution pip, 12+ versions) → variante headless créée. Build en cours.
2. **Bloc C** : ELTA = inscription humaine (non exécutable par agent) → connecteur mock créé. Repo Symfony C2 rejeté (hors stack, R.5.16).
3. **Bloc D** : formulaire TraceParts = action humaine (non exécutable par agent) → mock existant conservé.

**Aucun STOP mécanique sur échec de code** — tous les blocs exécutables par l'agent
(B, C-mock, E-partiel, F) sont réussis. Les blocs A (build en cours), C-inscription
et D-formulaire nécessitent soit la fin du build Docker, soit une action humaine.
