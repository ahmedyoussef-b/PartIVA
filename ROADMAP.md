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

**Statut** : 🟢 En cours (E4-S01 cadrage)

### Sessions

| Session | Objet | Type | Statut |
|---|---|---|---|
| **E4-S01** | Cadrage phase E4 | Cadrage | ✅ Clôturée 2026-10-11 |
| **E4-S02** | Déblocage dettes Moyennes (HF token, JWT TraceParts, Docker) | Technique | ✅ Clôturée 2026-10-11 (blocage documenté — 3 dépendances externes absentes) |
| **E4-S03** | Tuning pipeline (score, timeout, mappings) | Technique | 🟢 À cadrer |
| **E4-S04** | UX produit (complétude client, poids de scoring) | Produit | 🟢 À cadrer |
| **E4-S05** | Performance (HNSW, index, requêtes) | Technique | 🟢 À cadrer |
| **E4-S06** | Audit qualité (couverture, E2E isolation) | Qualité | 🟢 À cadrer |
| **E4-S07** | Préparation déploiement (Vercel, CI/CD, monitoring) | Infra | 🟢 À cadrer |
| **E4-S08** | E3-S03-bis (OpenSERP) si Docker | Technique | 🟠 Bloquée (Docker) |
| **E4-clôture** | Audit de clôture phase E4 | Clôture | 🟢 À cadrer |

**Total :** 8 sessions + 1 clôture.

### Dépendances externes (Coordinateur)

| Dépendance | Session | Impact si absente |
|---|---|---|
| `HF_API_TOKEN` | E4-S02-A | `D-photo-embedding-backfill` reste bloquée |
| `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY` | E4-S02-B | `D-traceparts-credentials` reste bloquée |
| Docker (Desktop / Podman) | E4-S02-C | `D-openserp-instance` reste bloquée, E4-S08 reportée |
| Choix hébergeur (Vercel ?) | E4-S07 | Préparation déploiement partielle |
| Domaine / DNS | E4-S07 | Documentation déploiement partielle |

**Recommandation** : provisionner ces dépendances **avant** ou **pendant** E4-S02 pour maximiser les déblocages.

### Définition de "E4 terminée"

PartIVA est consolidé (dettes résolues ou documentées), l'UX client est améliorée, le déploiement est préparé, les sources externes sont débloquées (si possible).

**Durée estimée** : 3-4 semaines.

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

## 🏗️ E7 — DESKTOP TAURI
**Objectif** : livrer PartIVA en application desktop Windows packagée, synchronisée avec le backend web, distribuable via le dashboard admin.

| Session | Objectif | Livrable |
|---|---|---|
| **E7-S01** | Setup Tauri dans le repo | Structure `/src-tauri` + build local |
| **E7-S02** | Stratégie données desktop | Choix SQLite local / API-only / hybride |
| **E7-S03** | Auth desktop | Login sans navigateur (device flow ou clé API) |
| **E7-S04** | Adaptation UI desktop | Layout, raccourcis, menus natifs |
| **E7-S05** | Build & bundling | `.msi` + `.exe` produits en local |
| **E7-S06** | Versioning & release | Système de version + changelog |
| **E7-S07** | Page admin téléchargement | Dashboard `/admin/telechargements` |
| **E7-S08** | CDN / hébergement binaires | Stockage sécurisé + URLs stables |
| **E7-S09** | Auto-update | Mise à jour in-app (Tauri updater) |
| **E7-S10** | Codes signature Windows | Certificat code signing (optionnel mais recommandé) |

**Définition de "E7 terminée"** : un utilisateur peut télécharger `.msi` ou `.exe` depuis le dashboard admin, installer, se connecter, utiliser PartIVA en desktop, et recevoir les mises à jour.

**Durée estimée** : 3-5 semaines.

**⚠️ Note Superviseur** : 3 décisions critiques à trancher avant E7-S01 :
1. **Mode données desktop** : offline-first (SQLite) ou online-only (API) ?
2. **Auth desktop** : device flow OAuth, token long-lived, ou licence locale ?
3. **Sync** : desktop ↔ cloud — comment gérer les conflits ?

Ces décisions seront prises **en E7-S02**, pas maintenant.

---

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
