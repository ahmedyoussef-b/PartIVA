# E9 — Refonte Hybride (Desktop Tauri Complet) — Document de Cadrage

**Phase :** E9 (Refonte hybride — Desktop Tauri complet)  
**Session :** E9-R1 — Cadrage de la refonte  
**Date :** 2026-10-16  
**Auteur :** Exécutant (Kilo Code) & Superviseur IA  
**Statut :** ✅ Cadrage validé (décisions verrouillées par le Coordinateur)  
**Document de référence :** `docs/e9-refonte-hybride.md`  

---

## 1. Objet et périmètre

### 1.1 Objet et motivation

La phase E8P a validé la faisabilité technique de PartIVA Desktop (Tauri 2, SQLite local, synchronisation unidirectionnelle web → local, packaging NSIS autonome de 3.9 Mo, 18 tests Rust et 8 tests UI). Cependant, `desktop/ui/` est actuellement une interface statique minimale isolée (5 pages : `/catalogue`, `/recherche`, `/part`, `/login`, `/`), déconnectée de la richesse fonctionnelle de l'application web principale (`src/app/`, 64 routes).

La **phase E9 (Refonte hybride)** a pour mission d'éliminer cette dualité en offrant une **parité web complète** au sein de l'application desktop native Windows, avec :
1. **Fluidité & non-blocage** : Les pages s'affichent instantanément sans dépendance réseau bloquante ;
2. **Préservation des fonctionnalités web** : Les Server Components, Server Actions et routes dynamiques s'exécutent localement grâce à un serveur Next.js autonome embarqué en **sidecar** ;
3. **Accès transparent aux données** : Une couche d'abstraction unifiée (`dataClient`) aiguille de manière transparente les requêtes vers le backend Rust / SQLite local (en mode desktop) ou vers l'API web / Prisma (en mode web) ;
4. **Maintenance à code unique** : Le frontend de `src/app/` devient l'interface universelle PartIVA, éliminant définitivement le code dupliqué de `desktop/ui/`.

### 1.2 Périmètre fonctionnel inclus (Parité web)

L'application desktop intégrera l'ensemble des modules opérationnels atelier et métier :
- **Vue d'ensemble / Dashboard** (`/admin/dashboard`, `/client/dashboard`) : KPIs atelier, état du parc, demandes urgentes.
- **Moteur de recherche unifié** (`/admin/recherche`, `/client/dashboard/recherche`) : 6 modes de recherche (texte, référence, spécifications, dimensions, photo, multi-critères).
- **File des demandes** (`/admin/demandes`, `/client/dashboard/demandes`) : Suivi des demandes de pièces et interventions.
- **Reverse Engineering & CAO** (`/admin/reverse-engineering`) : Projets de rétro-conception, étapes, visualiseur de pièces.
- **Catalogue & Référentiel Pièces BDD** (`/admin/pieces`, `/client/pieces-pretes`) : Fiches complètes, dossiers numériques, historique des versions, pièces prêtes.
- **Plastiques Techniques & Matériaux** (`/admin/materiaux`, `/materiaux`) : Base matières, fiches techniques.
- **Parc Machines CNC** (`/admin/machines`) : Répertoire machines, liaisons pièces/outillages.
- **Atelier Usinage** (`/admin/usinage`) : Planning, capacités atelier.
- **Console de Synchronisation Cloud** (`/admin/sync`) : Statut de la réplication locale, historique, déclenchement manuel.
- **Journal d'Audit** (`/admin/audit`) : Traçabilité des actions locales et synchronisées.
- **Paramètres utilisateur** (`/admin/parametres`) : Préférences, profil local, gestion de session.

### 1.3 Hors périmètre desktop V1 (Réservé au Cloud Web)

Sont exclus de l'application de bureau locale en V1 :
- **Console administrateur de gestion des comptes & organisations** (création/suppression d'utilisateurs globaux) ;
- **Gestion des variables d'environnement système cloud** ;
- **Logs d'infrastructure et métriques Vercel** ;
- **Configuration des fournisseurs de paiement ou marketplace en ligne**.

---

## 2. Architecture cible (Next.js Sidecar + Webview Tauri)

### 2.1 Schéma architectural

```
┌────────────────────────────────────────────────────────────────────────┐
│  POSTE UTILISATEUR (Windows 10/11)                                     │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Binaire Tauri 2 (PartIVA Desktop — partiva-desktop.exe)         │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Processus Sidecar Node.js (partiva-server.exe)            │  │  │
│  │  │  - Next.js 16 (standalone server output)                   │  │  │
│  │  │  - Exécution des React Server Components (RSC)             │  │  │
│  │  │  - Exécution des Server Actions (`use server`)             │  │  │
│  │  │  - Routes API locales (/api/*)                             │  │  │
│  │  │  - Écoute stricte sur 127.0.0.1:<port dynamique>          │  │  │
│  │  │  - Communication du port assigné à Tauri via stdout        │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  │                                                                  │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  Webview2 (Interface Utilisateur)                          │  │  │
│  │  │  - Navigation native vers http://127.0.0.1:<port>          │  │  │
│  │  │  - Injection IPC Tauri : window.__TAURI__.core.invoke      │  │  │
│  │  │  - Couche dataClient unifiée : aiguillage IPC vs HTTP      │  │  │
│  │  │  - CSP restreinte : default-src 'self' http://127.0.0.1:*  │  │  │
│  │  └──────────────────┬─────────────────────────────────────────┘  │  │
│  │                     │ IPC Tauri (invoke)                         │  │
│  │  ┌──────────────────▼─────────────────────────────────────────┐  │  │
│  │  │  Backend Rust (Tauri Core)                                 │  │  │
│  │  │  - Commandes IPC : sync_now, login, list_parts, search...  │  │  │
│  │  │  - Moteur BDD locale SQLite (sqlx async pool)              │  │  │
│  │  │  - Gestionnaire de session & Windows Credential Manager     │  │  │
│  │  │  - Supervision du sidecar : spawn, healthcheck, restart    │  │  │
│  │  └──────────────────┬─────────────────────────────────────────┘  │  │
│  │                     │ BDD SQLite                                 │  │
│  │                     ▼                                            │  │
│  │  ┌────────────────────────────────────────────────────────────┐  │  │
│  │  │  %APPDATA%\PartIVA\data\partiva.db                         │  │  │
│  │  │  (Réplique locale relationnelle — lecture seule atelier)   │  │  │
│  │  └────────────────────────────────────────────────────────────┘  │  │
│  └─────────────────────┬────────────────────────────────────────────┘  │
└────────────────────────┼───────────────────────────────────────────────┘
                         │ Synchronisation unidirectionnelle
                         │ HTTPS GET (pull-only avec Bearer token)
                         ▼
┌────────────────────────────────────────────────────────────────────────┐
│  CLOUD PRODUCTION (https://part-iva.vercel.app)                        │
│  - Neon PostgreSQL + pgvector (Source unique de vérité)                │
│  - BetterAuth central                                                  │
│  - Endpoints de synchronisation : /api/desktop/sync/*                  │
└────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Principes de fonctionnement du sidecar

1. **Cycle de vie supervisé** : Au lancement de l'application, Tauri affiche un écran de démarrage (splash screen natif) et lance le binaire `partiva-server.exe` en arrière-plan.
2. **Allocation dynamique de port** : Le serveur Next.js standalone se lie à l'adresse locale `127.0.0.1` sur un port libre alloué par le système (`port 0`), éliminant tout risque de conflit avec d'autres services locaux.
3. **Poignée de main (Handshake)** : Le serveur imprime sur sa sortie standard le port alloué (ex. `[SERVER_READY] port=48921`). Tauri capture ce message, valide la disponibilité via un healthcheck HTTP (`GET /api/health`), ferme le splash screen et redirige la Webview vers l'URL locale.
4. **Arrêt sécurisé** : Lorsque l'utilisateur quitte l'application ou ferme la fenêtre principale, Tauri intercepte l'événement de fermeture et termine proprement le processus sidecar Node.js.

---

## 3. Couche d'abstraction `dataClient`

Pour permettre au même composant React de s'exécuter aussi bien en environnement web (Vercel) qu'en environnement desktop (Tauri) sans modification de code métier, un module unifié d'accès aux données est mis en place : **`src/lib/data-client.ts`**.

### 3.1 Conception technique

```typescript
// src/lib/data-client.ts

export const isTauri = (): boolean =>
  typeof window !== 'undefined' && '__TAURI__' in window;

interface TauriWindow extends Window {
  __TAURI__?: {
    core: {
      invoke: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
    };
  };
}

/**
 * Exécute une commande de données via IPC Tauri en desktop,
 * ou via fetch HTTP en environnement web standard.
 */
export async function executeDataQuery<T>(
  tauriCommand: string,
  tauriArgs: Record<string, unknown>,
  webUrl: string,
  webOptions?: RequestInit
): Promise<T> {
  if (isTauri()) {
    const tauri = (window as unknown as TauriWindow).__TAURI__;
    if (tauri?.core?.invoke) {
      return tauri.core.invoke<T>(tauriCommand, tauriArgs);
    }
  }

  const response = await fetch(webUrl, webOptions);
  if (!response.ok) {
    throw new Error(`Erreur réseau (${response.status}): ${response.statusText}`);
  }
  return response.json() as Promise<T>;
}
```

### 3.2 Exemple d'application : Consultation et recherche de pièces

```typescript
export async function getParts(params?: { limit?: number; offset?: number }) {
  return executeDataQuery<Part[]>(
    'list_parts',
    { limit: params?.limit ?? 50, offset: params?.offset ?? 0 },
    `/api/parts?${new URLSearchParams(params as Record<string, string> || {})}`
  );
}

export async function searchParts(mode: string, query: string) {
  return executeDataQuery<SearchCandidate[]>(
    'search_parts',
    { mode, query },
    `/api/search?mode=${encodeURIComponent(mode)}&q=${encodeURIComponent(query)}`
  );
}
```

### 3.3 Avantages architecturaux
- **Transparence totale pour les composants d'interface** : Aucun composant ne gère de condition `if (isDesktop)`.
- **Zéro latence en desktop** : Les lectures passent directement par SQLite via IPC mémoire, sans overhead HTTP local.
- **Résilience hors-ligne** : En mode déconnecté, `dataClient` s'exécute localement sans tenter d'appel internet.

---

## 4. Audit préalable de l'existant

### 4.1 Audit de l'application web (`src/app/`)

L'application web compte **36 pages** et **64 routes compilées**. L'architecture repose sur une séparation claire entre Server Components et Client Components interactifs :

| Page / Module | Type composant | Accès données Web | Aiguillage Desktop E9 |
|---|---|---|---|
| `/admin/dashboard` | Server Component (`page.tsx`) + Client (`dashboard-client.tsx`) | `@/lib/data/requests`, `@/lib/data/machines` | Sidecar Node.js + IPC `dashboard_stats` |
| `/admin/pieces` | Server Component + Client (`pieces-client.tsx`) | `@/lib/data/parts` (Prisma) | IPC `list_parts` (SQLite local) |
| `/admin/recherche` | Server Component + Client (`search-bar.tsx`) | `@/lib/data/search`, `/api/search` | IPC `search_parts` (SQLite local) |
| `/admin/demandes` | Server Component + Client (`demandes-client.tsx`) | `@/lib/data/requests` | IPC `list_requests` / sidecar |
| `/admin/reverse-engineering` | Server Component + Client (`reverse-engineering-list-client.tsx`) | `@/lib/data/reverse-engineering` | IPC `list_re_projects` |
| `/admin/materiaux` | Server Component + Client (`materiaux-client.tsx`) | `@/lib/data/materials` | IPC `list_materials` |
| `/admin/machines` | Server Component + Client (`machines-client.tsx`) | `@/lib/data/machines` | IPC `list_machines` |
| `/admin/usinage` | Server Component + Client (`usinage-client.tsx`) | `@/lib/data/parts` | IPC `list_parts_status` |
| `/admin/sync` | Server Component + Client (`sync-client.tsx`) | `/api/desktop/sync/manifest` | IPC `sync_now` + SQLite metadata |
| `/admin/audit` | Client Component direct | État local & logs | IPC `list_audit_logs` |
| `/admin/parametres` | Client Component direct | Préférences & sessions | Keyring OS + IPC |
| `/admin/desktop-downloads`| Server Component direct | `docs/desktop-releases.json` | Masqué ou pass-through local |
| `/(auth)/login` | Client Component | BetterAuth client | IPC `login` (Keyring OS) |

### 4.2 Audit de l'application desktop actuelle (`desktop/`)

- **Pages existantes dans `desktop/ui/` (5)** :
  - `desktop/ui/app/catalogue/page.tsx`
  - `desktop/ui/app/recherche/page.tsx`
  - `desktop/ui/app/part/page.tsx`
  - `desktop/ui/app/login/page.tsx`
  - `desktop/ui/app/page.tsx`
- **Commandes Rust Tauri exposées (8)** :
  - Authentification : `login`, `logout`, `save_token`, `load_token`
  - Données : `list_parts`, `search_parts`, `get_part`
  - Synchronisation : `sync_now`
- **Schéma SQLite local** : 4 migrations SQLx (`part`, `vehicle`, `fitment`, `part_image`, `part_version`, `part_specification`, `part_category`, `sync_metadata`).
- **Constat** : `desktop/ui/` est une duplication partielle et statique. Elle sera **intégralement supprimée** au terme de la migration E9-R3, `src/app/` devenant l'interface unique.

---

## 5. Gestion et cycle de vie du serveur Sidecar

### 5.1 Packaging standalone de Next.js
Dans `next.config.mjs`, l'activation de `output: 'standalone'` génère un dossier optimisé `.next/standalone` contenant uniquement les modules nécessaires à l'exécution du serveur Node.js, sans dépendances superflues.

### 5.2 Emballage en binaire externe (Sidecar Tauri)
Tauri 2 permet de packager des binaires externes via la directive `bundle.externalBin`.
Pour Windows, un lanceur Node.js compacté (via `pkg` ou un runtime Node.js embarqué) sera placé dans `desktop/src-tauri/binaries/partiva-server-x86_64-pc-windows-msvc.exe`.

### 5.3 Protocole de démarrage & Healthcheck
1. Tauri exécute `tauri::async_runtime::spawn` pour démarrer le sidecar avec les variables d'environnement appropriées (`PORT=0`, `HOST=127.0.0.1`, `NODE_ENV=production`).
2. Le processus Rust lit stdout jusqu'à extraction du port dynamique.
3. Un client HTTP Rust interroge périodiquement `http://127.0.0.1:<port>/api/health` (polling toutes les 150ms, timeout maximal 30s).
4. Dès réception du statut HTTP 200, la Webview navigue vers l'adresse locale.

### 5.4 Résilience et arrêt
- **Redémarrage automatique** : En cas de défaillance imprévue du sidecar (code de sortie non nul), Tauri tente jusqu'à 3 redémarrages successifs avant d'afficher un dialogue d'erreur natif.
- **Nettoyage strict** : Le processus sidecar est rattaché à un Job Object Windows garantissant son extinction immédiate dès la fermeture du processus parent `partiva-desktop.exe`.

---

## 6. Sécurité

1. **Isolement réseau strict** :
   - Le serveur Next.js écoute **uniquement sur l'interface de bouclage locale `127.0.0.1`** (jamais sur `0.0.0.0`). Aucune machine tierce du réseau local ne peut joindre ce serveur.
2. **Politique de Sécurité du Contenu (CSP)** :
   - La configuration `app.security.csp` de `tauri.conf.json` restreint les connexions à `default-src 'self' http://127.0.0.1:*` et interdit le chargement de scripts distants non vérifiés.
3. **Protection des secrets & Tokens** :
   - Aucun secret d'administration cloud n'est embarqué dans le binaire.
   - Le jeton de session BetterAuth est conservé exclusivement dans le **Windows Credential Manager** via la crate `keyring-rs`.
4. **Zéro télémétrie** :
   - Next.js telemetry est désactivée via `NEXT_TELEMETRY_DISABLED=1`.

---

## 7. Plan de migration progressive (Sessions E9-R2 → E9-R6)

La refonte adopte une approche pas à pas pour garantir une non-régression continue :

```
┌─────────┐      ┌─────────┐      ┌───────────┐      ┌─────────┐      ┌─────────┐
│  E9-R1  │ ──►  │  E9-R2  │ ──►  │  E9-R3    │ ──►  │  E9-R4  │ ──►  │  E9-R5  │ ──► E9-R6
│ Cadrage │      │Prototype│      │(a, b, c)  │      │ Bridge  │      │ QA / E2E│     Clôture
│ Validé  │      │ Sidecar │      │Migration  │      │ SQLite  │      │ Offline │     Rapport
└─────────┘      └─────────┘      └───────────┘      └─────────┘      └─────────┘
```

| Session | Intitulé | Complexité | Livrables clés |
|---|---|---|---|
| **E9-R1** | Cadrage refonte hybride | Faible (Doc) | Document `docs/e9-refonte-hybride.md`, décisions verrouillées |
| **E9-R2** | Prototype Sidecar & communication dynamique | Élevée | Setup Next.js standalone, spawn sidecar Rust, port dynamique, handshake `/api/health`, affichage Dashboard web dans Tauri |
| **E9-R3.a** | Migration Lot 1 (Dashboard, Recherche, Catalogue) | Moyenne | Branchement `dataClient`, parité recherche 6 modes et fiches pièces |
| **E9-R3.b** | Migration Lot 2 (Demandes, Reverse CAO, Plastiques) | Moyenne | Formulaires demandes, visualisation projets RE, base matériaux |
| **E9-R3.c** | Migration Lot 3 (Machines, Usinage, Sync, Audit, Paramètres) | Moyenne | Parc machines, console de sync locale, journal d'audit, **suppression définitive de `desktop/ui/`** |
| **E9-R4** | Bridge SQLite complet & commandes Rust étendues | Élevée | Extension des modèles SQLite locaux pour couvrir l'ensemble des entités métier en lecture seule |
| **E9-R5** | Tests E2E hybrides, validation offline & performance | Élevée | Suite Playwright sur serveur local + tests headless Tauri, validation coupure réseau |
| **E9-R6** | Documentation finale, nouveau packaging NSIS & clôture | Moyenne | Bilan métriques, packaging installeur complet, rapport `docs/e9-close-report.md` |

---

## 8. Impact sur l'existant

| Composant | Avant E9 | Après E9 |
|---|---|---|
| **`desktop/ui/`** | UI minimale dédiée (5 pages statiques) | **Supprimé**. Remplacé par l'hôte Next.js universel |
| **`src/app/`** | Web Vercel uniquement | **Hôte universel** (Web Vercel + Desktop Sidecar) |
| **`src/lib/data-client.ts`** | Inexistant | Point d'entrée unique d'accès aux données |
| **`desktop/src-tauri/`** | 8 commandes Rust basiques | Commandes étendues + gestionnaire de sidecar Node.js |
| **`tauri.conf.json`** | `frontendDist: "../ui/out"` | `devUrl` / URL dynamique du sidecar Node.js |
| **Taille installeur NSIS** | 3.90 Mo (WebView2 seul) | **50 à 90 Mo** (embarque le runtime Node standalone) |
| **Temps de démarrage app** | Quasi-instantané (< 1s) | **2 à 4 secondes** (lancement Node.js + healthcheck masqué par splash) |
| **Prisma (Web Cloud)** | 15 migrations | Inchangé (0 migration) |
| **Routes Web Vercel** | 64 routes | Inchangé (64 routes maintenues) |

---

## 9. Analyse des risques et mitigations

| # | Risque identifié | Sévérité | Plan de mitigation |
|---|---|---|---|
| **R1** | **Augmentation de la taille de l'installeur (50-90 Mo)** | Moyenne | Accepté pour un logiciel métier desktop Windows autonome ; compression NSIS LZMA ultra. |
| **R2** | **Temps d'initialisation du serveur Node.js** | Moyenne | Affichage d'un splash screen natif fluide pendant la phase de warm-up et handshake. |
| **R3** | **Conflit de ports TCP locaux** | Faible | Utilisation obligatoire du port dynamique `0` avec notification stdout. |
| **R4** | **Compatibilité Server Actions & Server Components sous Webview2** | Élevée | Validation prioritaire dès la session prototype **E9-R2**. |
| **R5** | **Divergence des données locales vs cloud** | Moyenne | Maintien du modèle unidirectionnel strict (web source unique de vérité) via `/api/desktop/sync/*`. |

---

## 10. Décisions verrouillées

Toutes les décisions relatives à la refonte hybride ont été actées et verrouillées :

| Réf. Décision | Intitulé | Choix retenu |
|---|---|---|
| `D-REFONTE-1` | Architecture du frontend | **A** — Serveur Next.js embarqué en standalone sidecar |
| `D-REFONTE-2` | Mode de communication données | **A** — IPC Tauri `window.__TAURI__.core.invoke` couplé à SQLite |
| `D-REFONTE-3` | Périmètre fonctionnel | **Oui** — Parité web complète sur tous les modules métier |
| `D-REFONTE-4` | Stratégie d'exécution | **Progressive** — Parité par lots de pages (R2 → R6) |
| `D-REFONTE-5` | Cadre projet | **A** — Phase E9 dédiée |
| `D-E9-R1-6` | Stratégie de port réseau | **A** — Allocation dynamique `port 0` + communication stdout |
| `D-E9-R1-7` | Abstraction de données | **A** — Module unifié `src/lib/data-client.ts` |
| `D-E9-R1-8` | Avenir de `desktop/ui/` | **A** — Suppression complète après bascule |
| `D-E9-R1-9` | Expérience de démarrage | **A** — Splash screen natif Tauri + healthcheck `/api/health` |
| `D-E9-R1-10` | Sécurité réseau | **A** — Bind strict sur `127.0.0.1` + CSP restrictive |

---

## 11. Critères de validation et de sortie de la phase E9

La phase E9 sera déclarée clôturée lorsque les conditions suivantes seront démontrées :
1. **Parité fonctionnelle vérifiée** : L'ensemble des 11 modules métier listés en §1.2 sont consultables et interactifs dans l'application desktop Windows.
2. **Fonctionnement hors-ligne autonome** : Coupure de la connexion internet simulée ; l'application continue de naviguer et de rechercher dans le catalogue local sans crash.
3. **Suppression propre du code obsolète** : Le répertoire `desktop/ui/` est totalement supprimé sans régression sur le build.
4. **Installeur NSIS validé** : Génération réussie de l'installeur incluant le sidecar et installation testée sous Windows 10/11.
5. **Qualité et tests au vert** :
   - `npm run lint` → 0/0
   - `npm run typecheck` → 0 erreur
   - `npm run format:check` → 100% conforme
   - `npm run build` → 64 routes compilées avec succès
   - Tests Rust et tests E2E Playwright verts.

---

**Fin du document de cadrage E9-R1 — Prêt pour lancement du prototype E9-R2.**
