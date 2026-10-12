# 📋 RAPPORT DE CADRAGE — E5-S01 (Phase E5)

**Session :** E5-S01 (cadrage phase E5)
**Date :** 2026-10-12
**Exécutant :** Kilo Code (IA interne)
**Statut :** ✅ Cadrage produit — en attente validation Coordinateur (D1-D7)

---

## Bloc 0 — Reconnaissance des dépendances (R.5.1)

| Dépendance | Statut | Preuve | Impact |
|---|---|---|---|
| **Go** | ❌ **NON installé** | `go version` → `CommandNotFoundException` | OpenSERP sans Docker **non exécutable** |
| **Docker** | ❌ **NON installé** | `docker --version` → `CommandNotFoundException` (E4-clôture) | OpenSERP conteneurisé non exécutable |
| **Vercel CLI** | ❌ **NON provisionné** | `vercel --version` → `CommandNotFoundException` | Déploiement réel non exécutable |
| **HF_API_TOKEN** | ❌ Absent | `.env` non provisionné | `D-photo-embedding-backfill` bloquée |
| **TraceParts JWT** | ❌ Absent | `TRACEPARTS_TENANT_UID`/`_API_KEY` absents | `D-traceparts-credentials` bloquée |

**Conclusion :** les 5 dépendances externes E5 sont **absentes**. E5-S02 et E5-S03/E5-S04 produiront **doc + code** (déployable/exécutable après provisioning), même classe que E4-S02/E4-S07.

---

## Bloc 1 — Décisions D1-D9 (validées par le Superviseur)

| # | Décision | Statut |
|---|---|---|
| D1 | E5-S01 = cadrage | ✅ Validé |
| D2 | Périmètre E5 : mixte | ✅ Validé |
| D3 | Priorité 1 : déploiement placeholder « en cours de développement » | ✅ Validé |
| D4 | Nombre de sessions : non défini | ✅ Validé |
| D5 | Déploiement réel : session dédiée | ✅ Validé |
| D6 | TecDoc : mocker jusqu'à fin de développement | ✅ Acté |
| D7 | `D-completeness-*` : E6 | ✅ Acté |
| D8 | E4-S08 (OpenSERP) : fallback sans Docker (build depuis sources) | ✅ Acté — **conditionnel à Go** |
| D9 | E5-S01 = cadrage | ✅ Validé |

---

## Bloc 2 — Découverte OpenSERP sans Docker : analyse critique

**Découverte Superviseur :** OpenSERP peut être compilé sans Docker :
```bash
git clone https://github.com/karust/openserp.git
cd openserp && go build -o openserp . && ./openserp serve
```

**Analyse Exécutant :** la découverte est **valide mais conditionnelle**. Le build Go nécessite l'outilchain Go, **absent** de l'environnement (constat Bloc 0). Donc :

- `D-openserp-instance` n'est **pas débloquée** par cette découverte seule
- La dette passe de « bloquée Docker » à « bloquée Docker **OU** Go » — **deux voies de déblocage** au lieu d'une
- **Action Coordinateur :** provisionner **Go** (le plus léger, ~150 Mo) **OU** Docker Desktop (~500 Mo) — Go suffit pour OpenSERP

**Recommandation :** provisionner **Go** (plus léger, suffit pour OpenSERP). Docker reste utile pour d'autres usages (E3-S03-bis, T3 DB down) mais n'est plus le seul chemin.

---

## Bloc 3 — Cadrage E5-S02 (Déploiement placeholder)

### 3.1 Ajustements critiques au cadrage Superviseur

| # | Cadrage Superviseur | Ajustement Exécutant | Justification |
|---|---|---|---|
| **A1** | Placeholder remplace `/` | **Garder `/` (landing marketing existante)** + placeholder pour les zones fonctionnelles | `/` = `src/app/(public)/page.tsx` est déjà une landing complète (hero, secteurs, CTA). La remplacer détruit la vitrine publique. Le « en cours de développement » s'applique aux **fonctionnalités** (recherche, admin, client), pas à la landing |
| **A2** | Créer `src/middleware.ts` | **Étendre `src/proxy.ts`** (existant) | Next 16 a déprécié `middleware.ts` → `proxy.ts` (migration E0-S08, D72). Créer `middleware.ts` = conflit + régression |
| **A3** | Middleware bloque toutes les routes sauf `/` | **Middleware bloque `/admin/*` + `/client/*` + routes fonctionnelles**, laisse les pages publiques | Les pages publiques (`/services`, `/contact`, `/materiaux`, `/demande`, `/login`, `/register`) sont le funnel marketing — les bloquer casserait l'acquisition. Seules les zones **fonctionnelles** (recherche, admin, client) sont « en cours de développement » |

### 3.2 Périmètre E5-S02 ajusté

```
Bloc 0 — Reconnaissance (comptes Vercel, domaine, structure app) ✅ fait (Bloc 0)
Bloc A — Page placeholder « En cours de développement » (zone fonctionnelle)
Bloc B — Route /api/health (monitoring)
Bloc C — Extension src/proxy.ts (blocage zones fonctionnelles)
Bloc D — Configuration Vercel (déjà dans vercel.json — validation)
Bloc E — Déploiement réel (SI compte Vercel — sinon doc)
Bloc F — Validation (smoke tests)
Bloc G — DEBT.md + SESSION.md + ROADMAP.md
```

### 3.3 Architecture cible

**Routes accessibles en prod (placeholder) :**
- `/` → landing marketing (existante, gardée)
- `/services`, `/contact`, `/materiaux`, `/demande`, `/login`, `/register`, `/comment-ca-marche`, `/forgot-password` → pages publiques (existantes)
- `/api/health` → `{ status: 'ok' }` (nouvelle)
- `/admin/*`, `/client/*`, `/api/parts*`, `/api/search*`, `/api/requests*` → **bloquées** (redirect `/` ou 404 « en cours de développement »)

**Middleware (`src/proxy.ts` étendu) :**
```typescript
// Zones fonctionnelles bloquées en mode placeholder
const FUNCTIONAL_PREFIXES = ['/admin', '/client', '/api/parts', '/api/search', '/api/requests', '/api/upload', '/api/sync'];

if (isPlaceholderMode && FUNCTIONAL_PREFIXES.some(p => pathname.startsWith(p))) {
  return NextResponse.redirect(new URL('/?ref=dev', request.url));
}
```

**Mode placeholder :** variable d'env `NEXT_PUBLIC_PLACEHOLDER_MODE=true` (ou détection `VERCEL_ENV=production` sans features flags). Désactivable pour le dev local.

### 3.4 Questions E5-S02 (à trancher par le Coordinateur)

| # | Question | Options | Recommandation |
|---|---|---|---|
| **Q1** | Comptes Vercel provisionnés ? | Oui / Non | **À trancher** — si non, E5-S02 = doc + code (déployable plus tard) |
| **Q2** | Domaine acheté ? | Oui / Non | Si non → URL Vercel par défaut (`partiva.vercel.app`) |
| **Q3** | Périmètre : landing gardée + zones fonctionnelles bloquées ? | Oui / Non | **Oui** (ajustement A1/A3) |
| **Q4** | Routes : `/` + pages publiques + `/api/health` ? | Oui / Non | **Oui** |
| **Q5** | Middleware : étendre `src/proxy.ts` ? | Oui / Non | **Oui** (ajustement A2) |
| **Q6** | Mode placeholder : variable d'env ? | Oui / Non | **Oui** (`NEXT_PUBLIC_PLACEHOLDER_MODE`) |

### 3.5 Baseline cible E5-S02

| Métrique | Avant (E5-S01) | Après (E5-S02) |
|---|---|---|
| ESLint | 0/0 | 0/0 |
| TypeScript | 0 err | 0 err |
| Prettier | 0 | 0 |
| Build | 55 routes | 56 routes (+1 `/api/health`) |
| E2E | 233/0/3 | 233/0/3 (+ tests placeholder) |
| Prisma | 14 migrations | 14 migrations |
| Dettes | 5 (3 M + 2 F) | 5 (3 M + 2 F) — `D-deploiement-reel` ajoutée si comptes absents |

---

## Bloc 4 — Plan de phase E5 (proposé)

| Session | Objet | Type | Dépendances | Statut |
|---|---|---|---|---|
| **E5-S01** | Cadrage phase E5 | Cadrage | — | 🟢 Ce rapport |
| **E5-S02** | Déploiement placeholder | Infra | Comptes Vercel (optionnel) | 🟢 À exécuter |
| **E5-S03** | Déblocage dettes Moyennes (HF, TraceParts) | Technique | Token/JWT | 🟢 À cadrer |
| **E5-S04** | E4-S08 (OpenSERP) — build Go | Technique | **Go** (D1) | 🟠 Bloquée (Go absent) |
| **E5-S05** | TecDoc (mock) | Technique | — | 🟢 À cadrer |
| **E5-S06** | Nettoyage dettes Faibles | Technique | — | 🟢 À cadrer |
| **E5-clôture** | Audit phase E5 | Clôture | Toutes | 🟢 À cadrer |

**Note :** `D-completeness-*` reportées en E6 (D7). OpenSERP (E5-S04) bloquée tant que Go OU Docker absent.

---

## Bloc 5 — Décisions à prendre par le Coordinateur

| # | Décision | Options | Recommandation |
|---|---|---|---|
| **D1** | Go installé ? | Oui / Non | **Non** (constat) → provisionner Go OU Docker |
| **D2** | Comptes Vercel provisionnés ? | Oui / Non | **À trancher** |
| **D3** | Domaine acheté ? | Oui / Non | **À trancher** |
| **D4** | Périmètre : landing gardée + zones fonctionnelles bloquées ? | Oui / Non | **Oui** (A1/A3) |
| **D5** | Routes : `/` + publiques + `/api/health` ? | Oui / Non | **Oui** |
| **D6** | Middleware : étendre `src/proxy.ts` ? | Oui / Non | **Oui** (A2) |
| **D7** | Mode placeholder : variable d'env ? | Oui / Non | **Oui** |

**STOP-D :** Sans validation D1-D7, l'Exécutant reste en attente.

---

## Bloc 6 — Recommandation Exécutant

**E5-S02 est exécutable immédiatement** (aucune dépendance externe requise pour le code) :
- Page placeholder, `/api/health`, extension `src/proxy.ts`, mode placeholder — tout est **local**
- Le déploiement réel (Vercel) est **optionnel** — si compte absent, E5-S02 produit le code + doc (déployable en 1 commande après provisioning)

**Priorité Coordinateur (avant E5-S03/E5-S04) :**
1. **Go** (ou Docker) → débloque OpenSERP (E5-S04)
2. **HF_API_TOKEN** → débloque backfill embeddings
3. **TraceParts JWT** → débloque connecteur réel
4. **Compte Vercel** (optionnel) → débloque déploiement réel

**Après validation D1-D7 :** je produis le rapport E5-S02 (placeholder + health + middleware + doc déploiement).

---

**FIN DU CADRAGE E5-S01 — En attente D1-D7.**

**Note méta :** la découverte « OpenSERP sans Docker » est valide mais **conditionnelle à Go**. Le vrai déblocage est le **provisionnement Go** (ou Docker) par le Coordinateur. E5-S02 (placeholder) est indépendante des comptes externes — exécutable maintenant.
