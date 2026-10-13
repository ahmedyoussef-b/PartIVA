# Backfill embeddings photo — E7-S02-ter

**Date :** 2026-10-13
**Statut :** Partiel — code 3 providers commité (R.5.23), backfill en attente service

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
| **Lightweight** (self-host local) | `http://localhost:8000/v1/embeddings` | ✅ Gratuit | ✅ |
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

# 2. Lancer en Docker
docker compose up -d

# 3. Vérifier
curl http://localhost:8000/v1/models
```

### 3.3 Configuration `.env`

```bash
HF_API_URL=http://localhost:8000/v1/embeddings
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

## 6. Maintenance

- **Nouvelle image** : embedding calculé à l'upload (`POST /api/search/photo`, multi-search)
- **Backfill** : `npm run db:backfill-embeddings` (idempotent)
- **Service down** : vérifier `curl http://localhost:8000/v1/models`

---

## 7. Références

- [docs/env-vars.md](env-vars.md) — Variables d'environnement
- [DEBT.md](../DEBT.md) — Dettes
- Space Lightweight : https://huggingface.co/spaces/lamhieu/lightweight-embeddings

---

**Fin du rapport backfill — E7-S02-ter.**
