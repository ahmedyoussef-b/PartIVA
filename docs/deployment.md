# Guide de déploiement production — PartIVA

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S04)

---

## 1. Vue d'ensemble

PartIVA est déployé sur **Vercel** (Next.js 16 App Router) avec **PostgreSQL Neon** (pgvector 0.8.0).

**Composants :**
- **Frontend + API** : Vercel
- **DB** : Neon PostgreSQL
- **Auth** : BetterAuth (sessions DB)
- **Monitoring** : Sentry (optionnel)
- **Domaine** : à définir

---

## 2. Prérequis

- [ ] Compte Vercel (équipe + projet)
- [ ] Compte Neon (DB provisionnée)
- [ ] Domaine (optionnel)
- [ ] Compte Sentry (optionnel)

---

## 3. Variables d'environnement

**Référence exhaustive :** [docs/env-vars.md](env-vars.md) (E8-S05).

### 3.1 Obligatoires

| Variable | Objet | Source |
|---|---|---|
| `DATABASE_URL` | Connexion Neon PostgreSQL | Neon Dashboard |
| `BETTER_AUTH_SECRET` | Secret BetterAuth | `openssl rand -base64 32` |
| `BETTER_AUTH_URL` | URL publique de l'app | Domaine Vercel |

### 3.2 Optionnelles (fonctionnalités dégradées si absentes)

| Variable | Objet | Source |
|---|---|---|
| `TECDOC_API_KEY` | Connecteur TecDoc réel | Contrat TecDoc |
| `TECDOC_PROVIDER_ID` | Provider ID TecDoc | Contrat TecDoc |
| `TRACEPARTS_TENANT_UID` | Connecteur TraceParts | Contrat TraceParts |
| `TRACEPARTS_API_KEY` | Connecteur TraceParts | Contrat TraceParts |
| `HF_API_TOKEN` | Embeddings photo (HuggingFace) | Compte HF |
| `WIKIDATA_USER_AGENT` | User-Agent Wikidata | Défaut |
| `SENTRY_DSN` | Monitoring Sentry | Compte Sentry |

**⚠️ Sécurité #7 :** aucun token en `NEXT_PUBLIC_`.

**⚠️ R.5.10 :** variables d'env vides = absentes (ne pas définir `TECDOC_API_KEY=""`).

---

## 4. Procédure de déploiement

### 4.1 Première mise en production

```bash
# 1. Cloner le repo
git clone <repo-url>
cd partiva

# 2. Installer les dépendances
npm install

# 3. Configurer les variables d'env (Vercel Dashboard)
# - DATABASE_URL
# - BETTER_AUTH_SECRET
# - BETTER_AUTH_URL

# 4. Appliquer les migrations
npx prisma migrate deploy

# 5. Seed (optionnel — données de démonstration)
npx prisma db seed

# 6. Build local (vérification)
npm run build

# 7. Déployer sur Vercel
vercel --prod
```

### 4.2 Mise à jour

```bash
# 1. Récupérer les changements
git pull

# 2. Installer les dépendances
npm install

# 3. Appliquer les migrations
npx prisma migrate deploy

# 4. Déployer
vercel --prod
```

---

## 5. Migrations Prisma

### 5.1 Procédure standard

```bash
npx prisma migrate deploy
```

### 5.2 Drift GIN/HNSW (R.4.1-ter)

**Contexte :** Prisma ne modélise pas les index HNSW sur `Unsupported("vector(768)")`. L'index `part_images_embedding_hnsw` existe en DB. `migrate dev` tente de le dropper.

**Procédure manuelle :** voir [docs/migration-drift.md](migration-drift.md).

**En production :** utiliser `migrate deploy` (pas `migrate dev`).

---

## 6. Monitoring

### 6.1 Healthcheck

```
GET /api/health
```

Retourne `200` si l'app et la DB sont OK.

### 6.2 Sentry (optionnel)

- Configurer `SENTRY_DSN`
- Vérifier les erreurs dans le dashboard Sentry

### 6.3 Logs Vercel

- Dashboard Vercel → projet → Logs

---

## 7. Rollback

### 7.1 Rollback application

```bash
vercel rollback
```

### 7.2 Rollback migration

**⚠️ Prisma ne supporte pas le rollback automatique.**

Procédure manuelle :
1. Identifier la migration à annuler
2. Créer une migration inverse (`npx prisma migrate dev --create-only`)
3. Appliquer (`npx prisma migrate deploy`)

**Recommandation :** tester les migrations en staging avant production.

---

## 8. Checklist pré-déploiement

**Checklist exhaustive :** [docs/production-checklist.md](production-checklist.md) (E8-S05).

**Résumé :** variables obligatoires, migrations à jour, build vert, E2E 100%, aucun secret en `NEXT_PUBLIC_`.

---

## 9. Dettes bloquantes pour la production

| Dette | Sévérité | Impact |
|---|---|---|
| `D-deploy-comptes` | Moyenne | Vercel/Sentry/domaine non provisionnés |
| `D-tecdoc-credentials` | Moyenne | Connecteur TecDoc réel désactivé |
| `D-traceparts-credentials` | Moyenne | Connecteur TraceParts réel désactivé |
| `D-photo-embedding-backfill` | Moyenne | Embeddings photo désactivés |

**Conséquence :** l'app fonctionne en mode dégradé (mocks) sans ces credentials.

---

## 10. Références

- [docs/architecture.md](architecture.md) — Architecture
- [docs/migration-drift.md](migration-drift.md) — Drift migration
- [docs/e2e-constraints.md](e2e-constraints.md) — Contraintes E2E
- [README.md](../README.md) — README

---

**Fin du guide de déploiement — E8-S04.**
