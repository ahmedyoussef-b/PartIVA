# Architecture PartIVA Desktop — Transition Statique vers Sidecar

> ⚠️ **CONTRAT TECHNIQUE V8-TAURI-1-a** : Ce document acte la migration de l'architecture statique actuelle vers une architecture sidecar Node pour supporter le PCB Studio Web (SSR + API).

> **Statut :** proposition non actée — relance de `D-E9-R6-2` (sidecar non supporté, close en E9-R7 par abandon). Ce document ne rouvre pas la décision ; il consigne un audit @216ed3e et 5 bloquants B1→B5 pour arbitrage coordinateur.

## 1. Vue d'ensemble de la Dualité

Le projet `desktop/` contient actuellement deux approches concurrentes :

1. **Approche Statique (Actuelle)** : une app Next.js dédiée (`desktop/ui/`) exportée en HTML/CSS/JS statiques. Utilise `@tauri-apps/api` pour l'IPC.
2. **Approche Sidecar (Cible V8-TAURI-1-a)** : le serveur Next.js racine (`.next/standalone`) lancé en processus Node séparé par Tauri. Permet le SSR et les API routes.

```
┌─────────────────────────────────────────────────────┐
│              PartIVA Desktop (Tauri v2)             │
│                                                     │
│  [ACTUEL] Statique          [CIBLE] Sidecar Node    │
│  ┌──────────────┐           ┌──────────────┐        │
│  │   Webview    │           │   Webview    │        │
│  │  (HTML/CSS)  │           │  (Next.js    │        │
│  └──────┬───────┘           │   UI React)  │        │
│         │ IPC               └──────┬───────┘        │
│  ┌──────▼───────┐           ┌──────▼───────┐        │
│  │ @tauri-apps  │           │  HTTP Local  │        │
│  │    /api      │           │  (server.js) │        │
│  └──────────────┘           └──────┬───────┘        │
│                                    │                │
│                             ┌──────▼───────┐        │
│                             │  Binaries/   │        │
│                             │  node-<trip> │        │
│                             └──────────────┘        │
└─────────────────────────────────────────────────────┘
```

## 2. État Actuel Vérifié (Code Réel @ `216ed3e`)

### A. L'App Statique (`desktop/ui/`)

- **Source** : `desktop/ui/next.config.mjs` → `output: 'export'`, `distDir: 'out'`.
- **Dev** : `package.json` → `"dev": "next dev -p 3100"`.
- **IPC** : `package.json` → `"@tauri-apps/api": "^2.0.0"` présent.
- **Build** : `desktop/ui/out/` contient un export statique fonctionnel (`index.html`, `catalogue/`, `login/`, `part/`, `recherche/`).
- **Limitation** : pas de SSR, pas d'API routes Next.js (ex. `/api/pcb/export` inaccessible).

### B. La Configuration Tauri (`src-tauri/`)

- **`tauri.conf.json`** :
  - `devUrl: "http://localhost:3100"` → pointe correctement vers l'app statique en dev.
  - `frontendDist: "../"` → valeur issue de **V8-D-7-l** (`60af0f1`, « pointe vers le build Next.js racine ») : elle pointe vers `desktop/`, où **aucun `index.html` n'existe** → **non fonctionnelle en l'état** (la sortie statique réelle est `desktop/ui/out/`) ; dans l'approche sidecar, `frontendDist` deviendra un **placeholder** (l'URL utile est portée dynamiquement par la fenêtre).
  - `bundle.externalBin` → **absent** : sidecar non déclaré.
  - `build.beforeBuildCommand` → `""` : pas de build sidecar automatisé.
- **Capabilities** : `core:default` uniquement. Pas de `shell:allow-spawn`.
- **Rust (`lib.rs`)** : pas de plugin shell, pas de spawn de processus. Setup basique (splash/main).

### C. Les Scripts Sidecar (`scripts/`)

- **`build-server.cjs`** : existe mais lance `npm run build` sans `DESKTOP_BUILD=true`.
- **Résultat** : `.next/standalone` n'est pas généré. Le script est **complet** (5 étapes : build → copie `.next/standalone` → `.next/static` → `public/` → tailorage `.env` → patch `server.js` (port dynamique `PARTIVA_SERVER_PORT=`) → copie `node.exe` dans `binaries/`). Le défaut réel est que `next.config.mjs` (racine, l.12) n'a **pas de branche `standalone`** (`output: isExport ? 'export' : undefined`) : `.next/standalone` n'est donc **jamais généré**, quel que soit le script.

## 3. Cible V8-TAURI-1-a (Migration Sidecar)

> ⚠️ Cette section décrit les modifications requises pour activer le mode sidecar. **Aucun élément ci-dessous n'est actuellement actif.**

### Modifications Requises

1. **`next.config.mjs` (Racine)** : ajouter le guard `DESKTOP_BUILD === 'true' ? 'standalone' : ...`.
2. **`tauri.conf.json`** :
   - `bundle.externalBin: ["binaries/node"]`.
   - `build.beforeBuildCommand: "node scripts/build-server.cjs"`.
   - `build.frontendDist` : placeholder statique minimal (ex. `../ui`), **pas** `../server` (qui est un serveur Node, pas des assets).
   - `app.windows[1].url` : dynamique (résolu au runtime après spawn du sidecar).
3. **`capabilities/default.json`** : ajouter `shell:allow-execute` + `shell:allow-spawn` (scope : `binaries/node`).
4. **`lib.rs`** :
   - init `tauri_plugin_shell`.
   - `setup()` : spawner `node server.js`, lire le port sur stdout, naviguer la fenêtre main vers `http://127.0.0.1:<port>`.
5. **`build-server.cjs`** : injecter `DESKTOP_BUILD=true`, copier le binaire Node dans `binaries/`.

### Abandon Progressif du Statique

- Une fois le sidecar opérationnel, `desktop/ui/` pourra être archivé ou conservé pour des écrans hors-ligne très légers.
- L'IPC `@tauri-apps/api` pourra être remplacé par des appels `fetch` HTTP vers le sidecar local pour les écrans SSR.

## 4. Points Bloquants Restants (V8-TAURI-1-a)

| ID | Problème | Impact | Priorité |
|----|----------|--------|----------|
| B1 | `frontendDist: "../"` (V8-D-7-l, `60af0f1` — « pointe vers le build Next.js racine ») pointe vers `desktop/` où aucun `index.html` n'existe ; la sortie statique réelle est `desktop/ui/out/`. L'intention est documentée, le résultat est non fonctionnel en l'état. | Build production statique non fonctionnel | 🟡 Moyen (si on reste en statique) |
| B2 | Capability `shell:allow-spawn` manquante | Spawn sidecar bloqué | 🔴 Critique (pour sidecar) |
| B3 | `setup()` ne lance pas le sidecar | Aucun serveur en écoute | 🔴 Critique (pour sidecar) |
| B4 | Guard `DESKTOP_BUILD` absent | Standalone non généré | 🔴 Critique (pour sidecar) |
| B5 | Port sidecar non résolu dynamiquement | Navigation impossible | 🟡 Moyen |

## 5. Objectifs & Séquence de Démarrage Cible

### Séquence de Démarrage Sidecar (Post-V8-TAURI-1-a)

1. Tauri démarre → exécute `beforeBuildCommand` (build) ou `beforeDevCommand` (dev).
2. `build-server.cjs` génère `.next/standalone` et copie le binaire Node.
3. Tauri charge la config → détecte `externalBin`.
4. `lib.rs::setup()` spawne le binaire Node → `node server.js`.
5. Le serveur Next.js écoute sur un port libre (ex. 3456).
6. Le stdout du sidecar renvoie le port à Rust (`PARTIVA_SERVER_PORT=`).
7. Rust navigue la fenêtre `main` vers `http://127.0.0.1:3456/admin/pcb`.
8. L'UI React charge avec SSR complet et accès aux API routes.

### Objectifs & Décisions

- ✅ Tauri v2.12.3 + Rust 1.94 → compatibles.
- ✅ Infrastructure `desktop/` présente (statique + scripts sidecar).
- ❌ Chaîne de build sidecar non opérationnelle.
- ❌ Permissions shell non configurées.

### Risques & Points d'Attention

- **R1** — `output: 'standalone'` doit inclure les dépendances natives (`libcascade`) : prévoir `outputFileTracingIncludes`, sinon `MODULE_NOT_FOUND` au runtime du sidecar.
- **R2** — Le port dynamique doit être négocié (hook `server.js` D-E9-R1-6/10) et lu par Rust ; un port en dur crée des conflits.
- **R3** — `desktop/server/` (build standalone) n'est pas bundlé en `bundle.resources` : à ajouter pour que `node server.js` trouve ses fichiers.
- **R4** — En dev, le spawn du sidecar doit être conditionné (`#[cfg(not(debug_assertions))]`) pour ne pas confliter avec `next dev` sur le port 3000/3100.
- **R5** — L'auth desktop (token BetterAuth + keyring) et la sync SQLite doivent rester cohérentes après le passage au sidecar.

## 6. Migration des Données (Offline)

- **Actuel** : `desktop/ui` (statique) + commandes Rust `invoke` → SQLite local (`%APPDATA%/PartIVA/partiva.db`), peuplant `desktop/src-tauri/migrations/0001..0006`.
- **Cible sidecar** : le serveur Next.js racine utilise Prisma/PostgreSQL ; les données offline devront être exposées via le sidecar ou via une couche SQLite partagée.
- **Dette** : aucune table PCB (`pcb_projects`, `pcb_components`, `pcb_nets`) n'existe dans les migrations SQLite → le PCB Studio offline n'est pas disponible (reporté V8-TAURI-1-c).
- **Sync** : `desktop/src-tauri/src/sync.rs` est codé en dur par table et le manifest `/api/desktop/sync` ne référence aucune entité PCB.

## 7. Références

- Config Tauri : `desktop/src-tauri/tauri.conf.json`
- Capabilités : `desktop/src-tauri/capabilities/default.json`
- Rust : `desktop/src-tauri/src/lib.rs`, `sync.rs`, `db.rs`
- Build sidecar : `desktop/scripts/build-server.cjs`
- UI statique : `desktop/ui/next.config.mjs`, `desktop/ui/package.json`
- Config Next.js racine : `next.config.mjs`
- Décision amont : `docs/e8-desktop-tauri-scope.md`
- `docs/e9-refonte-hybride.md` — cadrage officiel « ✅ Cadrage validé » de l'architecture cible (sidecar + webview). Le présent document en est un audit complémentaire @216ed3e, non un remplacement.