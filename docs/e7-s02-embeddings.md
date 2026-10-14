# Backfill embeddings photo — E7-S02-ter + E7-S02-reprise

**Date :** 2026-10-13 (E7-S02-ter) · 2026-10-14 (E7-S02-reprise)
**Statut :** ✅ **Clôturée** — code 3 providers commité (R.5.23) + backfill exécuté via Lightweight self-host local (E7-S02-reprise)

---

## 1. Contexte

Les embeddings photo permettent la **recherche visuelle** (similarité cosinus via pgvector).

**Dette :** `D-photo-embedding-backfill` (Moyenne).

**Modèle requis :** CLIP (image → vecteur 768 dims) — compatible avec l'index HNSW `part_images_embedding_hnsw`.

---

## 2. Providers supportés (3)

Le code (`src/lib/embeddings.ts`) supporte **3 providers**, détectés automatiquement via `HF_API_URL` :

| Provider | URL | Coût | CLIP |
|---|---|---|---|
| **Lightweight** (self-host local) | `http://localhost:7860/v1/embeddings` | ✅ Gratuit | ✅ |
| **DeepInfra** | `https://api.deepinfra.com/v1/inference` | 💰 ~$0.005/1M tokens | ✅ |
| **HuggingFace** (hf-inference) | `https://router.huggingface.co/hf-inference/models` | ✅ Gratuit | ❌ |

**Format API :**
- **Lightweight** : `POST {base}` body `{ model, input }` (URL image ou data-url base64), réponse OpenAI-compat `{ data: [{ embedding }] }`, aucun token
- **DeepInfra** : `POST {base}/{model}` body `{ input: <data-url> }`, réponse `{ embeddings: [[...]] }`
- **HuggingFace** : body binaire octet-stream, réponse `[0.1, ...]`

---

## 3. Solution recommandée : Lightweight self-host (100% gratuit)

### 3.1 Pourquoi

- ✅ 100% gratuit
- ✅ 100% local (pas de dépendance externe)
- ✅ Aucune limite d'usage
- ✅ CLIP supporté (768 dims)
- ✅ Compatible avec le code actuel

### 3.2 Installation

```powershell
# 1. Cloner le Space (open source)
git clone https://huggingface.co/spaces/lamhieu/lightweight-embeddings
cd lightweight-embeddings

# 2. Construire l'image Docker (variante headless — sans gradio)
docker build -t lightweight-embeddings .

# 3. Lancer le conteneur (port 7860, modèle SigLIP préchargé)
docker run -d --name lwe -p 7860:7860 -e LWE_MODELS_PRELOAD=siglip-base-patch16-256-multilingual lightweight-embeddings

# 4. Vérifier
docker ps --filter "name=lwe"
curl http://localhost:7860/v1/models
```

### 3.3 Configuration `.env`

```bash
HF_API_URL=http://localhost:7860/v1/embeddings
HF_API_TOKEN=
HF_EMBEDDING_MODEL=siglip-base-patch16-256-multilingual
```

### 3.4 Backfill

```powershell
npm run db:backfill-embeddings
```

---

## 4. Alternative : CLIP server Python local

Si Docker n'est pas disponible, un serveur Python local avec `sentence-transformers` (voir §3.2 du rapport Superviseur). Même API OpenAI-compatible.

---

## 5. Résultat attendu (après backfill)

| Indicateur | Valeur |
|---|---|
| Images totales | 5 |
| Avec embedding | 5 |
| Manquantes | 0 |
| Dimensions | 768 |
| Index HNSW | ✅ intact |

---

## 6. Résultats E7-S02-reprise

**Date :** 2026-10-14 · **Résultat :** ✅ backfill exécuté, `D-photo-embedding-backfill` clôturée.

### 6.1 Configuration retenue

**Lightweight self-host local** (Docker) :

| Paramètre | Valeur |
|---|---|
| Image | `lightweight-embeddings:latest` (variante headless — sans gradio) |
| Conteneur | `lwe` — `Up (healthy)` |
| Port | `7860` (API OpenAI-compatible `/v1/embeddings`, `/v1/models`) |
| Modèle | `siglip-base-patch16-256-multilingual` (CLIP, image → vecteur 768 dims) |
| Coût | 0 € (local, aucune dépendance externe) |

Variables `.env` (non commité) :

```bash
HF_API_URL=http://localhost:7860/v1/embeddings
HF_API_TOKEN=
HF_EMBEDDING_MODEL=siglip-base-patch16-256-multilingual
```

### 6.2 Commande Docker

```powershell
docker run -d --name lwe -p 7860:7860 -e LWE_MODELS_PRELOAD=siglip-base-patch16-256-multilingual lightweight-embeddings
```

Le modèle est préchargé au démarrage (`loaded: true` sur `GET /v1/models`).

### 6.3 Test API (R.5.16)

```powershell
curl.exe -s -H "Content-Type: application/json" -X POST "http://localhost:7860/v1/embeddings" -d '{"model":"siglip-base-patch16-256-multilingual","input":"https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400"}'
```

Résultat : `HTTP 200` — `data[0].embedding` = **768 nombres**. Testé avec une image réelle avant backfill.

### 6.4 Résultat du backfill

```powershell
npm run db:backfill-embeddings
```

```
BACKFILL_RESULT: { "total": 5, "processed": 5, "succeeded": 5, "failed": 0, "skipped": 0, "errors": [] }
```

### 6.5 Vérifications post-backfill

| Vérification | Requête | Résultat |
|---|---|---|
| Compteurs | `COUNT(embedding)` sur `part_images` | `total=5, with_emb=5, missing=0` ✅ |
| Dimension | `vector_dims(embedding)` | `768` ✅ (compatible HNSW) |
| Index HNSW | `pg_indexes` (`LIKE '%hnsw%'`) | `part_images_embedding_hnsw` ✅ intact |

**Conséquence :** le backend `POST /api/search/photo` est débloqué — les embeddings ne sont plus NULL, la recherche visuelle par similarité cosinus est opérationnelle.

---

## 7. Maintenance

- **Nouvelle image** : embedding calculé à l'upload (`POST /api/search/photo`, multi-search)
- **Backfill** : `npm run db:backfill-embeddings` (idempotent)
- **Service down** : vérifier `curl http://localhost:7860/v1/models`
- **Conteneur** : `docker ps --filter "name=lwe"` (attendu : `Up ... (healthy)`)

---

## 8. Références

- [docs/env-vars.md](env-vars.md) — Variables d'environnement
- [DEBT.md](../DEBT.md) — Dettes
- Space Lightweight : https://huggingface.co/spaces/lamhieu/lightweight-embeddings

---

**Fin du rapport backfill — E7-S02-ter + E7-S02-reprise.**
