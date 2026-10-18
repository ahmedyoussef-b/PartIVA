# 🗺️ Feuille de Route Stratégique PartIVA — Vision Superviseur

Document de référence **officiel**. À conserver dans `F:\PartIVA\ROADMAP.md` et à charger par Kilo Code à chaque session.

---

## 🎯 Vision Cible — 1 paragraphe

**PartIVA n'est pas un site de fabrication. C'est une plateforme industrielle de connaissance qui transforme chaque pièce physique en donnée numérique réutilisable.** La boucle `pièce → donnée → connaissance → nouvelle pièce` est l'actif central. Tout ce qui ne sert pas cette boucle est secondaire.

**Position Superviseur** : la vision fournie est excellente et cohérente. Elle devient **la constitution du projet**. Aucune session ne peut la contredire sans validation explicite.

---

## 🖥️ MODE HYBRIDE — Web + Desktop Tauri

PartIVA est une **application hybride** :

- **Mode web** : pages publiques + dashboards admin/client
- **Mode desktop Tauri** : application locale Windows (`.msi` / `.exe`)
- **Page admin de téléchargement** : le dashboard admin doit proposer les installeurs

### Décisions critiques à trancher avant E7-S01

1. **Mode données desktop** : offline-first (SQLite local) ou online-only (API) ?
2. **Auth desktop** : device flow OAuth, token long-lived, ou licence locale ?
3. **Sync desktop ↔ cloud** : comment gérer les conflits ?

### Principe constitutionnel additionnel

- **N°9** : *Le code métier (schémas, validations, logique) doit être partageable entre web et desktop. Aucune logique dupliquée.*
- **N°10** : *Toute fonctionnalité web doit être pensée "desktop-compatible" dès sa conception, même si le desktop arrive en E7.*

---

## 📊 Vue Globale — 9 Étapes, 1 Fondation, 1 Desktop, 1 Finalisation

```
┌──────────────────────────────────────────────────────────────────┐
│  E0 · FONDATION TECHNIQUE           ← PRIORITÉ ABSOLUE           │
│  Rendre l'existant réel : DB, Auth, Sécurité, Qualité            │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E1 · MODÈLE MÉTIER & DOSSIER NUMÉRIQUE                          │
│  ID pièce unique, dossier complet, statuts, historique           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E2 · IDENTIFICATION MULTIMODALE & MOTEUR DE RECHERCHE           │
│  Photo/texte/réf/dimensions + score + sources internes           │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E3 · SOURCES EXTERNES & PIPELINE INTELLIGENT                    │
│  TraceParts, CADENAS/3Dfindit, catalogues, branchement pipeline  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E4 · ACQUISITION INTELLIGENTE & REVERSE ENGINEERING             │
│  Assistant de mesure, scan 3D, reconstruction CAO                │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E5 · INTELLIGENCE & APPRENTISSAGE                               │
│  Similarité géométrique, détection usure, recommandations        │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E6 · ÉCOSYSTÈME CLIENT & BIBLIOTHÈQUE ENTREPRISE                │
│  Espace entreprise, machines, versions, commandes, docs          │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E7 · DESKTOP TAURI                                               │
│  Application desktop Windows packagée, synchronisée, distribuable │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│  E8 · FINALISATION, QA & DÉPLOIEMENT PRODUCTION                  │
│  Tests, perf, SEO, monitoring, CI/CD, prod                       │
└──────────────────────────────────────────────────────────────────┘
```

**Total : 9 étapes (E0 → E8)**, chacune découpée en sessions, chaque session en sous-sessions.

---

## 📋 Règle de Découpage

| Niveau | Définition | Durée cible |
|---|---|---|
| **Étape (E)** | Grand bloc thématique livrable | 1 à 4 semaines |
| **Session (S)** | Objectif unique, livrable vérifiable | 1 à 3 jours |
| **Sous-session (S.S)** | Tâche atomique, 1 ordre Kilo | 1 à 4 heures |

**Numérotation officielle** : `E{étape}-S{session}-{sous-session}`
Exemple : `E0-S01-2` = étape 0, session 1, sous-session 2.

---

## 🏗️ E0 — FONDATION TECHNIQUE
**Objectif** : rendre l'existant réel. Sans cette étape, tout le reste est un décor.

**Justification Superviseur** : le rapport d'état des lieux a révélé que la DB est vide, l'auth est un mock, la sécurité est absente, la qualité est non configurée. **Rien ne peut être construit sur du sable.**

| Session | Objectif | Livrable | Priorité |
|---|---|---|---|
| **E0-S01** | Nettoyage infra & sécurisation du repo | `.env` sorti du git, vulns corrigées, `.gitignore` durci | 🔴 Critique |
| **E0-S02** | Setup qualité (ESLint, Prettier, scripts) | `npm run lint` et `npm run format` fonctionnels | 🟠 Haute |
| **E0-S02b** | Décision version Prisma (6 stable vs 7 canary) | Version figée avant schéma | 🔴 Critique |
| **E0-S02c** | Résorption erreurs ESLint | Code applicatif nettoyé (138 erreurs → 0 / 0 warning / 198 fichiers Prettier → 0) | ✅ Terminée |
| **E0-S02-4** | Scripts + validation finale + tailwind plugin | `prettier-plugin-tailwindcss` installé, scripts cohérents, build OK | ✅ Terminée |
| **E0-S03** | Schéma Prisma réel (noyau métier) | User, Part, Request, Material, Machine, Status | 🔴 Critique |
| **E0-S04** | Branchement DB réel (remplacement mocks par Prisma) | `mock-data.ts` supprimé, Server Components/Server Actions/API routes branchés sur Prisma | 🔴 Critique |
| **E0-S05** | Auth réelle (BetterAuth) | Inscription, connexion, session persistante, filtrage user client | ✅ Terminée |
| **E0-S06** | Middleware & protection des routes + remplacement mocks admin | `/admin/*` et `/client/*` protégés, mocks admin remplacés par DB | ✅ Terminée |
| **E0-S07** | Remplacement des mocks par DB réelle | `mock-data.ts` supprimé, tout branche sur Prisma | 🔴 Critique |
| **E0-S08** | Migration Next 14 → 16 | Upgrade Next.js + vérification compatibilité | 🟠 Haute |
| **E0-S09** | Migration Tailwind 3 → 4 | Upgrade Tailwind + adaptation config | 🟡 Moyenne |

**Définition de "E0 terminée"** : l'app démarre, un utilisateur peut s'inscrire, se connecter, créer une pièce, la voir persister en DB, et les zones admin/client sont inaccessibles sans rôle adéquat.

**Durée estimée** : 2-3 semaines de sessions.

### Sessions E0 complétées

| Session | Objet | Statut |
|---|---|---|
| E0-S01 | Sécurisation infra | ✅ |
| E0-S02 | Setup qualité | ✅ |
| E0-S02b | Décision Prisma 7 | ✅ |
| E0-S02c | Résorption qualité (138→0) | ✅ |
| E0-S03 | Schéma Prisma + migration + seed | ✅ |
| E0-S04 | Branchement DB réel | ✅ |
| E0-S05 | Auth BetterAuth | ✅ |
| E0-S06 | Middleware & protection + remplacement mocks | ✅ |
| E0-S07 | SearchCandidate Prisma + Playwright E2E (103 tests E2E) | ✅ |
| E0-S07b | Matrice E2E par rôle + routes dynamiques avec IDs | ✅ | 103 tests E2E |
| E0-S07b-3 | Dettes résiduelles E2E (cookies, /api/auth, /api/sync) | ✅ | 110 tests E2E |
| E0-S08 | Dettes techniques transverses (Zod 4, ESLint 9, Next 16, pg sslmode, middleware→proxy) | ✅ | 5505744 |
| E0-S09 | React 19 + Tailwind 4 + résorption poids morts | ✅ | 341f0e4 |
| E0-S10 | Migration forwardRef → ref comme prop (React 19) | ✅ | d48704c |

---

## 🏗️ E1 — MODÈLE MÉTIER & DOSSIER NUMÉRIQUE
**Objectif** : donner à chaque pièce une identité et un dossier complet.

| Session | Objectif | Livrable |
|---|---|---|
| **E1-S01** | Système d'ID unique pièce | Format `PTV-AAAA-NNNNNN` généré et garanti unique |
| **E1-S02** | Modèle dossier numérique complet | Schéma Prisma étendu : photos, mesures, docs, versions |
| **E1-S03** | Système d'états (workflow pièce) | Réception → Identification → … → Archivée |
| **E1-S04** | Historique & versions | Traçabilité de toutes modifications |
| **E1-S05** | Upload & gestion de fichiers | Photos, PDF, CAO, scans (Cloudinary) |
| **E1-S06** | Interface "Nouvelle pièce" | Formulaire complet de création de dossier |
| **E1-S07** | Vue dossier pièce | Page centrale affichant tout l'historique |

**Définition de "E1 terminée"** : un utilisateur peut créer un dossier pièce complet avec photos, mesures, docs, et suivre son évolution.

**Durée estimée** : 2-3 semaines.

---

## 🏗️ E2 — IDENTIFICATION MULTIMODALE & MOTEUR DE RECHERCHE
**Objectif** : permettre à l'utilisateur de partir de ce qu'il a (photo, texte, réf, dimensions) et d'obtenir un score de correspondance.

| Session | Objectif | Livrable |
|---|---|---|
| **E2-S01** | Recherche interne PartIVA | Moteur interrogeant la BDD pièces |
| **E2-S02** | Recherche par référence | Matching exact/fuzzy sur références |
| **E2-S03** | Recherche par spécifications | Full-text sur `PartSpecification` (matière, valeurs techniques) — *redéfini 2026-10-10 (cf. memo E2-S03 Q1–Q5) : « fonction » non modélisé côté pièce (existe sur `Request` uniquement, l.291), « fabricant » reporté à E2-S06 (N:N, signal de score)* |
| **E2-S04** | Recherche par dimensions | Prédicats range sur `PartSpecification` (`value` nominal + `toleranceMin/Max`) — *précisé 2026-10-10 (cf. memo E2-S04 Q1–Q10) : deux `matchMode` `nominal` (range valeur) / `tolerance` (tolérance couvrante), cast sécurisé `value ~ '^[0-9.]+$'`* |
| **E2-S05** | Recherche par photo | Upload + similarité visuelle — *réalisé 2026-10-10 : colonne `embedding vector(768)` sur `PartImage` (pgvector), index HNSW `part_images_embedding_hnsw` (cosine), service embeddings (HF Inference API, `clip-ViT-B-32`), API `POST /api/search/photo` (similarité cosinus `<=>`), backfill `scripts/backfill-embeddings.ts`. HF_API_TOKEN absent en env → embeddings NULL (R3, comportement documenté)* |
| **E2-S06** | Système de score multi-critères | Score pondéré unifié — *réalisé 2026-10-10 : table `scoring_weights` (poids égaux 0.2, D131), `src/lib/scoring.ts` (min-max + renormalisation), `src/lib/data/multi-search.ts` (agrégation 5 signaux : texte min-max, référence exact=1.0/préfixe=0.5, specs min-max, dimensions binaire 1/0, photo similarité cosinus), route unifiée `GET /api/search?mode=multi` (POST E0-S07 préservé), UI onglet « Multi » + badge score + breakdown repliable, 4 tests E2E. Photo exclue silencieusement si `HF_API_TOKEN` absent (renormalisation). Dettes : `D-embedding-model-catalog`, `D-scoring-weights-ui`* |
| **E2-S07** | Détection des informations manquantes | "Il manque : diamètre int, profondeur, entraxe" — *réalisé 2026-10-10 : `REQUIRED_SPEC_KEYS` (constante TS, 8 clés dimensionnelles, distincte de `DIMENSION_KEYS`), `getPartCompleteness()` (score = présent/total), API `GET /api/parts/[id]/completeness` (`{partId, score, total, present, missing}`), UI badge « complétude N % » (couleur conditionnelle) + « Il manque : X, Y, Z » dans l'onglet Mesures, 5 tests E2E. Suggestion passive (aucun blocage workflow — D140). `material` exclu (textuel). E2-S07-B1 : outillage backfill embeddings (`scripts/backfill-embeddings.ts`). E2-S07-C2 : sécurisation `POST /api/search` (auth VIEWER+, dette `D-search-post-public` résolue). Dettes : `D-completeness-category-keys`, `D-completeness-material`, `D-completeness-blocking`, `D-completeness-client-ui`* |
| **E2-S08** | Assistant de mesure | Formulaire guidé selon infos manquantes |
| **E2-S09** | Interface d'identification | Page unique multi-entrées — *réalisé 2026-10-10 (Interprétation A) : 5ᵉ onglet « Photo » dans `SearchBar` (`src/components/search-bar.tsx`) — upload `<input type="file">` (JPEG/PNG/WebP, 5 Mo max), lecture FileReader → base64, appel `POST /api/search/photo` (`{ mimeType, data, limit }`), gestion 503 « Recherche par photo indisponible (HF_API_TOKEN absent) ». Aucune modification API (route E2-S05 intacte). 4 tests E2E (401, 400 mime invalide, 503 token absent, 200 conditionnel si token HF). Dette `D-photo-ui` résolue. `D-photo-embedding-backfill` (Moyenne) reste ouverte — HF_API_TOKEN absent, embeddings NULL, chemin 200 non testable en env de test* |
| **E2-S10** | Résolution `D-e2e-submitted-consumption` | Stabilité E2E — *réalisé 2026-10-10 (stratégie A, `beforeEach` ciblé) : fixture `ensureSubmittedPart` (`e2e/fixtures/submitted-part.ts` + `e2e/fixtures/create-submitted-part.mts`) créant une part SUBMITTED via Prisma/tsx (POST /api/parts inutilisable — incohérence NewPartSchema/Prisma : `reference` requis par Zod mais absent du modèle). `beforeEach` ciblé dans `test.describe` — `part-transitions.spec.ts` (2 tests consommateurs) + `part-versions.spec.ts` (1 test, skip silencieux supprimé). Preuve : 2 runs consécutives sans reseed = 11/11 verts, suite complète 200 passed / 0 failed / 2 skipped (photo conditionnel). Dettes `D-e2e-submitted-consumption` (Moyenne) + `D-e2e-skip-conditional` (Faible) résolues. `D-e2e-submitted-residues` (Faible) créée — parts `E2E-RESET-*` persistent (pas de DELETE API)* |
| **E2-S11** | Alignement `NewPartSchema`/Prisma + sécurité `POST /api/parts` | *réalisé 2026-10-11 : `NewPartSchema` réécrit sur les 6 champs réels du modèle `Part` (`partNumber`, `ptvReference?`, `name`, `description?`, `status`, `categoryId?`) — 7 champs fantômes retirés (`reference`, `material`, `dimensions`, `tolerances`, `version`, `files`, `machineId` — tous modélisés ailleurs : `PartSpecification`, `PartVersion`, `PartImage`, `Attachment`). `UpdatePartSchema` aligné (`partial().omit({ partNumber: true })` — `partNumber` `@unique` immuable). **Faille sécurité découverte et corrigée** : auth vérifiée après parse/création → création anonyme possible (201 sans session) ; auth déplacée en tête de route. 4 tests E2E ajoutés (`e2e/api.spec.ts` : 401 sans auth, 201 minimal, 201 complet, 400 invalide). Dette `D-newpart-schema-prisma-mismatch` (Haute) résolue. Dettes fusionnées : `D-e2e-submitted-residues` + résidus E2-S11 → `D-e2e-parts-residues` (Faible, ~4 parts/run sans cleanup)* |
| **E2-S12** | Audit de clôture E2 | *en cours — vérification 7 critères de sortie, baseline finale, inventaire dettes, documentation clôture + passation E3* |

**Définition de "E2 terminée"** : depuis n'importe quelle entrée (photo, texte, réf, dim), l'utilisateur obtient un score et peut enrichir progressivement.

**Durée estimée** : 3-4 semaines.

---

## 🏗️ E3 — SOURCES EXTERNES & PIPELINE INTELLIGENT
**Objectif** : brancher PartIVA sur le monde extérieur et orchestrer le pipeline complet.

**⚠️ Note Superviseur** : cette étape dépend de **contrats/API externes** — prévoir des sessions de reconnaissance (état des lieux des APIs disponibles) avant implémentation. **E3-S01 (reconnaissance) réalisée 2026-10-11** — 3 sources retenues (TraceParts, CADENAS, OpenSERP), TecDoc sous contrat, sources CN exclues (RGPD).

| Session | Objectif | Livrable |
|---|---|---|
| **E3-S01** | Reconnaissance APIs sources externes | *réalisé 2026-10-11 : vérification 7 sources (TraceParts, CADENAS/3Dfindit, TecDoc/TecAlliance, OpenSERP, PARTcommunity, 汽修宝, 昵配网) — endpoints, auth, quotas, coût, licence, RGPD. Verdict : TraceParts (REST v3, Bearer JWT, gratuit), CADENAS (PARTcommunity 700+ catalogues, gratuit), OpenSERP (self-hosted MIT, docker) retenues ; TecDoc (contrat commercial GTC, licence stricte) session dédiée ; PARTcommunity redondant CADENAS ; sources CN exclues (RGPD). Aucun changement modèle Prisma (`SearchCandidate.source` String ouvert). Décisions D-E3-1 à D-E3-6* |
| **E3-S02** | Connecteur TraceParts (MVP) | *réalisé 2026-10-11 : connecteur mode mock (D-E3-7) — `src/lib/data/traceparts.ts` (schéma Zod `TracePartsProductSchema`/`TracePartsSearchResponseSchema`, data layer `searchTraceParts` mock + réel, mapping `mapTracePartsToCandidate`), auth D-E3-11 (`RequestToken` → Bearer JWT 24h, cache mémoire), 2 variables `.env` (`TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY`), 6 tests E2E mock + 1 conditionnel (skip si credentials absents), dette `D-traceparts-credentials` (Moyenne). Périmètre recherche seule (D-E3-8), pas de fallback (D-E3-9), `openserp` en E3-S03 (D-E3-10, réordonnancé)* |
| **E3-S03** | Connecteur Wikidata SPARQL (MVP, réel) | *réalisé 2026-10-11 : première source externe réellement fonctionnelle — `src/lib/data/wikidata.ts` (schéma Zod `WikidataSparqlResponseSchema`, data layer `searchWikidata` label exact indexé, mapping `mapWikidataToCandidate`), endpoint public `https://query.wikidata.org/sparql` (sans Docker, sans credentials), User-Agent obligatoire (D-E3-15), `'wikidata'` ajouté à `SearchSourceSchema` (D-E3-14), 6 tests E2E réels HTTP, fixture réelle `e2e/fixtures/wikidata-search.json`, dette `D-openserp-instance` (Moyenne). Recherche par label exact (indexée <1s) — regex/prefixe = full scan (504)* |
| **E3-S03-bis** | Connecteur OpenSERP (MVP, réel OSS) | 🟠 **Bloquée** — Docker/Podman absents de l'environnement (constat Bloc 0). Instance `karust/openserp serve` à provisionner. Wikidata (E3-S03) fournit la source externe réelle en attendant |
| **E3-S04** | Reconnaissance CADENAS / 3Dfindit | *réalisé 2026-10-11 : session de reconnaissance (R.5.1) — aucun code. Verdict : **aucune API publique self-service**. CGU CADENAS interdisent la collecte systématique + l'usage ML/IA (pénalité €20 000/cas + €500/téléchargement). Voies : PARTsolutions Application Server (licence commerciale, Http GET/POST JSON — sous contrat), portails fabricants (scraping — interdit CGU), 3Dfindit API (accès restreint 403), GitHub `cadenasgmbh/3dfindit-freecad-integration` (addon FreeCAD abandonné 2020). **D-E3-19 : CADENAS abandonné du MVP E3** — tracé en dette `D-cadenas-access` (Moyenne). Pipeline E3 fonctionnel sans CADENAS : Wikidata (réel) + TraceParts (mock) + OpenSERP (E3-S03-bis)* |
| **E3-S05** | Agrégation multi-sources + fallback | *réalisé 2026-10-11 : pipeline d'agrégation fonctionnel — `src/lib/connectors/` (`types.ts` interface `SourceConnector` D-E3-20, `aggregator.ts` `aggregateSearch()` Promise.allSettled + timeout 5s D-E3-21 + `searchWithFallback()` séquentiel D-E3-22, `wikidata.ts`/`traceparts.ts`/`local-db.ts` wrappers D-E3-26), route API `POST /api/search` mode `source: 'all'` (D-E3-25), déduplication par `name` normalisé (D-E3-24), score `sourceWeight × sourceScore` (D-E3-23). CADENAS (D-E3-19) + OpenSERP (Docker) exclus des sources actives. 6 tests E2E (4 connecteurs chromium + 2 route API admin). Dettes `D-aggregation-timeout` + `D-aggregation-score` (Faible)* |
| **E3-clôture** | Audit de clôture phase E3 | *réalisé 2026-10-11 : audit documentaire (aucun code) — inventaire E3 (16 fichiers code + 13 dettes), baseline vérifiée (ESLint 0/0, TS 0 err, Prettier 0, build 55 routes, E2E 222/0/3, Prisma 14 migrations), dettes classées (3 Moyennes : 2 bloquées token/JWT/Docker + 1 clôturée CADENAS ; 10 Faibles : 4 actionnables E4 + 6 documentées R.5.2-R.5.8), cohérence ROADMAP/SESSION/DEBT vérifiée. Décisions D-E3-27 à D-E3-30. **Phase E3 CLÔTURÉE*** |

**Phase E3 — CLÔTURÉE le 2026-10-11**

### Bilan E3

- **Sources réelles** : Wikidata SPARQL (open-source, self-service, endpoint public)
- **Sources mock** : TraceParts (prêt au réel — JWT à provisionner)
- **Sources reportées** : OpenSERP (Docker à provisionner, E4)
- **Sources abandonnées** : CADENAS (D-E3-19 — CGU restrictives, pénalités chiffrées)
- **Pipeline** : agrégation parallèle (`Promise.allSettled` + timeout 5s) + fallback Wikidata → TraceParts → local_db + déduplication par `name` normalisé
- **Dettes E3** : 3 Moyennes (token/JWT/Docker), 10 Faibles
- **Règles PCT** : R.5.1 à R.5.8 (8 règles issues de l'expérience E3)

### Sessions E3 (historique)

| Session | Objet | Commit |
|---|---|---|
| E3-S01 | Reconnaissance APIs | `cc104b9` |
| E3-S02 | TraceParts (mock) | `4cc74a6` |
| E3-S03 | Wikidata SPARQL (réel) | `369cc46` |
| E3-S04 | Reconnaissance CADENAS (abandon) | `67cc6a2` |
| E3-S05 | Agrégation + fallback | `7962d6f` |
| E3-clôture | Audit de phase | `<commit>` |
| E3-S03-bis | OpenSERP (Docker) | 🟠 Reportée E4 |

**Sessions E3 restantes (reportées / conditionnelles) :**

| Session | Objet | Statut |
|---|---|---|
| E3-S03-bis | Connecteur OpenSERP (MVP, réel OSS) | 🟠 Reportée E4 (Docker à provisionner) |
| E3-S06 | Pipeline intelligent (3 cas) | 🟢 À cadrer (E4 ou ultérieur) |
| E3-S07 | Logique de bascule | 🟢 À cadrer |
| E3-S08 | Interface pipeline | 🟢 À cadrer |
| E3-S09 | (Conditionnel) TecDoc sous contrat | 🟢 Contrat commercial GTC |
| E3-S10 | Tests E2E + baseline | 🟢 À cadrer |

**Définition de "E3 terminée"** : PartIVA interroge plusieurs sources et route automatiquement vers la bonne stratégie.

**Durée estimée** : 3-4 semaines.

---

## 🔧 E4 — CONSOLIDATION, UX, DÉPLOIEMENT
**Objectif** : consolider la phase E3 (dettes, tuning), avancer sur le produit (UX), préparer le déploiement, débloquer les sources externes (OpenSERP, TraceParts réel).

**⚠️ Note Superviseur** : E4 est une phase **mixte** (technique + produit). Priorité : débloquer les dettes Moyennes (si les dépendances externes sont provisionnées), avancer sur le produit en parallèle, préparer le déploiement. Aucune nouvelle source (TecDoc = E5, contrat commercial).

**Statut** : 🟢 **CLÔTURÉE** (E4-clôture, 2026-10-12 — rapport `docs/e4-close-report.md`)

### Sessions

| Session | Objet | Type | Statut |
|---|---|---|---|
| **E4-S01** | Cadrage phase E4 | Cadrage | ✅ Clôturée 2026-10-11 |
| **E4-S02** | Déblocage dettes Moyennes (HF token, JWT TraceParts, Docker) | Technique | ✅ Clôturée 2026-10-11 (blocage documenté — 3 dépendances externes absentes) |
| **E4-S03** | Tuning pipeline (score, timeout, mappings) | Technique | ✅ Clôturée 2026-10-11 (4 dettes Faibles clôturées) |
| **E4-S04** | UX produit (complétude client, poids de scoring) | Produit | ✅ Clôturée 2026-10-11 (2 dettes Faibles clôturées) |
| **E4-S05** | Performance (HNSW, index, requêtes) | Technique | ✅ Clôturée 2026-10-11 (mesure par source + catalogue embeddings, D-embedding-model-catalog clôturée) |
| **E4-S06** | Audit qualité (couverture, E2E isolation) | Qualité | ✅ Clôturée 2026-10-11 (regroupement 7 dettes E2E → D-e2e-constraints + docs/e2e-constraints.md) |
| **E4-S07** | Préparation déploiement (Vercel, CI/CD, monitoring) | Infra | ✅ Clôturée 2026-10-11 (doc + CI/CD + config — comptes Vercel/Sentry/domaine à provisionner) |
| **E4-S08** | E3-S03-bis (OpenSERP) si Docker | Technique | 🟠 Reportée E5 (Docker non provisionné — constat vérifié E4-clôture) |
| **E4-clôture** | Audit de clôture phase E4 | Clôture | ✅ Clôturée 2026-10-12 (baseline 6/6 tenue, 5 dettes résiduelles, D-E4-C1 à D-E4-C8) |

**Total :** 8 sessions + 1 clôture. **Phase E4 CLÔTURÉE.**

### Bilan E4

- **Dettes** : 13 (3 M + 10 F) → **5 (3 M + 2 F)** (-8 : 7 clôturées + 7 regroupées + 1 ajoutée)
- **Baseline** : 6/6 tenue (ESLint 0/0, TS 0 err, Prettier 0, Build 55 routes, E2E 233/0/3, Prisma 14 migrations)
- **Livrables** : UX (CompletenessBadge, ScoringWeightsTable), performance (catalogue embeddings, mesure instrumentée), infra (docs/deployment.md, ci.yml, vercel.json, README.md), qualité (docs/e2e-constraints.md)
- **Blocages** : exclusivement externes (HF token, TraceParts JWT, Docker, comptes Vercel/Sentry/domaine)
- **Décisions de clôture** : D-E4-C1 à D-E4-C8 (cf. `docs/e4-close-report.md`)

### Dépendances externes (Coordinateur) — priorité E5

| Dépendance | Session | Impact si absente |
|---|---|---|
| `HF_API_TOKEN` | E4-S02-A | `D-photo-embedding-backfill` reste bloquée |
| `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY` | E4-S02-B | `D-traceparts-credentials` reste bloquée |
| Docker (Desktop / Podman) | E4-S02-C | `D-openserp-instance` reste bloquée, E4-S08 reportée |
| Comptes Vercel / Sentry / domaine | E4-S07 | Déploiement réel non exécutable |

**Recommandation** : provisionner ces dépendances **avant** E5-S01 pour maximiser les déblocages.

### Définition de "E4 terminée"

PartIVA est consolidé (dettes résolues ou documentées), l'UX client est améliorée, le déploiement est préparé, les sources externes sont débloquées (si possible). **✅ Atteint** (déploiement réel + sources externes reportés E5 — dépendances externes).

**Durée estimée** : 3-4 semaines.

---

## 🏗️ E5 — INTELLIGENCE & APPRENTISSAGE (cadrage préliminaire)

**Objectif** : faire de PartIVA un système qui s'améliore avec l'usage.

**⚠️ Cadrage préliminaire E5 (proposé par E4-clôture, à confirmer en E5-S01) :**

| Session | Objet | Priorité |
|---|---|---|
| **E5-S01** | Cadrage phase E5 | Cadrage | ✅ Clôturée 2026-10-12 (`docs/e5-s01-cadrage.md`) |
| **E5-S02** | Déploiement placeholder | Infra | ✅ Clôturée 2026-10-12 (page `/placeholder` + `/api/health` + `src/proxy.ts` étendu + mode `NEXT_PUBLIC_PLACEHOLDER_MODE` — 100% local, aucune dépendance externe) |
| **E5-S03** | Déblocage dettes Moyennes (HF, TraceParts) | Technique | ✅ Clôturée 2026-10-12 (rapport de blocage — 0/3 débloqués, provisioning mis à jour `docs/e5-s03-blocage.md`) |
| **E5-S04** | E4-S08 (OpenSERP) — requalification | Technique | ✅ Clôturée 2026-10-12 (rapport — OpenSERP **rejeté** : moteur SERP web (Google, Yandex, Baidu, Bing, DuckDuckGo, Ecosia), pas catalogue de pièces ; aucun champ `partNumber`/`manufacturer`/`cadAvailable` ; `D-openserp-instance` requalifiée `D-openserp-inadapte` Faible ; Docker provisionné mais inadapté au périmètre — aucun connecteur créé. Leçon R.5.16) |
| **E5-S05** | TecDoc (mock) | Technique | ✅ Clôturée 2026-10-12 (connecteur mock + schéma Zod + `'tecdoc'` dans SearchSourceSchema + agrégateur 4 sources + 7 tests E2E — `D-tecdoc-credentials` créée) |
| **E5-S06** | Nettoyage dettes Faibles | Technique | ✅ Clôturée 2026-10-12 (`D-ts6133-noUnusedLocals` + `D-scoring-weights-table-unused` clôturées par décision — `docs/debts-documentation.md` versionné, 2 dettes Faibles résolues, aucun code modifié) |
| **E5-S07** | Déploiement réel (si comptes) | Infra | 🟠 Reportée E6 (Vercel/Sentry/domaine absents — `D-deploy-comptes` active) |
| **E5-clôture** | Audit phase E5 | Clôture | ✅ Clôturée 2026-10-12 (baseline 6/6 tenue, 5 dettes résiduelles 4 M + 1 F, D-E5-C1 à D-E5-C8) |

**Phase E5 — CLÔTURÉE le 2026-10-12**

### Bilan E5

- **Sessions** : 6 clôturées (S01-S06) + 1 clôture + 1 reportée (S07 → E6)
- **Livré** : mode placeholder déployable (`NEXT_PUBLIC_PLACEHOLDER_MODE`, `src/proxy.ts`, `/placeholder`, `/api/health`), TecDoc mock (connecteur + `'tecdoc'` + agrégateur 4 sources + 8 tests E2E, poids 0.5), requalification OpenSERP (inadapté — R.5.16 née), 2 dettes Faibles clôturées par décision, 4 documents (`docs/e5-s01-cadrage.md`, `docs/e5-s03-blocage.md`, `docs/e5-s04-openserp-inadapte.md`, `docs/debts-documentation.md`)
- **Reporté** : déploiement réel (E6 — comptes Vercel/Sentry/domaine absents)
- **Dettes E5** : 5 (4 M + 1 F) — 4 Moyennes bloquées externes (HF token, JWT TraceParts, contrat TecDoc, Vercel/Sentry) + 1 Faible documentée (OpenSERP inadapté)
- **Baseline finale** : ESLint 0/0, TS 0 err, Prettier 0, build 57 routes, E2E 243/2/4 (2 échecs environnementaux documentés), Prisma 14 migrations
- **Nouvelle règle PCT** : R.5.16 (vérifier la nature d'une source — capturer une réponse réelle avant de la retenir comme `SourceConnector`)
- **Corpus PCT E3-E5** : 16 règles proposées (R.5.1 à R.5.16) — à intégrer au PCT officiel avant E6

### Passation E5 → E6

- **E6-S01** : cadrage phase E6
- **Pistes E6** : catalogue Dockerisé alternatif à OpenSERP (R.5.16), `D-completeness-*` (3 dettes E2), déblocage des 4 Moyennes (HF/JWT/TecDoc/Vercel), déploiement réel (si comptes), TecDoc réel (si contrat commercial)
- **Priorité Coordinateur** : provisionner HF_API_TOKEN + TRACEPARTS_* + comptes Vercel/Sentry/domaine → maximise les déblocages E6

---

## 🏗️ E6 — DÉBLOCAGE, CATALOGUE, AUTO-PARTS (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée 2026-10-13** (E6-S01 cadrage + requalification + E6-S04 + E6-S05 catalogue + E6-S06 spec auto-parts + E6-S07 modèle Prisma + E6-S07-A amendements + E6-S08 connecteur TecDoc mock enrichi + E6-S10 nettoyage dettes + E6-clôture — 8/10 sessions clôturées, 1 bloquée reportée E7, 1 clôture)

**Bilan E6 :** 8/10 sessions clôturées, 1 bloquée (E6-S09 TecDoc réel, reportée E7), 1 clôture.
**Baseline :** ESLint 0/0, TS 0, Prettier 0, **59 routes**, **284 E2E**, **15 migrations**, 0 dette Haute.
**Livrables :** `Vehicle`/`Fitment` + extension `Part` (material, autoCategory), migration 14→15, connecteur TecDoc mock enrichi (VIN2OE, photo+fitment), routes API `/api/search/vehicle` + `/api/search/vin`, fixtures 60 pièces/25 véhicules/60 fitments, `docs/positioning.md`, `docs/migration-drift.md`, 26 tests E2E.
**Rapport de clôture :** `docs/e6-close-report.md`.

**Objectif E6 :** traiter `D-completeness-*`, identifier un catalogue Dockerisé pertinent métier (R.5.16), nettoyer les dettes restantes. Les 4 déblocages Moyennes sont **requalifiés en dettes bloquées** (reportés phase finale E7).

**Périmètre :** Produit autonome (les sessions bloquées par dépendances externes sont retirées du plan actif).

### Sessions

| Session | Objet | Type | Statut |
|---|---|---|---|
| **E6-S01** | Cadrage phase E6 | Cadrage | ✅ Clôturée 2026-10-13 (`docs/e6-s01-cadrage.md`) |
| **E6-S02** | Déblocage TraceParts (JWT) | Technique | 🟠 **Bloquée** — `D-traceparts-credentials` (reportée E7) |
| **E6-S03** | Déblocage photo embeddings (HF) | Technique | 🟠 **Bloquée** — `D-photo-embedding-backfill` (reportée E7) |
| **E6-S04** | `D-completeness-*` (3 dettes) | Technique | ✅ **Clôturée 2026-10-13** (session documentaire — `D-completeness-material` clôturée par décision, `category-keys` + `blocking` reportées E7) |
| **E6-S05** | Catalogue Dockerisé alternatif | Technique | ✅ **Clôturée 2026-10-13** (Scénario A — catalogue industriel HF `swan07/industrial-parts-data` intégré, 5 sources, 13 tests E2E) |
| **E6-S06** | Spécification auto-parts (fitment) | Cadrage | ✅ **Clôturée 2026-10-13** (`docs/e6-s05-auto-parts-spec.md` — TecDoc mock, Prisma, route `/api/search/vehicle`, focus plastique — D1-D7 confirmés R.5.17) |
| **E6-S07** | Modèle Prisma + migration auto-parts | Technique | ✅ **Clôturée 2026-10-13** (modèles `Vehicle`/`Fitment` + extension `Part` `material`/`autoCategory`/`vehicleFitments` — migration 14→15, R.4.1-ter drift GIN/HNSW) |
| **E6-S07-A** | Amendements documentaires auto-parts | Documentaire | ✅ **Clôturée 2026-10-13** (commentaire KType+, spec autoCategory R.5.18, `D-tecdoc-auto-parts` enrichie, `docs/positioning.md`, `D-rebrickable-pattern`) |
| **E6-S08** | Connecteur TecDoc mock enrichi | Technique | ✅ **Clôturée 2026-10-13** (VIN2OE, identification photo+fitment, routes API `/api/search/vehicle` + `/api/search/vin`, fixtures 60 pièces / 25 véhicules / 60 fitments, 26 tests E2E) |
| **E6-S09** | TecDoc réel (si contrat) | Technique | 🟠 **Bloquée** — `D-tecdoc-credentials` / `D-tecdoc-auto-parts` (reportée E7) |
| **E6-S10** | Nettoyage dettes restantes | Technique | ✅ **Clôturée 2026-10-13** (procédure drift R.4.1-ter `docs/migration-drift.md`, `e2e-constraints` +2 contraintes, `D-searchsource-i18n-sync` vérifiée, reports E7 confirmés) |
| **E6-clôture** | Audit de clôture phase E6 | Clôture | ✅ **Clôturée 2026-10-13** (`docs/e6-close-report.md` — D-E6-C1 à C8, baseline 59 routes/284 E2E/15 migrations) |

**Total :** 10 sessions + 1 clôture. **Phase E6 CLÔTURÉE.** Prochaine phase : **E7** (déblocage 5 Moyennes — credentials requis) ou **E8** (stabilisation, production — fallback).

### Sessions bloquées (dettes) — requalification 2026-10-13

Les sessions E6-S02, E6-S03, E6-S06 (déploiement) et E6-S09 sont **bloquées** par des dépendances externes (credentials, comptes, contrat). Elles sont **retirées du plan actif** et **reportées en phase finale (E7)**. Elles sont tracées en dettes (déjà présentes dans `DEBT.md`) :

- `D-traceparts-credentials` (Moyenne) → E6-S02 — `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY`
- `D-photo-embedding-backfill` (Moyenne) → E6-S03 — `HF_API_TOKEN`
- `D-deploy-comptes` (Moyenne) → E6-S06 (déploiement réel, renommée depuis E6-S06 ancien) — comptes Vercel/Sentry/domaine
- `D-tecdoc-credentials` (Moyenne) → E6-S09 — contrat TecDoc/TecAlliance
- `D-tecdoc-auto-parts` (Moyenne) → E6-S09 — contrat TecDoc (fitment auto-parts, créée E6-S07)

**Bénéfice :** le plan E6 devient réaliste (sessions autonomes uniquement), les dettes sont visibles dans `DEBT.md`, le Coordinateur peut provisionner à son rythme, les sessions seront rouvertes dès que les dépendances sont disponibles.

### Dépendances externes (Coordinateur) — pour la phase finale E7

| Dépendance | Session bloquée | Priorité |
|---|---|---|
| `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY` | E6-S02 | **1 (déblocage le plus rapide)** |
| `HF_API_TOKEN` | E6-S03 | 2 |
| Comptes Vercel/Sentry/domaine | E6-S06 (déploiement) | 3 |
| Contrat TecDoc | E6-S09 | 4 |

**Recommandation forte :** provisionner `TRACEPARTS_*` en priorité (variables déjà déclarées dans `.env.example`) — débloquera E6-S02 en phase finale. **Phase E6 clôturée** — E7 (déblocage 5 Moyennes) ou E8 (stabilisation, production) est la prochaine phase.

### Baseline cible E6

ESLint 0/0 · TS 0 err · Prettier 0 · Build 59 routes · E2E 284 · Prisma 15 migrations · Dettes Moyennes 5 (reportées E7).

### Bilan E6-S04 (session documentaire)

- **`D-completeness-material`** : ✅ clôturée par décision (`material` exclu — dimensionnel ≠ textuel)
- **`D-completeness-category-keys`** : 🟠 documentée, reportée E7 (migration Prisma `CategoryRequiredSpec`)
- **`D-completeness-blocking`** : 🟠 documentée, reportée E7 (arbitrage workflow)
- **Document de référence** : `docs/debts-documentation.md` §7-9

### Bilan E6-S05 (catalogue industriel — Scénario A)

- **Catalogue identifié (R.5.16)** : dataset Hugging Face `swan07/industrial-parts-data` — catalogue industriel réel (32 fabricants : Grainger, Igus, Parker, SMC, Danfoss, Adafruit, Digikey, Fastenal, Pololu... + CAD STEP + normes ISO/ASME/ASTM)
- **Intégré** : schéma Zod + data layer + connecteur `industrialCatalogConnector` + `'industrial_catalog'` SearchSourceSchema + i18n + agrégateur (5 sources, poids 0.55)
- **E2E** : 256/0/4 (243 + 13 nouveaux tests)
- **Dette** : `D-industrial-catalog-dataset` (Faible — import dataset complet E7)
- **Note** : extrait embarqué (fichiers `.jsonl` HF trop gros pour fetch runtime) — endpoint HF documenté pour import batch E7

### Bilan E6-S06 (spécification auto-parts — cadrage)

- **Spécification** : `docs/e6-s05-auto-parts-spec.md` — recherche pièces auto par véhicule (fitment), focus plastique
- **Décisions D1-D7 confirmées** (R.5.17) : TecDoc mock (D2), Prisma (D3), migration autorisée (D4), route `/api/search/vehicle` (D5), filtrage plastique (D6), séquentiel (D7)
- **Livrable** : spécification 6 blocs (sources, modèle, SearchCandidate, interface, routes, plastique) — aucun code
- **Dette** : `D-tecdoc-auto-parts` (Moyenne — contrat TecDoc pour fitment)

### Bilan E6-S07 (modèle Prisma + migration auto-parts)

- **Modèles** : `Vehicle` (make, model, year, engine, ktype, vin — index `[make,model,year]` + `ktype`), `Fitment` (partId, vehicleId, notes — `@@unique([partId,vehicleId])`, cascade), extension `Part` (`material?`, `autoCategory?`, `vehicleFitments`)
- **R.5.18 appliquée** : `autoCategory` (pas `category` — collision évitée avec la relation `PartCategory` existante)
- **Migration** : `20261013020211_add_vehicle_fitment_auto_parts` — **14 → 15 migrations** (R.4.1-ter — migration manuelle, `DROP INDEX part_images_embedding_hnsw` exclu pour préserver l'index HNSW)
- **Seed** : 5 véhicules, 5 pièces plastique (ABS, ABS/PC, PP, PA), 5 fitments, 11 partVersions
- **Baseline** : ESLint 0/0, TS 0 err, Prettier 0, Build 57 routes, E2E 258/0/4, Prisma 15 migrations
- **Dette** : `D-tecdoc-auto-parts` (Moyenne — connecteur E6-S08, réel E6-S09 si contrat)

### Bilan E6-S07-A (amendements documentaires)

- **Commentaire KType+** : `prisma/schema.prisma` (modèle `Vehicle`, champ `ktype`)
- **Spec amendée** : `docs/e6-s05-auto-parts-spec.md` §3.3 — `autoCategory` (R.5.18)
- **`D-tecdoc-auto-parts` enrichie** : 3 sous-sections (Modèle, Connecteur, Mode réel)
- **`docs/positioning.md` créé** : positionnement Rebrickable, 7 innovations aftermarket
- **`D-rebrickable-pattern`** (Faible) ajoutée — cible E8
- **Baseline inchangée** : ESLint 0/0, TS 0, Prettier 0, Build 57 routes, E2E 258/0/4, Prisma 15 migrations

### Bilan E6-S08 (connecteur TecDoc mock enrichi)

- **Schéma Zod enrichi** : `TecDocProductSchema` (`autoCategory`, `material`), `TecDocVehicleSearchResponseSchema` (produits + véhicules + fitments)
- **Fixtures enrichies** : `src/lib/data/tecdoc-fixtures.ts` — 60 pièces, 25 véhicules (KType+, VIN), 60 fitments
- **Data layer** : `searchTecDoc` (enrichi), `searchByVIN` (VIN2OE), `searchByVehicle`, `searchByPhotoAndVehicle`
- **Connecteur enrichi** : `searchTecDocByVIN`, `searchTecDocByVehicle`, `searchTecDocByPhotoAndVehicle` (candidats avec `vehicleFitment` en metadata)
- **Enum + i18n (R.5.2)** : `AUTO_CATEGORY_LABELS` + `AUTO_MATERIAL_LABELS` (`enum-labels.ts`), `autoCategories` + `autoMaterials` (`fr.ts`)
- **Agrégateur** : `aggregateSearchByVIN`, `aggregateSearchByVehicle`, `aggregateSearchByPhotoAndVehicle`
- **Routes API** : `POST /api/search/vehicle`, `POST /api/search/vin` (auth VIEWER+)
- **Innovations** : #1 VIN2OE, #4 identification photo + fitment
- **E2E** : 26 nouveaux tests (`tecdoc-vehicle.spec.ts` 13 + `tecdoc-vin.spec.ts` 13) — 26/26 passés
- **Baseline** : ESLint 0/0, TS 0, Prettier 0, **Build 59 routes**, E2E 284/0/4, Prisma 15 migrations
- **Aucune migration** (D9 = Non — `SearchCandidate.source` String ouvert)

### Bilan E6-S10 (nettoyage dettes restantes)

- **Procédure drift** : `docs/migration-drift.md` créé (R.4.1-ter — procédure manuelle en l'absence de `SHADOW_DATABASE_URL`)
- **`e2e-constraints.md`** : +2 contraintes (`D-e2e-tecdoc-mock`, `D-e2e-fixtures-tecdoc`) — 7 → 9 dettes regroupées
- **`D-searchsource-i18n-sync`** : vérifiée (synchronisation R.5.2 appliquée, `tsc --noEmit` = 0) — dette documentaire permanente
- **Reports E7 confirmés** : 5 Moyennes + `D-completeness-category-keys` + `D-completeness-blocking` + `D-industrial-catalog-dataset`
- **Baseline inchangée** : ESLint 0/0, TS 0, Prettier 0, Build 59 routes, E2E 284/0/4, Prisma 15 migrations

---

## 🔧 E7 — DÉBLOCAGE DETTES MOYENNES (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée 2026-10-14** (E7-clôture — D-E7-C1 à C9, rapport `docs/e7-close-report.md`) — 6/6 sessions planifiées traitées (S01 → S06)

**Nature :** Déblocage des 5 dettes Moyennes reportées par E6/E8. Sessions courtes, dépendantes de credentials externes.

**Sessions :**

| Session | Objet | Nature | Statut |
|---|---|---|---|
| **E7-S01** | Utilisateurs réels (admin + suppression mock) | Code | ✅ **Clôturée 2026-10-13** (commit `2c2aca3` — admin via `ADMIN_EMAIL`/`ADMIN_PASSWORD`, seed conditionnel, setup E2E, docs) |
| **E7-S02-ter** | Embeddings photo (backfill) | Code + données | ✅ **Clôturée** — code 3 providers commité (R.5.23) + backfill exécuté en E7-S02-reprise |
| **E7-S02-reprise** | Backfill embeddings via Lightweight self-host | Données | ✅ **Clôturée 2026-10-14** — conteneur Docker `lwe` (port 7860, `siglip-base-patch16-256-multilingual`), `npm run db:backfill-embeddings` : `succeeded=5, failed=0`, `missing=0`, dimension 768, index HNSW `part_images_embedding_hnsw` intact — `D-photo-embedding-backfill` clôturée |
| **E7-S03** | Déploiement Vercel (staging) | Code + config | ✅ **Clôturée 2026-10-13** (build corrigé `postinstall` commit `e9803c1`, déploiement production READY `part-iva.vercel.app`, env `NEXT_PUBLIC_APP_URL`/`BETTER_AUTH_URL` corrigées — E7-S03-quater + quinquies) |
| **E7-S04** | Requalification OpenSERP (local) | Vérification | ✅ **Clôturée 2026-10-14** — revérification R.5.16 : rejet confirmé (SERP web, non catalogue pièces), D-E5-S04 maintenues |
| **E7-S05** | Vérification drift HNSW (`SHADOW_DATABASE_URL`) | Vérification | ✅ **Clôturée 2026-10-14** — diff Prisma 7 code 2, index HNSW et GIN confirmés en base ; drift HNSW structurel attendu documenté dans `docs/migration-drift.md` |
| **E7-S06** | AWS S3 (si nécessaire) | Vérification + docs | ✅ **Clôturée 2026-10-14** — **non applicable** : S3 non utilisé (aucune occurrence `AWS_`/`S3Client`/`@aws-sdk` dans `src/`/`scripts/`/`prisma/`/`e2e/`, aucune dépendance `@aws-sdk` dans `package.json`). Cloudinary reste le stockage d'images ; variables `AWS_*` injectées par Neon (usage futur). `D-aws-s3-non-applicable` (Faible) documentée — réf. `docs/env-vars.md` §3.8 |

**Note E7-S02-ter + E7-S02-reprise** : le code supporte 3 providers d'embeddings (Lightweight self-host, DeepInfra, HuggingFace). Le backfill a été bloqué par le service public Lightweight (`lamhieu/lightweight-embeddings.hf.space` → 503), puis **débloqué en E7-S02-reprise par le self-host Lightweight local via Docker** — conteneur `lwe` healthy sur le port `7860`, backfill 5/5 images exécuté (`docs/e7-s02-embeddings.md` §6).

**Baseline (inchangée) :** ESLint 0/0 · TS 0 · Prettier 0 · Build 59 routes · E2E 284/0/4 (288 listés) · Prisma 15 migrations.

### Bilan E7

**6/6 sessions traitées. Baseline tenue.**

- **Dettes clôturées en E7** : `D-photo-embedding-backfill` (backfill 5/5 via Lightweight self-host, 768 dims, HNSW intact), `D-hnsw-drift` (drift structurel vérifié), `D-openserp-inadapte` (rejet confirmé R.5.16), `D-deploy-comptes` (partiel — Vercel opérationnel)
- **Dette créée** : `D-aws-s3-non-applicable` (Faible — Cloudinary pour les images, `AWS_*` injectées par Neon)
- **Dettes résiduelles** : 4 Moyennes (3 en attente contrat R.5.22 + Vercel Sentry/domaine optionnels) + 14 Faibles · 0 Haute
- **Production live** : `https://part-iva.vercel.app`
- **Fonctionnalité débloquée** : recherche visuelle `POST /api/search/photo` (embeddings 5/5 en base)
- **Décisions** : D-E7-C1 à D-E7-C9 (`docs/e7-close-report.md`)
- **Prochaine phase** : E8+ (Desktop Tauri) ou clôture projet — arbitrage Coordinateur (D-E7-C9)

---

## 🏗️ E8 — STABILISATION, DOCUMENTATION FINALE, PRODUCTION PRÉPARÉE (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée** (E8-clôture 2026-10-13 — D-E8-C1 à C8, rapport `docs/e8-close-report.md`)

**Nature :** Documentaire + préparation production. **Fallback de E7** (déblocage 5 Moyennes bloqué par credentials externes). **Aucun credential externe requis.**

**Objectif :** stabiliser le code (audit qualité, dette technique résiduelle), documenter le projet (README, architecture, guide de déploiement), préparer la production (config, variables d'env, checklist), préparer E7 (documenter les credentials requis).

**⚠️ Note de numérotation** : cette phase E8 (stabilisation) est **distincte** de la section « E8 — FINALISATION, QA & DÉPLOIEMENT » originale (plus bas dans ce document, ~l.544) qui décrit la vision initiale (tests, perf, SEO, monitoring, CI/CD, prod). La présente section E8 est la phase de stabilisation/documentation exécutée en 2026-10-13 comme fallback de E7. La section originale E8 (Finalisation) reste d'actualité pour la phase finale de production.

### Sessions

| Session | Objet | Nature | Statut |
|---|---|---|---|
| **E8-S01** | Cadrage phase E8 | Documentaire | ✅ Clôturée 2026-10-13 (`docs/e8-s01-cadrage.md`) |
| **E8-S02** | Audit qualité + dette technique | Audit | ✅ Clôturée 2026-10-13 (`docs/e8-s02-audit.md` — baseline tenue, 0 dette Haute, 5 Moyennes reportées E7, sécurité conforme) |
| **E8-S03** | Documentation projet (README, architecture) | Documentaire | ✅ Clôturée 2026-10-13 (`README.md` mis à jour, `docs/architecture.md` créé) |
| **E8-S04** | Guide de déploiement production | Documentaire | ✅ Clôturée 2026-10-13 (`docs/deployment.md` mis à jour — prérequis, variables d'env, procédure, migrations, monitoring, rollback, dettes bloquantes) |
| **E8-S05** | Checklist production + variables d'env | Documentaire | ✅ Clôturée 2026-10-13 (`docs/env-vars.md` + `docs/production-checklist.md` créés, `docs/deployment.md` référencé) |
| **E8-S06** | Préparation E7 (credentials requis) | Documentaire | ✅ Clôturée 2026-10-13 (`docs/e7-credentials.md` + `docs/e7-readiness.md` créés, `docs/deployment.md` référencé) |
| **E8-clôture** | Audit de clôture phase E8 | Audit | ✅ Clôturée 2026-10-13 (`docs/e8-close-report.md` — D-E8-C1 à C8, R.5.22 actée) |

**Total :** 7 sessions + 1 clôture. **Phase E8 CLÔTURÉE.**

**Baseline E8 (inchangée) :** ESLint 0/0 · TS 0 · Prettier 0 · Build 59 routes · E2E 284/0/4 · Prisma 15 migrations · 0 dette Haute.

**Contraintes :** aucun credential externe requis, aucune modification de code (E8 = documentaire + audit), baseline inchangée, R.5.21 (avance par défaut), **R.5.22 (clés placeholder non bloquantes)**.

**Livrables E8 :** `docs/e8-s01-cadrage.md`, `docs/e8-s02-audit.md`, `README.md` (mis à jour), `docs/architecture.md` (nouveau), `docs/deployment.md` (mis à jour), `docs/env-vars.md` (nouveau), `docs/production-checklist.md` (nouveau), `docs/e7-credentials.md` (nouveau), `docs/e7-readiness.md` (nouveau), `docs/e8-close-report.md`.

### Bilan E8

- **Sessions** : 7/7 clôturées (S01 → S06 + clôture)
- **Documentation** : README, architecture, déploiement, env-vars, production-checklist, e7-credentials, e7-readiness
- **Règles** : R.5.21 (avance par défaut), **R.5.22 (clés placeholder non bloquantes)**
- **Dettes E7** : 5 Moyennes — 3/5 **en attente contrat** (TecDoc, TraceParts — R.5.22), 2/5 bloquées (HF, Vercel)
- **Baseline** : tenue (59 routes, 284 E2E, 15 migrations)

### Passation E8 → E7 / clôture projet

- **E7** : déblocage 5 Moyennes — **partiellement débloquable** (3/5 en attente contrat R.5.22, 2/5 bloquées HF/Vercel)
- **Clôture projet** : alternative si E7 reste bloquée
- **Recommandation (R.5.21)** : E7 cadrable session par session, selon les credentials disponibles

---

## 🏗️ E4 — ACQUISITION INTELLIGENTE & REVERSE ENGINEERING
**Objectif** : traiter les pièces inconnues — mesure, scan, reconstruction CAO.

| Session | Objectif | Livrable |
|---|---|---|
| **E4-S01** | Assistant de mesure avancé | Formulaires spécialisés par type de pièce |
| **E4-S02** | Import scan 3D / nuage de points | Upload + visualisation |
| **E4-S03** | Reconstruction CAO | Pipeline scan → mesh → CAO (choix technique à définir) |
| **E4-S04** | Analyse fonctionnelle assistée | Fonction de la pièce + contraintes |
| **E4-S05** | Choix matériau assisté | Recommandation selon usage |
| **E4-S06** | Génération dessin technique | Export PDF/STEP depuis CAO |
| **E4-S07** | Viewer CAO avancé | Améliorer `cad-viewer.tsx` existant |

**Définition de "E4 terminée"** : depuis une pièce inconnue, PartIVA produit une CAO validée et un dessin technique.

**Durée estimée** : 4-6 semaines.

**⚠️ Note Superviseur** : étape **techniquement lourde** (CAO, scan, IA géométrique). Prévoir des sessions de recherche/bench avant implémentation.

---

## 🏗️ E5 — INTELLIGENCE & APPRENTISSAGE
**Objectif** : faire de PartIVA un système qui s'améliore avec l'usage.

| Session | Objectif | Livrable |
|---|---|---|
| **E5-S01** | Similarité géométrique | Matching avancé sur formes |
| **E5-S02** | BDD des problèmes | Casse, usure, déformation, etc. |
| **E5-S03** | Détection d'usure | Analyse photos/scans de pièces usées |
| **E5-S04** | Recommandations proactives | "Cette géométrie + ce matériau = usure fréquente" |
| **E5-S05** | Analyse des historiques | Patterns d'échec, récurrences |
| **E5-S06** | Système de validation humaine | Toutes les validations tracées |
| **E5-S07** | Apprentissage incrémental | Chaque pièce enrichit la BDD |

**Définition de "E5 terminée"** : PartIVA fournit des recommandations basées sur l'historique réel.

**Durée estimée** : 4-6 semaines.

---

## 🏗️ E6 — ÉCOSYSTÈME CLIENT & BIBLIOTHÈQUE ENTREPRISE
**Objectif** : chaque entreprise dispose de son propre référentiel.

| Session | Objectif | Livrable |
|---|---|---|
| **E6-S01** | Espace entreprise (multi-tenant) | Isolation des données par client |
| **E6-S02** | Bibliothèque de pièces | Vue structurée Machines → Pièces → Versions |
| **E6-S03** | Gestion des machines | CRUD machines + liaisons pièces |
| **E6-S04** | Commandes & suivi | Cycle commande complet |
| **E6-S05** | Documents entreprise | Gestion documentaire complète |
| **E6-S06** | Recherche instantanée entreprise | "Guide plastique machine X" → tout |
| **E6-S07** | Réutilisation intelligente | 1ʳᵉ acquisition → 2ᵉ validation → 3ᵉ commande |

**Définition de "E6 terminée"** : une entreprise gère son référentiel numérique complet.

**Durée estimée** : 4-6 semaines.

---

## 🏗️ E8P — DESKTOP TAURI (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée le 2026-10-16** (rapport `docs/e8p-close-report.md`) — 15 sessions traitées (S01 → S10-bis).

**Objectif atteint :** Application desktop Windows packagée (Tauri 2, NSIS `setup.exe` 3.9 Mo), base de données locale SQLite (`sqlx`, 4 migrations), synchronisation unidirectionnelle web → local (`/api/desktop/sync/*`), authentification native BetterAuth + keyring Windows, consultation et recherche hors-ligne (6 modes), et page d'administration web de téléchargement (`/admin/desktop-downloads`).

| Session | Objet | Commit | Statut |
|---|---|---|---|
| **E8P-S01** | Cadrage Desktop Tauri + sync BDD locale | `e5f5e80` | ✅ |
| **E8P-S02** | Setup toolchain Rust + squelette Tauri 2 + SQLite local | `7600a9a` | ✅ |
| **E8P-S03** | Schéma BDD locale SQLite + migrations SQLx | `905baf4` | ✅ |
| **E8P-S04** | Migration 0004 SQLx + endpoints API sync (`/api/desktop/sync/*`) | `f274aea` | ✅ |
| **E8P-S05** | Client sync Rust (manifest/pull + upsert SQLite) | `68b6d48` | ✅ |
| **E8P-S06** | UI desktop V1 (catalogue + recherche 6 modes + fiches) | `62c1577` | ✅ |
| **E8P-S07** | Packaging NSIS (`setup.exe`) + documentation installation | `7b969b6` | ✅ |
| **E8P-S08** | Tests E2E desktop headless (16 Rust + 8 Playwright UI) | `bcefed8` | ✅ |
| **E8P-S02-bis** | Correctif UX autofill web (`autoComplete="off"` / `"new-password"`) | `c00644e` | ✅ |
| **E8P-S09-bis** | Correctif login desktop + autofill UI (`readOnly` au focus) | `d0e6e26` | ✅ |
| **E8P-S09-ter** | Login desktop — alignement headers requête Rust sur navigateur | `180dbb8` | ✅ |
| **E8P-S09-quater-bis** | Parsing cookie de session BetterAuth dual-name (`__Secure-`) | `1b741dc` | ✅ |
| **E8P-S09-quater-ter** | Sync desktop (plugin `bearer()`) + navbar conditionnelle | `e9d91b3` | ✅ |
| **E8P-S10** | Page admin téléchargement desktop (`/admin/desktop-downloads`) | `71176d4` | ✅ |
| **E8P-S10-bis** | Résolution `@vercel/blob`, helper `auth-admin`, proxy download | `107d9db` | ✅ |
| **E8P-S09** | Clôture officielle de phase E8P + rapport final | (ce commit) | ✅ |

**Baseline finale E8P :** ESLint 0/0 · TS 0 err · Prettier 0 · Build **64 routes** (45 statiques + 19 dynamiques) · Tests Rust 18 passed · E2E UI 8 passed · E2E Web 284 passed / 4 skipped · Prisma 15 migrations · 0 dette Haute.

---

## 🏗️ E9 — REFONTE HYBRIDE (EN COURS)
**Objectif** : Éliminer la dualité `desktop/ui/` vs `src/app/` en offrant une **parité web complète** au desktop Tauri via un serveur Next.js embarqué en sidecar + couche d'abstraction `dataClient` unifiée.

**Document de cadrage :** `docs/e9-refonte-hybride.md` (348 lignes, 10 décisions verrouillées)

| Session | Objectif | Statut |
|---|---|---|
| **E9-R1** | Cadrage refonte hybride (architecture, plan, décisions) | ✅ Clôturée 2026-10-16 |
| **E9-R2** | Prototype Sidecar & communication dynamique | 🟢 À lancer |
| **E9-R3.a** | Migration Lot 1 (Dashboard, Recherche, Catalogue) | 🟢 À cadrer |
| **E9-R3.b** | Migration Lot 2 (Demandes, Reverse CAO, Plastiques) | 🟢 À cadrer |
| **E9-R3.c** | Migration Lot 3 (Machines, Usinage, Sync, Audit, Paramètres) | 🟢 À cadrer |
| **E9-R4** | Bridge SQLite complet & commandes Rust étendues | 🟢 À cadrer |
| **E9-R5** | Tests E2E hybrides, validation offline & performance | 🟢 À cadrer |
| **E9-R6** | Documentation finale, packaging NSIS & clôture | 🟢 À cadrer |

---
## 🏗️ E10 — STABILISATION (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée 2026-10-18** (commit `7b2869a`, tag `v0.4.0-e10`)

**Objet :** purge des dettes E9 (9 dettes clôturées), stabilisation documentaire, alignement `CONTEXT.md`/`JOURNAL.md`/`DEBT.md`.

| Session | Objet | Commit | Statut |
|---|---|---|---|
| **E10-R0** | Cadrage E10 + restructuration `DEBT.md` | `23f9ffb` | ✅ |
| **E10-R1** | Purge `D-E9-R3a-2` (ESLint) + `D-E9-R3a-3` (bridge mocké) | `3f17d98` + `b519b13` | ✅ |
| **E10-R2a** | Refactorisation `DEBT.md` v2 | `841ada0` | ✅ |
| **E10-R2b** | Purge `D-E9-R3a-1` (flash navigation) | `f69d84d` + `a705efd` | ✅ |
| **E10-R3** | Clôture `D-E9-R4b1-1` (obsolète) + `D-E9-R4b1-2` (requalifiée) | `9a9a43c` | ✅ |
| **E10-R4a** | Clôture `D-E9-R7-1`/`R7-1b` (obsolètes) | `c7e4fac` | ✅ |
| **E10-R5** | Clôture E10 — `CONTEXT.md` réécrit + `JOURNAL.md` complété | `7b2869a` | ✅ |

**Baseline :** ESLint 0/0 · TS 0 · Prettier 0 · Build 22 routes · E2E 284/0/4 · Prisma 15 migrations.

**Dettes E10 :** 9 clôturées, 1 créée (`D-E10-R2b-1`), 1 reportée (`D-E9-R5-1`).

---

## 🏗️ E11 — VALIDATION FONCTIONNELLE VERCEL (✅ CLÔTURÉE)

**Statut :** ✅ **Clôturée 2026-10-18** (commit `4c7350e`, tag `v0.5.0-e11`)

**Objet :** validation fonctionnelle des 6 pages déployées sur Vercel (4 desktop + 2 auth), via Playwright (8/8 passed).

| Session | Objet | Commit | Statut |
|---|---|---|---|
| **E11-R0** | Cadrage E11 (décisions D-E11-0 à D-E11-3) | — | ✅ |
| **E11-R1** | Validation Vercel 8/8 + clôture E11 | `c8e40da` + `4c7350e` | ✅ |

**Baseline :** ESLint 0/0 · TS 0 · Prettier 0 · Build 22 routes · E2E 284/0/4 + **8/8 Vercel** · Prisma 15 migrations.

**Dettes E11 :** 1 clôturée (`D-E9-R5-1`), 1 active (`D-E10-R2b-1`, post-E11).

**Production live :** `https://part-iva.vercel.app`

---

## 🏗️ E8 — FINALISATION, QA & DÉPLOIEMENT

## 🏗️ E8 — FINALISATION, QA & DÉPLOIEMENT
**Objectif** : rendre PartIVA production-ready.

| Session | Objectif | Livrable |
|---|---|---|
| **E8-S01** | Tests unitaires & intégration | Couverture minimale 60% |
| **E8-S02** | Tests E2E | Playwright sur parcours critiques |
| **E8-S03** | Optimisation performance | Lighthouse > 90 |
| **E8-S04** | SEO & accessibilité | Métadonnées, ARIA, contrastes |
| **E8-S05** | Monitoring & logs | Sentry, logger structuré |
| **E8-S06** | CI/CD | GitHub Actions → Vercel |
| **E8-S07** | Déploiement production | Domaine, SSL, backup, alerting |
| **E8-S08** | CI/CD desktop | Build auto `.msi`/`.exe` sur tag |
| **E8-S09** | Distribution finale | Page admin + liens publics + checksums |

**Définition de "E8 terminée"** : PartIVA est en production, monitorée, testée, déployable automatiquement.

**Durée estimée** : 3-4 semaines.

---

## 📅 Récapitulatif Global

| Étape | Sessions | Durée estimée | Dépendance |
|---|---|---|---|
| **E0** Fondation | 9 | 3-4 sem. | — |
| **E1** Modèle métier | 7 | 2-3 sem. | E0 |
| **E2** Identification | 9 | 3-4 sem. | E1 |
| **E3** Sources externes | 7 | 3-4 sem. | E2 |
| **E4** Acquisition/RE | 7 | 4-6 sem. | E3 |
| **E5** Intelligence | 7 | 4-6 sem. | E4 |
| **E6** Écosystème | 7 | 4-6 sem. | E5 |
| **E7** Desktop Tauri | 10 | 3-5 sem. | E6 |
| **E8** Finalisation | 9 | 3-4 sem. | E7 |
| **TOTAL** | **72 sessions** | **~30-42 sem.** | — |

**Estimation réaliste** : **7 à 11 mois** pour la plateforme complète hybride.

---

## 🧭 Principes Directeurs (constitutionnels)

1. **Aucune UI nouvelle tant que la donnée n'est pas réelle.** (E0 avant tout)
2. **Chaque pièce = un dossier numérique unique et traçable.**
3. **L'IA ne décide jamais seule** — validation humaine obligatoire.
4. **Chaque nouvelle pièce enrichit la BDD** — apprentissage incrémental.
5. **La boucle pièce → donnée → connaissance → pièce est sacrée.**
6. **Aucune intégration externe sans contrat/API identifié.**
7. **Tout ce qui n'est pas tracé n'existe pas** (logs, historique, versions).
8. **Le PCT (Protocole de Coopération Tripartite) régit chaque session.**
9. **Le code métier (schémas, validations, logique) doit être partageable entre web et desktop. Aucune logique dupliquée.**
10. **Toute fonctionnalité web doit être pensée "desktop-compatible" dès sa conception, même si le desktop arrive en E7.**
