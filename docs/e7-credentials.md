# Credentials requis pour E7 — PartIVA

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S06)

---

## 1. Objectif

E7 (déblocage des 5 dettes Moyennes) nécessite des **credentials externes**. Ce document liste :

- Les credentials requis
- Leur source
- Leur procédure d'obtention
- Leur impact sur les fonctionnalités

**Sans ces credentials, E7 reste bloquée.**

---

## 2. Credentials requis

### 2.1 HuggingFace (embeddings photo)

| Credential | Variable | Source |
|---|---|---|
| Token API | `HF_API_TOKEN` | https://huggingface.co/settings/tokens |

**Procédure :**
1. Créer un compte HuggingFace
2. Settings → Access Tokens → New token (read)
3. Copier le token dans `.env.local` (dev) et Vercel Dashboard (prod)

**Impact :** active les embeddings photo (recherche visuelle).

**Dette associée :** `D-photo-embedding-backfill` (Moyenne).

---

### 2.2 TraceParts (connecteur pièces)

| Credential | Variable | Source |
|---|---|---|
| Tenant UID | `TRACEPARTS_TENANT_UID` | Contrat TraceParts |
| Clé API | `TRACEPARTS_API_KEY` | Contrat TraceParts |

**Procédure :**
1. Contacter TraceParts (https://www.traceparts.com)
2. Souscrire un contrat API
3. Récupérer Tenant UID + API Key

**Impact :** active le connecteur TraceParts réel (recherche pièces).

**Dette associée :** `D-traceparts-credentials` (Moyenne).

---

### 2.3 Vercel / Sentry / Domaine (déploiement)

| Credential | Variable | Source |
|---|---|---|
| Vercel | — | https://vercel.com |
| Sentry DSN | `SENTRY_DSN` | https://sentry.io |
| Domaine | — | Registrar (OVH, Gandi, etc.) |

**Procédure :**
1. Créer un compte Vercel (équipe + projet)
2. Créer un compte Sentry (projet)
3. Acheter un domaine

**Impact :** active le déploiement production réel.

**Dette associée :** `D-deploy-comptes` (Moyenne).

---

### 2.4 TecDoc / TecAlliance (connecteur auto-parts)

| Credential | Variable | Source |
|---|---|---|
| Clé API | `TECDOC_API_KEY` | Contrat TecDoc/TecAlliance |
| Provider ID | `TECDOC_PROVIDER_ID` | Contrat TecDoc/TecAlliance |

**Procédure :**
1. Contacter TecAlliance (https://www.tecalliance.net)
2. Souscrire un contrat TecDoc
3. Récupérer API Key + Provider ID

**Impact :** active le connecteur TecDoc réel (recherche pièces auto par véhicule/VIN).

**Dettes associées :** `D-tecdoc-credentials`, `D-tecdoc-auto-parts` (Moyennes).

---

## 3. Tableau récapitulatif

| Dette | Credential(s) | Source | Bloque E7 ? |
|---|---|---|---|
| `D-photo-embedding-backfill` | `HF_API_TOKEN` | HuggingFace | ⚠️ Partiel |
| `D-traceparts-credentials` | `TRACEPARTS_*` | TraceParts | ⚠️ Partiel |
| `D-deploy-comptes` | Vercel/Sentry/domaine | Multi | ⚠️ Partiel |
| `D-tecdoc-credentials` | `TECDOC_*` | TecDoc | ⚠️ Partiel |
| `D-tecdoc-auto-parts` | `TECDOC_*` | TecDoc | ⚠️ Partiel |

**Verdict :** E7 peut être **partiellement débloquée** si certains credentials sont disponibles. Chaque credential débloque une fonctionnalité.

---

## 4. Procédure de provisionnement

### 4.1 Développement

```bash
# 1. Copier .env.example
cp .env.example .env.local

# 2. Éditer .env.local avec les credentials réels
# HF_API_TOKEN=hf_...
# TRACEPARTS_TENANT_UID=...
# TRACEPARTS_API_KEY=...
# TECDOC_API_KEY=...
# TECDOC_PROVIDER_ID=...

# 3. Vérifier
npm run build
```

### 4.2 Production (Vercel)

1. Dashboard Vercel → projet → Settings → Environment Variables
2. Ajouter chaque credential (Production + Preview)
3. Redéployer

### 4.3 Vérification

```bash
# Local
curl http://localhost:3000/api/health

# Production
curl https://<domaine>/api/health
```

---

## 5. Sécurité

- **Sécurité #7** — Aucun credential en `NEXT_PUBLIC_`
- **R.5.10** — Variables d'env vides = absentes
- **Rotation** — Selon politique du fournisseur
- **Audit** — `grep -rn "NEXT_PUBLIC_" src/ | grep -iE "token|key|secret"`

---

## 6. Impact sur E7

| Credential fourni | Fonctionnalité activée | Session E7 |
|---|---|---|
| `HF_API_TOKEN` | Embeddings photo | E7-Sxx |
| `TRACEPARTS_*` | Connecteur TraceParts réel | E7-Sxx |
| Vercel/Sentry/domaine | Déploiement production | E7-Sxx |
| `TECDOC_*` | Connecteur TecDoc réel + auto-parts | E7-Sxx |

**E7 peut être cadrée session par session, selon les credentials disponibles.**

---

## 7. Références

- [docs/deployment.md](deployment.md) — Guide de déploiement
- [docs/env-vars.md](env-vars.md) — Variables d'environnement
- [DEBT.md](../DEBT.md) — Dettes
- [docs/e7-readiness.md](e7-readiness.md) — État de préparation E7

---

**Fin des credentials requis pour E7 — E8-S06.**
