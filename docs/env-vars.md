# Référence des variables d'environnement — PartIVA

**Date :** 2026-10-13 (MAJ 2026-10-14 — E7-S02-reprise §3.2 Embeddings · E7-S06 §3.8 AWS S3)
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S05)

---

## 1. Règles

- **Sécurité #7** — Aucun token/key/secret en `NEXT_PUBLIC_`
- **R.5.10** — Variables d'env vides = absentes (ne pas définir `VAR=""`)
- **`.env.example`** — Référence exhaustive, sans valeurs réelles
- **`.env.local`** — Non commité (`.gitignore`)

---

## 2. Variables obligatoires

| Variable | Objet | Obligatoire en | Exemple |
|---|---|---|---|
| `DATABASE_URL` | Connexion PostgreSQL (pooler) | dev + prod | `postgresql://...` |
| `DIRECT_URL` | Connexion PostgreSQL (directe, migrations) | dev + prod | `postgresql://...` |
| `BETTER_AUTH_SECRET` | Secret BetterAuth | dev + prod | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL publique | dev + prod | `http://localhost:3000` / `https://...` |

---

## 3. Variables optionnelles (fonctionnalités dégradées si absentes)

### 3.1 Cloudinary (images)

| Variable | Objet | Source |
|---|---|---|
| `CLOUDINARY_CLOUD_NAME` | Nom du cloud | Cloudinary Dashboard |
| `CLOUDINARY_API_KEY` | Clé API | Cloudinary Dashboard |
| `CLOUDINARY_API_SECRET` | Secret API | Cloudinary Dashboard |

### 3.2 Embeddings (3 providers — E7-S02-ter, configuré E7-S02-reprise)

Le code (`src/lib/embeddings.ts`) supporte **3 providers** d'embeddings, détectés automatiquement via `HF_API_URL`. CLIP (image → vecteur 768 dims) est requis pour la recherche visuelle (pgvector).

| Provider | `HF_API_URL` | Coût | CLIP ? |
|---|---|---|---|
| **Lightweight** (self-host local) | `http://localhost:7860/v1/embeddings` | ✅ Gratuit | ✅ Oui |
| **DeepInfra** | `https://api.deepinfra.com/v1/inference` | 💰 ~$0.005/1M tokens | ✅ Oui |
| **HuggingFace** (hf-inference) | `https://router.huggingface.co/hf-inference/models` | ✅ Gratuit | ❌ Non |

| Variable | Objet |
|---|---|
| `HF_API_URL` | Endpoint du provider |
| `HF_API_TOKEN` | Token (vide pour Lightweight self-host) |
| `HF_EMBEDDING_MODEL` | Modèle d'embedding (ex : `siglip-base-patch16-256-multilingual`) |

**Configuration active (E7-S02-reprise, 2026-10-14) :** **Lightweight self-host local par défaut** — conteneur Docker `lwe` (image `lightweight-embeddings`, healthcheck `healthy`) sur le port `7860`, modèle `siglip-base-patch16-256-multilingual` (768 dims). Démarrage : `docker run -d --name lwe -p 7860:7860 -e LWE_MODELS_PRELOAD=siglip-base-patch16-256-multilingual lightweight-embeddings`. Vérification : `curl http://localhost:7860/v1/models`. Détails : `docs/e7-s02-embeddings.md` §6.

**Dette associée :** `D-photo-embedding-backfill` — ✅ **clôturée en E7-S02-reprise** (backfill 5/5 images, `missing=0`, dimension 768, index HNSW intact).

**Sécurité #7 :** `HF_API_TOKEN` jamais en `NEXT_PUBLIC_`.

### 3.3 TraceParts (connecteur)

| Variable | Objet | Source |
|---|---|---|
| `TRACEPARTS_TENANT_UID` | Tenant UID | Contrat TraceParts |
| `TRACEPARTS_API_KEY` | Clé API | Contrat TraceParts |

**Dette associée :** `D-traceparts-credentials` (Moyenne, E7).

### 3.4 TecDoc (connecteur)

| Variable | Objet | Source |
|---|---|---|
| `TECDOC_API_KEY` | Clé API | Contrat TecDoc |
| `TECDOC_PROVIDER_ID` | Provider ID | Contrat TecDoc |

**Dettes associées :** `D-tecdoc-credentials`, `D-tecdoc-auto-parts` (Moyennes, E7).

### 3.5 Wikidata (connecteur)

| Variable | Objet | Défaut |
|---|---|---|
| `WIKIDATA_USER_AGENT` | User-Agent | `PartIVA/1.0` |

### 3.6 Placeholder (mode démo)

| Variable | Objet | Valeurs |
|---|---|---|
| `NEXT_PUBLIC_PLACEHOLDER_MODE` | Mode placeholder | `true` / `false` |

**Note :** `NEXT_PUBLIC_` autorisé car **non sensible** (mode démo).

### 3.7 Admin (seed production — E7-S01)

| Variable | Objet | Obligatoire en |
|---|---|---|
| `ADMIN_EMAIL` | Email admin réel | prod |
| `ADMIN_PASSWORD` | Mot de passe admin réel (≥ 12 caractères, mixte) | prod |
| `ADMIN_NAME` | Nom admin | prod (défaut : `Admin PartIVA`) |

**Note :** si absents, les utilisateurs mock sont utilisés (dev uniquement).
**Sécurité #7 :** jamais en `NEXT_PUBLIC_`.
**R.5.10 :** variable vide = absente.
**E2E :** `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD` prévalent, puis `ADMIN_EMAIL`/`ADMIN_PASSWORD`, puis mock.

### 3.8 AWS S3 (non utilisé actuellement — E7-S06)

| Variable | Objet | Statut |
|---|---|---|
| `AWS_ACCESS_KEY_ID` | Clé AWS | Fournie (non utilisée) |
| `AWS_SECRET_ACCESS_KEY` | Secret AWS | Fourni (non utilisé) |
| `AWS_REGION` | Région AWS | Fournie (non utilisée) |
| `AWS_ENDPOINT_URL_S3` | Endpoint S3 | Fourni (non utilisé) |

**Note :** PartIVA utilise **Cloudinary** pour le stockage d'images. AWS S3 n'est **pas utilisé** par le code applicatif (vérifié E7-S06, 2026-10-14 — aucune occurrence `AWS_`/`S3Client`/`@aws-sdk` dans `src/`, `scripts/`, `prisma/`, `e2e/` ; aucune dépendance `@aws-sdk` dans `package.json`).

**Origine des variables :** les variables `AWS_*` sont **injectées par Neon** (endpoint S3 de la branche Neon, compatible S3 — ex. `https://br-<branch>.storage.c-<region>.aws.neon.tech`). Elles sont fournies automatiquement par la plateforme et ne sont **pas exploitées** par PartIVA.

**Usage futur :** S3 (via Neon Object Storage ou un provider S3) reste une option pour backup/archivage — à cadrer le jour d'un besoin réel. Voir les skills Neon (`neon-object-storage`) si cette voie est retenue.

**Sécurité #7 :** `AWS_SECRET_ACCESS_KEY` et `AWS_ACCESS_KEY_ID` jamais en `NEXT_PUBLIC_`.

---

## 4. Variables par environnement

| Variable | dev | staging | prod |
|---|---|---|---|
| `DATABASE_URL` | ✅ | ✅ | ✅ |
| `DIRECT_URL` | ✅ | ✅ | ✅ |
| `BETTER_AUTH_SECRET` | ✅ | ✅ | ✅ |
| `BETTER_AUTH_URL` | ✅ | ✅ | ✅ |
| `CLOUDINARY_*` | ⚠️ | ✅ | ✅ |
| `HF_API_TOKEN` | ⚠️ | ⚠️ | ✅ |
| `TRACEPARTS_*` | ⚠️ | ⚠️ | ✅ |
| `TECDOC_*` | ⚠️ | ⚠️ | ✅ |
| `WIKIDATA_USER_AGENT` | ✅ | ✅ | ✅ |
| `NEXT_PUBLIC_PLACEHOLDER_MODE` | ✅ | ❌ | ❌ |
| `ADMIN_EMAIL` | ⚠️ | ✅ | ✅ |
| `ADMIN_PASSWORD` | ⚠️ | ✅ | ✅ |
| `ADMIN_NAME` | ⚠️ | ✅ | ✅ |
| `AWS_*` (non utilisées) | ⚠️ | ⚠️ | ⚠️ |

**Légende :** ✅ requis · ⚠️ optionnel · ❌ interdit

---

## 5. Sécurité

### 5.1 Tokens

- **Jamais** en `NEXT_PUBLIC_` (Sécurité #7)
- **Jamais** dans le code source
- **Jamais** dans `.env.example` (valeurs factices uniquement)
- **Toujours** dans `.env.local` (non commité) ou Vercel Dashboard

### 5.2 Rotation

- **`BETTER_AUTH_SECRET`** : rotation annuelle recommandée
- **Tokens tiers** : rotation selon politique du fournisseur

### 5.3 Audit

```bash
grep -rn "NEXT_PUBLIC_" src/ | grep -iE "token|key|secret|password"
```

**Attendu :** aucune occurrence.

---

## 6. Procédure de configuration

### 6.1 Développement

```bash
cp .env.example .env.local
# Éditer .env.local avec les valeurs réelles
```

### 6.2 Production (Vercel)

1. Dashboard Vercel → projet → Settings → Environment Variables
2. Ajouter chaque variable (Production + Preview)
3. Redéployer

### 6.3 Vérification

```bash
# Local
npm run build

# Production
curl https://<domaine>/api/health
```

---

## 7. Références

- [docs/deployment.md](deployment.md) — Guide de déploiement
- [docs/production-checklist.md](production-checklist.md) — Checklist production
- [.env.example](../.env.example) — Référence

---

**Fin de la référence des variables d'environnement — E8-S05.**
