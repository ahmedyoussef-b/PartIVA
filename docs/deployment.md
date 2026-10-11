# Déploiement PartIVA — Procédure

> Document de référence (E4-S07). Procédure de déploiement en production.
> **Statut** : procédure documentée — les comptes (Vercel, Sentry, domaine) sont à provisionner par le Coordinateur.

---

## 1. Architecture cible

| Composant | Choix | Statut |
|---|---|---|
| **Hébergeur web** | Vercel | 🟠 Compte à créer |
| **CI/CD** | GitHub Actions + Vercel auto | ✅ `.github/workflows/ci.yml` créé |
| **DB prod** | Neon PostgreSQL (pgvector) | 🟠 Branche prod à créer |
| **Monitoring** | Sentry + Vercel Analytics | 🟠 Comptes à créer |
| **Domaine** | À trancher | 🟠 Non acheté |
| **Desktop** | Tauri (auto-hébergé) | 🟡 Hors périmètre E4-S07 |

---

## 2. Prérequis (Coordinateur)

### 2.1 Comptes à créer

- [ ] **Vercel** (https://vercel.com) — compte + équipe
- [ ] **Sentry** (https://sentry.io) — compte + projet Next.js
- [ ] **Domaine** — achat + DNS
- [ ] **Neon** — branche prod (séparée du dev)

### 2.2 Secrets GitHub à provisionner

Dans **Settings → Secrets and variables → Actions** du repo `github.com/ahmedyoussef-b/PartIVA` :

| Secret | Source | Criticité |
|---|---|---|
| `DATABASE_URL` | Neon prod (pooler) | 🔴 Critique |
| `DIRECT_URL` | Neon prod (direct) | 🔴 Critique |
| `E2E_ADMIN_EMAIL` | seed dev | 🟡 Test |
| `E2E_ADMIN_PASSWORD` | seed dev | 🟡 Test |
| `E2E_USER_EMAIL` | seed dev | 🟡 Test |
| `E2E_USER_PASSWORD` | seed dev | 🟡 Test |
| `E2E_VIEWER_EMAIL` | seed dev | 🟡 Test |
| `E2E_VIEWER_PASSWORD` | seed dev | 🟡 Test |

**Sécurité #7** : aucun secret en `NEXT_PUBLIC_`. Les secrets serveur (`CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `HF_API_TOKEN`, `TRACEPARTS_*`) sont configurés dans **Vercel → Settings → Environment Variables**, jamais dans le repo.

### 2.3 Variables d'environnement Vercel

Dans **Vercel → Settings → Environment Variables** (Production + Preview) :

| Variable | Valeur | Type |
|---|---|---|
| `DATABASE_URL` | Neon prod pooler | Secret |
| `DIRECT_URL` | Neon prod direct | Secret |
| `NEXT_PUBLIC_APP_URL` | `https://<domaine>` | Public |
| `NEXT_PUBLIC_APP_MODE` | `production` | Public |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary | Public |
| `CLOUDINARY_API_KEY` | Cloudinary | Secret |
| `CLOUDINARY_API_SECRET` | Cloudinary | Secret |
| `HF_API_TOKEN` | Hugging Face | Secret (optionnel — dégradation gracieuse) |
| `TRACEPARTS_TENANT_UID` | TraceParts | Secret (optionnel — mode mock sinon) |
| `TRACEPARTS_API_KEY` | TraceParts | Secret (optionnel — mode mock sinon) |
| `WIKIDATA_USER_AGENT` | `PartIVA/1.0 (https://<domaine>; contact@<domaine>)` | Public |

---

## 3. CI/CD (GitHub Actions)

**Fichier** : `.github/workflows/ci.yml` (créé en E4-S07).

**Pipeline** (4 jobs) :

1. **lint** — ESLint + Prettier (`npm run lint`, `npm run format:check`)
2. **typecheck** — TypeScript (`npx tsc --noEmit`)
3. **build** — Next.js build (`npm run build`)
4. **e2e** — Playwright (`npm run test:e2e`) — dépend de lint + typecheck + build

**Déclenchement** : push sur `main` + PR vers `main`.

**Déploiement Vercel** : automatique (intégration GitHub → Vercel) — déclenché par push sur `main`. Preview deployments sur les PR.

---

## 4. Déploiement Vercel

### 4.1 Première fois

```bash
# 1. Installer Vercel CLI (local)
npm i -g vercel

# 2. Se connecter
vercel login

# 3. Importer le projet (depuis le dashboard Vercel)
#    ou en CLI :
vercel --prod

# 4. Configurer les variables d'environnement (§2.3)
vercel env add DATABASE_URL production
# ... etc.
```

### 4.2 Config Vercel

**Fichier** : `vercel.json` (créé en E4-S07) :
- Framework : Next.js
- Build : `npm run build`
- Output : `.next`
- Region : `cdg1` (Paris)

### 4.3 Déploiements

- **Production** : push sur `main` → auto-deploy
- **Preview** : PR → preview deployment (URL unique)
- **Rollback** : Vercel dashboard → Deployments → Instant Rollback

---

## 5. Base de données Neon prod

### 5.1 Branche prod

```bash
# Créer une branche prod (séparée du dev)
neon branches create --name prod --parent main

# Appliquer les migrations
npx prisma migrate deploy

# (Optionnel) Seed prod si nécessaire
npx tsx prisma/seed.ts
```

### 5.2 Migrations

```bash
# En CI/CD (automatique) — ou manuellement :
npx prisma migrate deploy
```

**Note** : `prisma migrate dev` est **interdit en prod** (génère des migrations + drift HNSW). Seul `migrate deploy` est autorisé.

---

## 6. Monitoring

### 6.1 Sentry (erreurs)

```bash
# Installer Sentry (si compte créé)
npx @sentry/wizard@latest -i nextjs
```

**Configuration** : `SENTRY_DSN` dans les env Vercel (secret).

### 6.2 Vercel Analytics (Web Vitals)

```bash
# Installer le package
npm install @vercel/analytics
```

**Intégration** : `<Analytics />` dans `src/app/layout.tsx`.

### 6.3 Vercel Logs

- Dashboard Vercel → Logs (temps réel)
- `vercel logs` en CLI

---

## 7. Smoke tests post-déploiement

**Documenté** (à activer quand l'app est déployée) :

| Endpoint | Attendu |
|---|---|
| `/` | 200 |
| `/api/search` (GET sans auth) | 401 |
| `/admin` | redirect `/login` |
| `/client/dashboard` | redirect `/login` |

**Manuel** :

```bash
curl -I https://<domaine>/
curl -I https://<domaine>/api/search
```

---

## 8. Sécurité prod

- **HTTPS** : Vercel (automatique, certificat Let's Encrypt)
- **Secrets** : jamais dans le repo (GitHub Secrets + Vercel env)
- **CSP** : via `next.config.mjs` (headers) — à configurer
- **Rate limiting** : Vercel (automatique) ou middleware
- **Backup DB** : Neon (automatique, PITR)

---

## 9. Checklist de déploiement

- [ ] Compte Vercel créé
- [ ] Compte Sentry créé
- [ ] Domaine acheté + DNS configuré
- [ ] Branche Neon prod créée
- [ ] Migrations appliquées (`prisma migrate deploy`)
- [ ] Secrets GitHub provisionnés (8 secrets)
- [ ] Variables Vercel configurées (§2.3)
- [ ] CI/CD vert (4 jobs)
- [ ] Premier déploiement Vercel réussi
- [ ] Smoke tests passés (§7)
- [ ] Sentry branché (DSN configuré)
- [ ] Analytics branché (`@vercel/analytics`)

---

## 10. Dépendances externes (bloquantes)

| Dépendance | Impact si absente | Session |
|---|---|---|
| Compte Vercel | Déploiement impossible | Coordinateur |
| Compte Sentry | Monitoring erreurs absent | Coordinateur |
| Domaine | URL de prod absente | Coordinateur |
| Branche Neon prod | DB prod absente | Coordinateur |

**Contournement** : E4-S07 produit la **documentation + la config** (CI/CD, vercel.json). Le déploiement réel attend les comptes.
