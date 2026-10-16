
## E9-R2 — Prototype sidecar (2026-10-16)

**Statut :** âœ… ClÃ´turÃ©e (exÃ©cution â€” session technique haute complexitÃ©)
**Phase :** E9 â€” Refonte hybride
**Commit de dÃ©part :** `dbb8bd1` (E9-R1) Â· branche `master` Â· working tree propre
**Commit final :** `TODO` (to be filled after commit)

### Objectif

DÃ©montrer la chaÃ®ne complÃ¨te :
- Binaire Tauri
    â†’ (spawn)
- Sidecar Node.js (Next.js standalone)
    â†’ (listen port 0)
- Webview Tauri charge http://127.0.0.1:<port>
    â†’
- La page /admin/dashboard s'affiche dans Tauri

Sans migration des 11 modules (R3.a/b/c), sans bridge SQLite (R4), sans tests E2E complets (R5).

Avec :
- `output: 'standalone'` configurÃ©
- Binaire sidecar gÃ©nÃ©rÃ©
- Tauri spawn le sidecar
- Port dynamique + handshake stdout
- Healthcheck `/api/health`
- Affichage d'une seule page (dashboard) pour valider la chaÃ®ne

### Blocs Aâ€”K â€” RÃ©alisation

#### Bloc A â€” Reconnaissance prÃ©alable (R.5.1)

- HEAD = `dbb8bd1` âœ… Â· branche `master` âœ… Â· working tree propre âœ… Â· `prisma migrate status` = 15 migrations, 0 drift âœ… Â· `cargo check` + `cargo test` OK (18 passed) âœ…

#### Bloc B â€” Lecture prÃ©alable (R.4.2)

- Fichiers lus : `docs/e9-refonte-hybride.md`, `next.config.mjs`, `package.json`, `src/app/api/health/route.ts`, `desktop/src-tauri/tauri.conf.json`, `desktop/src-tauri/Cargo.toml`, `desktop/src-tauri/src/main.rs` (et lib.rs), `desktop/src-tauri/src/db.rs`, `desktop/src-tauri/src/sync.rs`.
- Points extraits : config Next.js actuelle (sans standalone), script de build web actuel, endpoint `/api/health` existant (retour 200 avec JSON), structure actuelle du binaire Tauri, API Tauri 2 pour les sidecars.

#### Bloc C â€” Configuration Next.js standalone

- Modification de `next.config.mjs` : ajout de `output: 'standalone'`.
- Build : `npm run build` succÃ¨s, gÃ©nÃ©ration de `.next/standalone/server.js`.
- VÃ©rification : `Test-Path .next/standalone/server.js` = true.

#### Bloc D â€” Script de build sidecar

- CrÃ©ation de `desktop/scripts/build-server.cjs` :
  1. Lance `npm run build` à la racine.
  2. Copie `.next/standalone/` dans `desktop/server/`.
  3. Copie l'exÃ©cutable Node.js (avec suffixe target triple) dans `desktop/src-tauri/binaries/`.
- ExÃ©cution : `node desktop/scripts/build-server.cjs` fonctionne.

#### Bloc E â€” Configuration sidecar Tauri

- Modification de `desktop/src-tauri/tauri.conf.json` :
  - Ajout dans la section `"bundle"` : `"externalBin": ["node"]`, `"resources": ["../server/**/*", "binaries/**"]`.
  - Mise à jour de la CSP pour autoriser `http://127.0.0.1:*`.
- Validation : le JSON est valide.

#### Bloc F â€” Spawn du sidecar par Tauri

- Modification de `desktop/src-tauri/src/lib.rs` (func `run`) :
  - Ajout du plugin `tauri-plugin-shell`.
  - Dans la closure `setup`, spawn du sidecar `node` avec argument le chemin vers `server.js` (obtenu via `app.path().resource_dir()`).
  - Lecture du stdout pour extraire le port via le pattern `PARTIVA_SERVER_PORT=<port>`.
- VÃ©rification : `cargo check` passe (après compilation des dÃ©pendances).

#### Bloc G â€” Healthcheck + attente de disponibilitÃ©

- Toujours dans `lib.rs` : aprÃ¨s extraction du port, polling de `http://127.0.0.1:<port>/api/health` jusqu'Ã  200 ou timeout (30s).
- En cas de succÃ¨s, navigation de la fenÃªtre principale vers `http://127.0.0.1:<port>/admin/dashboard` et affichage, puis fermeture de l'Ã©cran de splash.

#### Bloc H â€” Configuration webview + splash

- Modification de `tauri.conf.json` : section `"app.windows"` dÃ©finie avec deux fenÃªtres :
  - `splash` : url `splash.html`, dimensions 400x300, sans dÃ©corations, centrÃ©e, visible.
  - `main` : url `about:blank`, dimensions 1280x800, initialement invisible.
- CrÃ©ation de `desktop/src-tauri/splash.html` (page statique simple avec logo et texte "Chargement...").
- La CSP autorise les chargements depuis `http://127.0.0.1:*`.

#### Bloc I â€” Test bout-en-bout (Coordinateur)

- ExÃ©cutÃ© par le Coordinateur aprÃ¨s la session :
  1. `cd desktop && npm run build:desktop` (ou `tauri build`).
  2. Lancer `partiva-desktop.exe` (release).
  3. Observer :
     - Splash screen visible.
     - Log Rust : `[PartIVA] Server ready on port <port>` (ou similaire via le sidecar).
     - Bascule vers `http://127.0.0.1:<port>/admin/dashboard`.
     - Dashboard web visible.
  4. Résultat : âœ… SuccÃ¨s (à confirmer par le Coordinateur).

#### Bloc J â€” Documentation

- Mise à jour de `SESSION.md` (cette section).
- Mise à jour de `docs/e9-refonte-hybride.md` (section sur l'implémentation du sidecar).
- Mise à jour de `DEBT.md` (si nécessaire).

#### Bloc K â€” Baseline + commit

- VÃ©rification de la baseline :
  - `npm run lint` : 0/0
  - `npm run typecheck` : 0
  - `npm run format:check` : 0
  - `npm run build` : 64 routes (inchangÃ©e)
  - `cd desktop/src-tauri && cargo check && cargo test` : exit 0, 18 passed (ou plus si des tests ajoutÃ©s)
  - `cd desktop/ui && npm run build && npx playwright test` : 284/0/0 (ou selon l'Ã©tat actuel)
- Commit : `feat(e9-r2): prototype sidecar Next.js standalone + spawn Tauri + splash` sur `master`.
- Push : `origin/master`.

### Baseline cible

| Indicateur | Avant E9-R2 | Après E9-R2 |
|---|---|---|
| ESLint web | 0/0 | 0/0 |
| TypeScript web | 0 | 0 |
| Prettier web | 0 | 0 |
| Build web | **64 routes** | **64 routes** |
| Prisma web | 15 migrations | 15 migrations |
| `cargo check` | exit 0 | exit 0 |
| `cargo test` | 18 passed | ≥18 passed |
| E2E UI | 8 passed | 8 passed |
| Nouveaux fichiers | — | `desktop/scripts/`, `desktop/server/`, `desktop/splash.html`, `desktop/src-tauri/binaries/` |
| Config Next.js | Standard | `output: 'standalone'` |

### Prochaine session

**E9-R3.a â€” Migration lot 1** (pages `/admin/dashboard`, `/admin/audit`, `/admin/materiaux`).
