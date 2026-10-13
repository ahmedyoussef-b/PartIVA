# Référence des variables d'environnement — PartIVA

**Date :** 2026-10-13
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

### 3.2 HuggingFace (embeddings photo)

| Variable | Objet | Source |
|---|---|---|
| `HF_API_TOKEN` | Token HuggingFace | Compte HF |

**Dette associée :** `D-photo-embedding-backfill` (Moyenne, E7).

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
