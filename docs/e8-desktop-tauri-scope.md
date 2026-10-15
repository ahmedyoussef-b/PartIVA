# E8P — Desktop Tauri — Document de cadrage

**Version :** 0.1 (brouillon E8P-S01)
**Date :** 2026-10-14
**Statut :** En cours de cadrage — validation Coordinateur requise
**Préfixe phase :** E8P (extension desktop de la phase E8 « stabilisation » clôturée le 2026-10-13 — préfixe distinct pour éviter la collision `E8-S01` → `E8-S09` occupée par la phase clôturée, cf. `docs/e8-close-report.md`)

---

## 1. Objet et périmètre

### 1.1 Objet

Cadrer la phase **E8P — Desktop Tauri** pour PartIVA : une application desktop embarquant une **réplique locale** de la base de données web, synchronisée de façon **unidirectionnelle (web → local)**.

Ce cadrage répond aux **3 décisions critiques** déjà listées dans `ROADMAP.md` §« MODE HYBRIDE — Web + Desktop Tauri » :

| Décision ROADMAP | Réponse de ce cadrage |
|---|---|
| Mode données desktop : offline-first (SQLite local) ou online-only (API) ? | **Offline-first** — BDD locale SQLite (D-E8P-S01-4) |
| Auth desktop : device flow OAuth, token long-lived, ou licence locale ? | **Token BetterAuth + keyring OS** — proposition, `⚠️ À TRANCHER D-E8P-S01-9` |
| Sync desktop ↔ cloud : gestion des conflits ? | **Aucun conflit possible** — sync unidirectionnelle web → local, local en lecture seule (D-E8P-S01-2) |

Les principes constitutionnels du ROADMAP s'appliquent sans modification :

- **N°9** — le code métier (schémas, validations, logique) doit être partageable entre web et desktop, aucune logique dupliquée ;
- **N°10** — toute fonctionnalité web doit être pensée « desktop-compatible » dès sa conception.

### 1.2 Cible utilisateurs

- Ateliers, mécaniciens, utilisateurs terrain (contexte ROADMAP « MODE HYBRIDE ») ;
- Mono-utilisateur local (un poste = une installation) ;
- Besoin central : consultation du catalogue **sans dépendance réseau**.

### 1.3 Périmètre V1 (proposé — lecture seule)

- Consultation catalogue (pièces, véhicules, fitments) ;
- Recherche locale (réplique des modes de recherche web) ;
- Consultation des fiches ;
- Fonctionnement **offline** après le premier sync.

**Écriture métier locale : hors périmètre V1** (conséquence directe de D-E8P-S01-2 — sync unidirectionnelle). `⚠️ À TRANCHER D-E8P-S01-1` : périmètre V1 lecture seule — tranchée implicitement par D-E8P-S01-2 (confirmé Coordinateur 2026-10-14).

### 1.4 Contraintes

- **Offline-first** : aucune fonctionnalité V1 ne doit exiger le réseau après le premier sync ;
- **Mono-utilisateur local** : pas de mode multi-utilisateurs concurrent sur une même installation en V1 ;
- **Windows uniquement en V1** (OS-V1 = Windows, decision Coordinateur 2026-10-14) ; macOS/Linux en V1.x ;
- **Baseline projet à ne pas dégrader** : ESLint 0/0 · TypeScript 0 · Prettier 0 · Build 59 routes · E2E 284/0/4 · Prisma 15 migrations (`docs/e7-close-report.md`) ;
- **Environnement de développement constaté (E8P-S01)** : Node v22.23.2 · npm 10.9.8 · **rustc 1.94.0 / cargo 1.94.0 déjà présents** — E8P-S02 (setup toolchain) n'est pas bloquée par une installation Rust.

---

## 2. Exigence structurante — BDD locale + synchronisation unidirectionnelle

### 2.1 Exigence Coordinateur (reformulation fidèle)

À l'exécution du fichier d'installation (`setup.exe` ou `.msi`) sur le poste utilisateur, l'application doit :

1. **Créer** une base de données locale sur la machine ;
2. **Initialiser** cette base avec le schéma nécessaire (structure) ;
3. **Amorcer la synchronisation** avec la BDD web (PostgreSQL Neon + pgvector) — pull complet des données ;
4. **Maintenir la synchronisation** dans le temps — pull incrémental (modalités `⚠️ À TRANCHER D-E8P-S01-3`) ;
5. **Sens : UNIDIRECTIONNEL web → local** — aucune donnée ne remonte du poste vers le cloud en V1 (**D-E8P-S01-2, décision acquise Coordinateur 2026-10-14**).

### 2.2 Nature des données à synchroniser

Données issues du schéma réel (`prisma/schema.prisma`, 23 modèles) — détail par table en §6.2. En résumé :

- **Catalogue** : `Part`, `PartCategory`, `PartSpecification`, `PartImage` (métadonnées), `Vehicle`, `Fitment` ;
- **Référentiels** : `Material`, `Machine`, `Supplier`/`PartSupplier` (portée à restreindre selon §6.2) ;
- **Profil utilisateur local** : ligne `User` propre au compte connecté (1 ligne) ;
- **Exclus en V1** : `AuditLog`, `Session`/`Account`/`Verification` (auth gérée par le web), `Request`, `ReverseEngineeringProject`/`Step`/`CadFile` (workflow Métier — écriture), `SearchCandidate` (cache de résultats éphémère).

### 2.3 Sens de synchronisation — VERROUILLÉ

**UNIDIRECTIONNEL web → local** (D-E8P-S01-2, acquise).

Conséquences structurantes :

- Web = **source de vérité unique** ; local = lecture seule ;
- **Aucune gestion de conflit** (supprimée du périmètre) ;
- Le local peut être *périmé* (stale), jamais *divergent* ;
- Endpoints API côté Next.js : **pull uniquement** (aucun POST/push en V1).

### 2.4 Volumétrie estimée

Seules valeurs **mesurées** disponibles à ce jour (source : `DEBT.md`, dette `D-tecdoc-auto-parts`, seed `auto-parts-db` E8-S03) :

| Jeu | Volume réel constaté |
|---|---|
| `Vehicle` | 500 lignes (seed) |
| `Part` | 1 521 lignes (seed) |
| `Fitment` | 1 505 lignes (seed) |
| `PartImage.embedding` | 5 vecteurs 768 dims (backfill E7-S02-reprise) |

Ordre de grandeur dérivé : base relationnelle de l'ordre de **quelques Mo** pour le catalogue actuel (hors binaires images/CAD — seul l'URL Cloudinary est répliqué). Toutes les autres tables sont `⚠️ VOLUMÉTRIE INCONNUE — à mesurer en E8P-S03` (requêtes `COUNT(*)`). Aucune valeur inventée (Règle #1).

Point critique reporté (D-E8P-S01-11, Différé) : les embeddings pgvector — un vecteur 768 dims ≈ 3 Ko (float32) par image ; tolérance à un catalogue massivement imagé à trancher en E8P-S03.

### 2.5 Fréquence de synchronisation

`⚠️ À TRANCHER D-E8P-S01-3` — proposition Superviseur reprise dans ce cadrage : **pull complet à l'install** · **pull incrémental au démarrage** · **déclenchement manuel (bouton UI)** · périodicité en arrière-plan à arbitrer. La fréquence influence directement le dimensionnement des endpoints (§6.3).

---

## 3. Architecture cible

```
┌──────────────────────────────────────────────────────────────┐
│  POSTE UTILISATEUR (Windows — V1 ; macOS/Linux en V1.x)      │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  App Desktop Tauri 2 (D-E8P-S01-6)                      │  │
│  │  ┌───────────────┐    ┌────────────────────────────┐   │  │
│  │  │  Frontend     │◄──►│  Backend Rust (Tauri)      │   │  │
│  │  │  Next.js      │    │  - Commandes IPC           │   │  │
│  │  │  (export      │    │  - Accès BDD locale (sqlx) │   │  │
│  │  │  statique)    │    │  - Client sync PULL-ONLY   │   │  │
│  │  └───────────────┘    └──────────────┬─────────────┘   │  │
│  │                                       │                 │  │
│  │                       ┌───────────────▼──────────────┐  │  │
│  │                       │  BDD LOCALE SQLite           │  │  │
│  │                       │  %APPDATA%\PartIVA\data\     │  │  │
│  │                       │  partiva.db (D-E8P-S01-4)    │  │  │
│  │                       │  - Schéma miroir            │  │  │
│  │                       │  - Métier en LECTURE SEULE   │  │  │
│  │                       └──────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────────────┬──────────────────────────────────┘
                            │  Synchronisation UNIDIRECTIONNELLE ↓
                            │  HTTPS GET (pull uniquement — D-E8P-S01-8)
                            ▼
┌──────────────────────────────────────────────────────────────┐
│  CLOUD — https://part-iva.vercel.app (production live E7-S03)│
│  - Next.js 16 API                                            │
│  - PostgreSQL Neon + pgvector 0.8                            │
│  - Endpoints /api/sync/* À CRÉER (E8P-S04)                   │
│    ⚠️ voir §6.3 : stub POST /api/sync existant (D48)         │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Rôle du frontend

Réutilisation du frontend Next.js en **export statique** (D-E8P-S01-5, acquise). Principes :

- Pas de duplication UI (aligné principe N°9) ;
- Les pages nécessitant un rendu serveur dynamique (RSC avec accès DB) sont hors du bundle desktop en V1 : le desktop interroge le backend Rust (IPC) qui lit la base locale ;
- `output: 'export'` et absence de `/api/*` Next dans le bundle desktop : les routes API Next restent côté web. Aucune modification de `next.config` dans cette session (documentaire) — arbitrage technique détaillé en E8P-S02/S06.

### 3.2 Moteur BDD locale — VERROUILLÉ

**SQLite** (D-E8P-S01-4, acquise) : natif de l'écosystème Tauri, zéro service à installer, fichier unique, transactions ACID. Accès via Rust (`sqlx` ou `rusqlite` — `⚠️ À TRANCHER D-E8P-S01-7`, proposition Superviseur : sqlx). Accès concurrents en V1 : processus unique Tauri (le frontend passe par l'IPC Rust), pas de pool multi-écrivain requis.

### 3.3 Embeddings en local — DIFFÉRÉ

D-E8P-S01-11 = **Différé** (décision Coordinateur 2026-10-14) : les embeddings (`PartImage.embedding`, `vector(768)` pgvector) **ne font pas partie du sync V1** ; la recherche photo/sémantique locale est hors périmètre V1 (indisponible offline). La recherche sémantique reste disponible côté web. La question (volume vs valeur) sera tranchée en E8P-S03, avec le schéma local, lorsque la volumétrie réelle des images sera mesurée.

### 3.4 Auth — proposition

Token de session BetterAuth présenté par le desktop aux endpoints de sync, stocké dans le **keyring OS** (Windows Credential Manager en V1) — `⚠️ À TRANCHER D-E8P-S01-9` (proposition Superviseur : token BetterAuth + keyring). Point technique à vérifier en E8P-S04 : les routes API actuelles s'appuient sur les cookies de session BetterAuth ; l'authentification d'un client desktop (en-tête `Authorization`) nécessite une adaptation à cadrer (le modèle `Session` possède un champ `token` unique — base d'une auth par token).

---

## 4. Stack technique

### 4.1 Tableau comparatif (choix verrouillés par le Coordinateur 2026-10-14)

| Couche | Option retenue | Alternative écartée | Décision |
|---|---|---|---|
| Framework desktop | **Tauri 2** | Electron | D-E8P-S01-6 ✅ |
| Frontend | **Next.js réutilisé (export statique)** | UI dédiée Svelte/Vue | D-E8P-S01-5 ✅ |
| BDD locale | **SQLite** | DuckDB / PostgreSQL embarqué | D-E8P-S01-4 ✅ |
| ORM local | sqlx (proposé) | Diesel / rusqlite brut | `⚠️ À TRANCHER D-E8P-S01-7` |
| Transport sync | **HTTP REST pull-only** | WebSocket, gRPC | D-E8P-S01-8 ✅ |
| Auth desktop | Token BetterAuth + keyring OS (proposé) | OAuth device flow | `⚠️ À TRANCHER D-E8P-S01-9` |
| Packaging | Tauri bundler (NSIS/MSI) | — | acquis (V1 = Windows) |

### 4.2 Prérequis toolchain — état constaté

| Prérequis | État (E8P-S01) | Remarque |
|---|---|---|
| Rust stable ≥ 1.77 | ✅ rustc 1.94.0 / cargo 1.94.0 | déjà installé — **non bloquant E8P-S02** |
| Node.js | ✅ v22.23.2 (npm 10.9.8) | version web maintenue |
| MSVC build tools (Windows) | À vérifier E8P-S02 | selon bundler cible |
| WebView2 Runtime | À vérifier E8P-S02 | distribué/embarqué par Tauri — condition d'installation (§7) |
| webkit2gtk (Linux) / Xcode CLT (macOS) | Non requis en V1 | reports V1.x (multi-OS différé) |

---

## 5. Périmètre fonctionnel V1 (MoSCoW)

**Must (V1) :**

- Installation via `setup.exe` / `.msi` (Windows en priorité) ;
- Création + initialisation de la BDD locale au premier lancement ;
- Premier sync (pull complet) depuis la BDD web ;
- Consultation catalogue pièces (lecture seule) ;
- Recherche locale (réplique des 6 modes web : texte, référence, spécifications, dimensions, photo **indisponible offline** — hors Must, multi) ;
- Consultation fiches pièces / véhicules / fitments ;
- Fonctionnement **offline** après le premier sync.

**Should (V1 si possible) :**

- Sync incrémental périodique ;
- Indicateur d'état de sync dans l'UI (remplace/remotive le stub admin existant, cf. §6.3) ;
- Recherche par véhicule / VIN (routes web `POST /api/search/vehicle` et `/api/search/vin` existantes, E6-S08) — dépend de `Fitment`/`Vehicle` en sync (cf. §6.2).

**Could (V1.x) :**

- Export PDF des fiches ;
- Impression ;
- Multi-comptes local ;
- Recherche embeddings locale (liée à D-E8P-S01-11).

**Won't (hors V1) :**

- **Écriture métier locale** (création/modification de pièces) — interdit par D-E8P-S01-2 ;
- **Sync bidirectionnelle** — idem ;
- Marketplace / paiement ;
- Auto-update Tauri (mise à jour par réinstallation en V1).

Note modes de recherche : la recherche **photo** web (E2-S09, dépendante des embeddings) n'est pas réplicable offline en V1 — conséquence de D-E8P-S01-11. Les 5 autres modes (texte, référence, spécifications, dimensions, multi) s'appuient sur des données relationnelles locales.

---

## 6. Modèle de synchronisation (web → local)

### 6.1 Stratégie

- **Full pull** à l'installation : dump des tables cibles via les endpoints (§6.3), application dans la base locale ;
- **Incremental pull** ensuite : filtre sur `updatedAt` côté serveur.

⚠️ Contrainte de schéma identifiée (E8P-S01, lecture `schema.prisma`) : les modèles `Fitment`, `PartImage` et `PartVersion` **n'ont pas de colonne `updatedAt`** (seulement `createdAt`). Un incrémentiel `updatedAt`-only est donc impossible sur ces tables. Options (à trancher en E8P-S03/S04) : s'appuyer sur `createdAt` + version de manifest, ou ajouter `updatedAt` via migration (hors périmètre de cette session documentaire).

**Stratégie de reprise :** checkpoint local du dernier curseur appliqué, application idempotente (upsert par `id`).

**Décision `D-E8P-S03-1` = Option B (R.5.21 — avance par défaut)** : les 3 tables sans `updatedAt` (`Fitment`, `PartImage`, `PartVersion`) sont synchronisées en **full-refresh** — pas de migration `updatedAt` côté web (baseline web maintenue à 15 migrations, risque production écarté). Le suivi par table est porté par la table locale `sync_metadata` (`full_refresh_required`, cf. migration `0003`). Réévaluation prévue si la volumétrie croît fortement (V1.x).

### 6.2 Données à synchroniser (tables réelles du schéma)

| Table | Volumétrie | Fréquence proposée | Priorité |
|---|---|---|---|
| `Part` | 1 521 (mesuré, seed) | incrémental (`updatedAt`) | Must |
| `Vehicle` | 500 (mesuré, seed) | incrémental (`updatedAt`) | Must |
| `Fitment` | 1 505 (mesuré, seed) | `⚠️ VOLUMÉTRIE INCONNUE — à mesurer en E8P-S03` (pas d'`updatedAt` : cf. §6.1) | Must |
| `PartSpecification` | À MESURER (E8P-S03) | incrémental (`updatedAt`) | Must |
| `PartCategory` | À MESURER (E8P-S03) | incrémental (`updatedAt`) | Must |
| `PartImage` (métadonnées, URLs) | À MESURER (E8P-S03) | full re-pull léger ou via `createdAt` | Should |
| `PartImage.embedding` (vector 768) | 5 (mesuré) | **EXCLU du sync V1** (D-E8P-S01-11) | Non (différé) |
| `Material` / `Machine` | À MESURER (E8P-S03) | full re-pull (référentiels lents) | Should |
| `Supplier` / `PartSupplier` | À MESURER (E8P-S03) | incrémental | Could |
| `Attachment` (métadonnées, URLs) | À MESURER (E8P-S03) | via `Part` | Could |
| `PartVersion` | À MESURER (E8P-S03) | pas d'`updatedAt` (cf. §6.1) | Could |
| `User` (profil du compte connecté) | 1 | à chaque démarrage | Must |
| `ScoringWeights` | 1 (défaut `default`) | à chaque démarrage | Should (affichage local des scores) |
| `AuditLog`, `Session`, `Account`, `Verification`, `Request`, `ReverseEngineering*`, `CadFile`, `SearchCandidate` | — | — | **Non synchronisés en V1** (auth serveur + workflow écriture + cache éphémère) |

**Implémentation E8P-S03** : migrations SQLx `desktop/src-tauri/migrations/0001_init.sql` (part, vehicle, fitment) · `0002_add_partimage_partversion.sql` (part_image, part_version) · `0003_sync_metadata.sql` (sync_metadata) — miroir fidèle, `enums` → `TEXT` + `CHECK`, `DateTime` → `TEXT` ISO 8601, `Json` → `TEXT`, `search_vector`/`embedding` exclus. Détails : `desktop/src-tauri/migrations/README.md`. ⚠️ `PartSpecification`/`PartCategory` (Must du cadrage) hors périmètre de l'ordre E8P-S03 → à ajouter en migration `0004` avec le client sync (E8P-S04/S05).

### 6.3 Endpoints API (Next.js) — implémentés E8P-S04

Namespace `/api/desktop/sync/*` (**D-E8P-S01-12 = B**, verrouillée) :

- `GET /api/desktop/sync/manifest` — manifest de sync : version, direction (`web_to_local`), liste des 7 tables synchronisables avec leur stratégie (incrémentale vs full-refresh) ;
- `GET /api/desktop/sync/pull?table=<name>&since=<ISO>&skip=<n>` — delta par table (pull uniquement) : filtre `updatedAt` pour les tables incrémentales, full-refresh paginé pour `fitment`/`part_image`/`part_version` (Option B, `D-E8P-S03-1`), pagination `take=500` + `skip`.

Contrat de sécurité : auth BetterAuth obligatoire (401 sans session), whitelist des tables via `src/lib/sync/tables.ts` (délégués Prisma — aucune interpolation de nom), champs exposés = miroir des migrations locales (`search_vector` tsvector et embeddings exclus). Registre partagé : `src/lib/sync/tables.ts`.

Le namespace `/api/desktop/sync/*` **isole le stub existant** : `POST /api/sync` (`src/app/api/sync/route.ts`, E0-S07b-3-D, dette `D-sync-stub-d48`) reste intact et sans collision ; son remplacement éventuel reste une décision ultérieure (hors périmètre E8P).

### 6.4 Gestion des conflits

**Supprimée** : sync unidirectionnelle web → local, local en lecture seule (D-E8P-S01-2). Si une écriture locale est un jour autorisée (V1.x), une stratégie dédiée sera cadrée avant toute implémentation.

### 6.5 Reprise sur erreur

- Checkpoint local : dernier curseur (`since`) appliqué avec succès ;
- Application idempotente (upsert par identifiant) ;
- Échec de sync non bloquant : l'app reste utilisable sur les dernières données locales (état « stale » affiché en UI).

---

## 7. Installation et initialisation (setup.exe / .msi)

```
1. Utilisateur exécute setup.exe (ou .msi)
2. Installeur Windows (Tauri bundler — NSIS/MSI) :
   a. Vérifie le prérequis WebView2 Runtime (Windows)
   b. Copie les binaires dans %ProgramFiles%\PartIVA\
   c. Crée les raccourcis (menu Démarrer + bureau)
   d. Enregistre le désinstalleur
3. Premier lancement :
   a. Création de la BDD locale %APPDATA%\PartIVA\data\partiva.db
   b. Application du schéma local (migrations locales versionnées — E8P-S03)
   c. Écran de connexion (BetterAuth) OU import de token existant (cf. D-E8P-S01-9)
   d. Sync initial (pull complet) avec barre de progression
   e. Passage en mode prêt (offline-ready)
4. Lancements suivants :
   a. Sync incrémental au démarrage (si réseau disponible)
   b. Sync périodique (intervalle conditionné par D-E8P-S01-3)
   c. Sync manuelle via bouton UI
```

Points ouverts (à trancher en E8P-S02/S03 — non bloquants pour ce cadrage, marqués sans numéro de décision pour ne pas inventer d'identifiant) :

- **Emplacement de la BDD locale** : `%APPDATA%\PartIVA\data\` proposé par défaut (alternatives : dossier custom, portable) ;
- **Comportement si la sync initiale échoue** : proposition = l'app reste utilisable en mode dégradé (données vides + message), sans blocage dur ;
- **Chiffrement de la BDD locale** (SQLCipher) : optionnel, reporté V1.x (cf. §8) ;
- **Taille de l'installeur** : dépend du bundler et de l'embarquement WebView2 — à mesurer en E8P-S07.

---

## 8. Sécurité et intégrité des données

- **Stockage du token** : keyring OS — Windows Credential Manager (V1), macOS Keychain / libsecret (V1.x, multi-OS différé). Jamais de token en clair dans un fichier de config ou les logs (Sécurité #7 — aucune variable sensible en `NEXT_PUBLIC_`, principe maintenu pour le desktop) ;
- **Transport** : HTTPS uniquement vers le cloud (Vercel) ; pas de fallback HTTP ;
- **Intégrité de la sync** : vérification par checksums (manifest + empreinte par table/lot) à concevoir en E8P-S04 ; application idempotente (upsert `id`) ;
- **Chiffrement BDD locale** (SQLCipher) : non retenu en V1, recommandé en V1.x — données de catalogue majoritairement publiques dans le seed ; les pots de données sous licence (TecDoc/TraceParts) ne sont pas synchronisés en V1 (§2) ;
- **Contraintes légales** : les données répliquées en local sont celles du propre référentiel PartIVA + seed open-data (`auto-parts-db`, MIT). Aucune donnée TecDoc/TraceParts (connecteurs en mock, contrats en attente — `D-tecdoc-credentials`, `D-traceparts-credentials`) : la duplication locale de données sous licence reste interdite tant que les contrats ne l'autorisent pas. À vérifier avant tout élargissement du périmètre de sync.

---

## 9. Plan de sessions E8P-S02 → E8P-S09

| Session | Objet | Type | Dépendance |
|---|---|---|---|
| E8P-S02 | Setup toolchain Rust + projet Tauri squelette (vérifier MSVC/WebView2, squelette buildable) | Exécution | E8P-S01 |
| E8P-S03 | Schéma BDD locale + migrations locales (résoudre `updatedAt` manquants — §6.1, mesurer volumétries réelles — §6.2, trancher D-E8P-S01-7 ORM) | Exécution | E8P-S02 |
| E8P-S04 | Endpoints API sync Next.js (manifest + pull ; arbitrage stub `/api/sync` D48 ; auth token desktop — trancher D-E8P-S01-9/-12) | Exécution | E8P-S02 |
| E8P-S05 | Client sync Rust (pull full + incremental + checkpoint) | Exécution | E8P-S03, E8P-S04 |
| E8P-S06 | UI desktop V1 (catalogue + recherche + fiches ; export statique Next — cf. §3.1) | Exécution | E8P-S05 |
| E8P-S07 | Packaging NSIS/MSI + installeur (mesure taille, WebView2) | Exécution | E8P-S06 |
| E8P-S08 | Tests E2E desktop + validation offline | Exécution | E8P-S07 |
| E8P-S09 | Documentation utilisateur + clôture phase (écriture du rapport de clôture E8P) | Documentation | E8P-S08 |

---

## 10. Risques et dettes anticipés

| Risque | Impact | Mitigation |
|---|---|---|
| Volumétrie embeddings trop lourde pour sync locale | Élevé | Embeddings exclus du sync V1 (D-E8P-S01-11 — différé) |
| Complexité sync incrémental | Moyen | Démarrer par full pull ; incremental ensuite ; checkpoints idempotents |
| Tables sans `updatedAt` (`Fitment`, `PartImage`, `PartVersion`) | Moyen | Manifest versionné par table ou migration `updatedAt` (E8P-S03/S04) |
| Drift schéma local vs web | Moyen | Versioning dans le manifest de sync (§6.3) |
| Stub `POST /api/sync` existant (page admin + daemon 45 s) | Moyen | Arbitrage d'namespace en E8P-S04 (D-E8P-S01-12) — pas de double implémentation |
| Taille installeur > 100 Mo | Faible | Mesure en E8P-S07 ; lazy download des données déjà prévu (sync post-install) |
| Multi-OS (macOS/Linux) retardé | Faible | V1 = Windows uniquement (OS-V1) |

**Dettes anticipées (à ajouter à `DEBT.md` en fin de phase — non inscrites dans cette session documentaire) :**

| ID proposé | Description | Sévérité |
|---|---|---|
| `D-desktop-sync-bidirectionnel` | Écriture locale + sync bidirectionnelle (gestion de conflits) si le desktop devient productif | Faible |
| `D-desktop-embeddings-locaux` | Embeddings locaux + recherche sémantique offline si D-E8P-S01-11 est débloqué un jour | Moyenne |
| `D-desktop-multi-os` | Portage macOS/Linux | Faible |

---

## 11. Décisions à trancher (D-E8P-S01-x)

### 11.1 Décisions VERROUILLÉES (Coordinateur, 2026-10-14)

| Décision | Valeur | Statut |
|---|---|---|
| `D-E8P-C1` | Clôture E8P-S01 validée | ✅ verrouillée (délégation Coordinateur 2026-10-14) |
| `D-E8P-S01-0` | `1b` — restauration `next-env.d.ts` autorisée puis exécutée par l'Exécutant | ✅ verrouillée + appliquée |
| `D-E8P-S01-NUM` | `A` — préfixe de phase `E8P` | ✅ verrouillée |
| `D-E8P-S01-1` | Périmètre V1 lecture seule | ✅ implicite via D-E8P-S01-2 |
| `D-E8P-S01-2` | Sync **unidirectionnelle** web → local | ✅ verrouillée |
| `D-E8P-S01-3` | `A` — sync : install (full) + démarrage (incrémental) + manuel (bouton UI) | ✅ verrouillée (délégation 2026-10-14) |
| `D-E8P-S01-4` | Moteur BDD locale = **SQLite** | ✅ verrouillée |
| `D-E8P-S01-5` | Frontend = **Next.js réutilisé** (export statique) | ✅ verrouillée |
| `D-E8P-S01-6` | Framework desktop = **Tauri 2** | ✅ verrouillée |
| `D-E8P-S01-7` | `A` — ORM local = **sqlx** (async, SQLite natif) | ✅ verrouillée (délégation 2026-10-14) |
| `D-E8P-S01-8` | Transport sync = **HTTP REST pull-only** | ✅ verrouillée |
| `D-E8P-S01-9` | `A` — auth = **token BetterAuth + keyring OS** | ✅ verrouillée (délégation 2026-10-14) |
| `D-E8P-S01-10` | Périmètre Must | ✅ implicite (lecture seule + sync pull) |
| `D-E8P-S01-11` | Embeddings locaux = **Différé** (→ E8P-S03) | ✅ verrouillée (différé acté) |
| `D-E8P-S01-12` | `B` — endpoints sync sous namespace **`/api/desktop/sync/*`** (isole le stub `POST /api/sync`, D48) | ✅ verrouillée (délégation 2026-10-14) |
| `OS-V1` | Cible V1 = **Windows uniquement** | ✅ verrouillée |

### 11.2 Décisions restant À TRANCHER

**Aucune à ce jour** — les 4 décisions mineures restantes au cadrage (`D-E8P-S01-3` fréquence, `-7` ORM, `-9` auth, `-12` endpoints) ont été tranchées par délégation du Coordinateur (Superviseur IA, 2026-10-14) et figurent verrouillées en §11.1. Points ouverts reportés aux sessions d'exécution : emplacement exact de la BDD locale, comportement si sync initiale échoue, chiffrement BDD (SQLCipher), taille installeur (cf. §7 — à trancher en E8P-S02/S03, non bloquants pour le cadrage).

### 11.3 Note de traçabilité — collision de numérotation

Dans le catalogue initial de l'ordre E8P-S01, l'identifiant `D-E8P-S01-11` désignait la **stratégie de sync** (full vs incremental). Les décisions Coordinateur du 2026-10-14 l'ont réaffecté aux **embeddings locaux** (Différé). Pour éviter tout nouvel identifiant inventé : la stratégie de sync est traitée avec `D-E8P-S01-3` (fréquence/cycles) — proposition « full pull (install) + incrémental (ensuite) » inscrite en §6.1. Incohérence signalée au Coordinateur, sans impact bloquant (R.5.21 — avance par défaut).

---

## 12. Hors périmètre V1

- Écriture métier locale (création/modification de pièces, saisie d'interventions) ;
- Sync bidirectionnelle (local → web) et gestion de conflits ;
- Multi-OS : macOS / Linux (reportés V1.x, cf. `D-desktop-multi-os`) ;
- Marketplace / paiement ;
- Auto-update Tauri (mise à jour manuelle par réinstallation en V1) ;
- Recherche photo / embeddings en local (D-E8P-S01-11 — différé) ;
- Portail admin de téléchargement des installeurs (existant dans la vision ROADMAP « MODE HYBRIDE » — dépend des installeurs produits en E8P-S07 ; à cadrer après E8P-S07).

---

**Fin du document de cadrage — E8P-S01 (brouillon v0.1, en attente de validation Coordinateur).**
