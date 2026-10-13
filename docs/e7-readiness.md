# État de préparation E7 — PartIVA

**Date :** 2026-10-13
**Auteur :** Superviseur IA
**Statut :** Validé (E8-S06)

---

## 1. Objectif

E7 (déblocage des 5 dettes Moyennes) est **bloquée** par des credentials externes. Ce document évalue l'état de préparation :

- Ce qui est prêt
- Ce qui manque
- Ce qui peut être débloqué

---

## 2. Dettes E7

| Dette | Sévérité | Credential requis | Statut |
|---|---|---|---|
| `D-photo-embedding-backfill` | Moyenne | `HF_API_TOKEN` | 🟠 Bloquée |
| `D-traceparts-credentials` | Moyenne | `TRACEPARTS_*` | 🟠 Bloquée |
| `D-deploy-comptes` | Moyenne | Vercel/Sentry/domaine | 🟠 Bloquée |
| `D-tecdoc-credentials` | Moyenne | `TECDOC_*` | 🟠 Bloquée |
| `D-tecdoc-auto-parts` | Moyenne | `TECDOC_*` | 🟠 Bloquée |

**5/5 bloquées.**

---

## 3. Ce qui est prêt

- ✅ Code : baseline tenue (59 routes, 284 E2E, 15 migrations)
- ✅ Connecteurs : mock/API (bascule automatique si credentials)
- ✅ Data layer : prêt pour credentials
- ✅ Routes API : `/api/search/vehicle`, `/api/search/vin` opérationnelles
- ✅ Documentation : `docs/e7-credentials.md`, `docs/deployment.md`, `docs/env-vars.md`
- ✅ Checklist production : `docs/production-checklist.md`

---

## 4. Ce qui manque

- 🟠 `HF_API_TOKEN` (HuggingFace)
- 🟠 `TRACEPARTS_TENANT_UID`, `TRACEPARTS_API_KEY` (TraceParts)
- 🟠 Vercel/Sentry/domaine (comptes)
- 🟠 `TECDOC_API_KEY`, `TECDOC_PROVIDER_ID` (TecDoc)

---

## 5. Options

### 5.1 Option A — Provisionner tous les credentials

**Avantages :** E7 complète en une phase.
**Inconvénients :** coût (contrats TecDoc/TraceParts), temps.

### 5.2 Option B — Provisionner partiellement

**Avantages :** E7 session par session, selon les credentials disponibles.
**Inconvénients :** E7 fragmentée.

### 5.3 Option C — Reporter E7

**Avantages :** aucune action immédiate.
**Inconvénients :** dettes Moyennes non résolues.

**Recommandation (R.5.21) :** Option B — provisionner progressivement.

---

## 6. Impact sur E8

E8 peut être **clôturée** sans E7. E7 est **indépendante** d'E8.

**Séquence recommandée :**
1. E8-S06 (ce document)
2. E8-clôture
3. E7 (si credentials disponibles) ou E8+ (stabilisation continue)

---

## 7. Références

- [docs/e7-credentials.md](e7-credentials.md) — Credentials requis
- [DEBT.md](../DEBT.md) — Dettes
- [docs/deployment.md](deployment.md) — Déploiement

---

**Fin de l'état de préparation E7 — E8-S06.**
