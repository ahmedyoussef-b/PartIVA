# Spec V8-D-14 — Pont PCB ↔ Desktop Tauri (sidecar)

**Version :** 1.0 — **Date :** 2026-11-17 — **Statut :** proposition (validation coordinateur requise avant T3.2)
**HEAD :** `e1f63db` — **Réf. :** T2 (arbitrage sidecar) · T3.0 (état des lieux) · P2.1 §4 (bloquants B1→B5) · P8.0 (inventaire Tauri)

## 1. État actuel

- `frontendDist: "../"` **cassé** (V8-D-7-l, `60af0f1`) : aucun `index.html` dans `desktop/`.
- Aucun sidecar : `bundle.externalBin` **absent**, `capabilities/default.json` = `["core:default"]` seul.
- `next.config.mjs` l.12 : `output: isExport ? 'export' : undefined` → aucune branche `standalone` ; `.next/standalone` = `False`.
- Port sidecar non résolu (**B5**).
- **0** commande Rust PCB (15 commandes, `lib.rs` l.53-69) ; **69** routes API web-only.
- `kicad-cli` 10.0.8 **hors PATH** ; `binaries/` **vide** et **gitignoré** (`.gitignore` l.81).
- `build-server.cjs` **non appelé** par aucun script npm ; `bundle.resources` = `["../../public/*.wasm"]` seul.
- `build-server.cjs` l.63-74 copie `.env` ; `prisma/schema.prisma` l.7 = `provider "postgresql"`.
- `lib.rs` l.39-49 : `sleep(800ms)` **en dur** avant affichage de `main`.

## 2. Décision

- **T2 : sidecar Node** — seule option préservant les **69 routes API** (donc KiCad côté desktop).
- Hiérarchie : **CLI obligatoire** (exports, ERC/DRC) ; **IPC optionnel** (GUI live, hypothèse).
- **B2 requalifié** : le spawn Rust passe **obligatoirement** par `tauri-plugin-shell` (`ShellExt::sidecar`) — **l'API core n'existe pas en Tauri 2.12.3** (mesuré C1, 2026-11-17 : `tauri-2.12.3/src/process.rs` n'expose que `current_binary` et `restart`). Aucune capability `shell:allow-spawn` n'est requise côté Rust (les capabilities ne gatent que l'API JavaScript).

## 3. Architecture

- Adaptateurs **Node/TS dans le sidecar** ; **pas de pont Rust**. 2 routes : `api/pcb/eda` (CLI), `api/pcb/ipc` (IPC).
- **B3** — `setup()` spawne le sidecar via l'API **plugin shell** :

```rust
let server_dir = app.path().resource_dir()?.join("server");
let (mut rx, child) = app
    .shell()
    .sidecar("node")?
    .args([server_dir.join("server.js").to_string_lossy().to_string()])
    .current_dir(&server_dir)
    .kill_on_drop(true)
    .spawn()?;
```

  (`tauri-plugin-shell = "2"` + `.plugin(tauri_plugin_shell::init())` **requis** ; `CommandEvent` est `#[non_exhaustive]` → bras `_ => {}` obligatoire.) + healthcheck `GET /api/health` (150 ms / 30 s).
- **Séquence d'affichage** : remplacer le `sleep(800ms)` de `lib.rs` par : **ping TCP** de `127.0.0.1:<port>` toutes les 150 ms pendant **30 s max** → si joignable : fermer le splash **et** afficher `main` (log `[SIDECAR] readiness OK après <ms>`) ; si timeout : fermer le splash, afficher `main` avec un **écran d'erreur** injecté par `eval()` (log `[SIDECAR] readiness timeout après 30 s`).
- **B4** — `next.config.mjs` doit produire `output:'standalone'` via guard `DESKTOP_BUILD`. Activateur = `build-server.cjs` : il pose `process.env.DESKTOP_BUILD = 'true'` **avant** `execSync('npm run build')` (l.23), indépendamment du shell (évite le piège `cmd.exe`). Build web Vercel : `output: undefined` (inchangé).
- **B5** — port **fixe** (3210, repli 3211→3220 si occupé) injecté via `.env("PORT")` / `.env("HOSTNAME")` côté Rust ; le `server.js` standalone de Next.js lit `process.env.PORT` nativement. **Mesuré C1 (2026-11-17)** : le hook CJS de `build-server.cjs` (`PARTIVA_SERVER_PORT`) est **incompatible avec Next.js 16 (ESM)** — `Cannot access 'require' before initialization` — et **neutralisé**.
- **Contrat binaire** — `bundle.externalBin = ["binaries/node"]` (sans extension), nom court `node`, artefact `node-x86_64-pc-windows-msvc.exe` produit par `build-server.cjs` l.117-118.
- **Bundle des ressources** — forme **map** : `"resources": { "server": "../../desktop/server" }` → chemin runtime stable `<resource_dir>/server`, **en plus** de `"../../public/*.wasm"`. À appliquer en T3.2.
- **Production du binaire** — `binaries/` étant vide et gitignoré, `beforeBuildCommand = "node ./scripts/build-server.cjs"` (**relatif à `desktop/` — C1 ; mesuré F3, 2026-11-17** : Tauri exécute le hook depuis le dossier parent de `src-tauri/`) — **option (a) retenue**. La modification de `build:desktop` (retirer `cd ../ && npm run build`) est **à appliquer en T3.2**.
- `build-server.cjs` lance **déjà** `npm run build` (l.23, ~192 s), écrit `PARTIVA_SERVER_PORT` (l.99), copie `node-<triple>.exe` (l.117) → **réutiliser, ne pas réécrire**.
- **Sécurité** — **exclure `.env` du bundle** : `build-server.cjs` l.63-74 copie `DATABASE_URL` / `BETTER_AUTH_SECRET` intacts → à modifier en T3.2.
- **Cible DB du sidecar — DÉCISION (h)** : sidecar **connecté** (Next.js + **Postgres/Neon**) pour les routes PCB/IA ; **catalogue offline conservé en Rust/SQLite** (`desktop/src-tauri/src/db.rs`, 5 migrations). **Aucun portage de schéma Prisma.**
  - **Fallback DB (T3.3, 2026-11-18)** : à défaut de `PARTIVA_DATABASE_URL` / `db.toml`, le sidecar reçoit l'URL **absolue** de la BDD SQLite existante `%APPDATA%\PartIVA\partiva.db` (schéma Rust/SQLite) — `sqlite:///C:/Users/<user>/AppData/Roaming/PartIVA/partiva.db?mode=rwc` (`config.rs::fallback_db_config`, `needs_setup=false`, dossier parent créé si absent). Le catalogue local est ainsi opérationnel sans configuration.
  - Justification : T3.1-ter — 42/69 routes = **61 %** du périmètre utile, mais **100 % du schéma** à porter (10 `enum` → `String`, `tsvector` → FTS5, `vector` pgvector **absent** de SQLite, `@db.Decimal`).
  - Options écartées : (a) `DATABASE_URL` par install (secret par poste + offline impossible) · (b) ciblé/complet (10-15 / 18-25 j/h, casse `tsvector`/`vector`) · (c) SQLite Tauri + PCB web-only (contredit T2).
  - **Conséquence** : PCB/IA **indisponibles hors ligne** ; le catalogue (lecture, recherche, prix) reste **offline** via SQLite.
  - Effort : **Faible/Moyen**.
- `desktop/ui` (5 pages, `output:'export'`) devient **inutilisé** sous sidecar — dépréciation à trancher en T3.3. **Le dossier `desktop/ui` est formellement déprécié et ne doit plus être maintenu (remplacé par le sidecar Next.js).**

## 4. Détection & repli

- `KICAD_CLI_CANDIDATES` l.9-14 (`kicad-cli` PATH, `KiCad\10.0\bin`, `KiCad\9.0\bin`, `D:\KiCad9\bin`) = **candidats configurés** (pas « versions supportées »).
- `detectKicadIpc()` → `available: false` si aucun socket ; **repli CLI au niveau route** (inter-routes), **pas** intra-adaptateur.
- **Traçabilité (P2.2-b3)** : les logs Node (`[KICAD:ipc]`, `[KICAD:cli]`, `[PCB:*]`) émis par les routes API sont **relayés** par le sidecar (`CommandEvent::Stdout`) et réémis avec la cible `sidecar:node` ; ils apparaissent donc dans le fichier JSON (D8).

## 5. Dépendances

- `kicad-cli` 10.0.8 hors PATH (`C:\Program Files\KiCad\10.0\bin\kicad-cli.exe`).
- KiCad par poste = 3 options : (a) requis, (b) fallback CLI only, (c) détection + message.
- IPC GUI requise = **hypothèse documentée**, test réel en T3.2.

## 6. Done + points ouverts

| # | Critère mesurable |
|---|---|
| D1 | `cd desktop && npm run tauri:build` → `bundle/nsis/*.exe` produit |
| D2 | sidecar démarre, écrit `PARTIVA_SERVER_PORT=<port>` sur stdout |
| D3 | webview charge `http://127.0.0.1:<port>` (subordonné à T3.1-bis) |
| D4 | `GET /api/health` → 200 (`src/app/api/health/route.ts`) |
| D5 | ERC/DRC via `kicad-cli 10.0.8` → 0 erreur (projet de test fourni par T3.2) |
| D6 | IPC = optionnel (hypothèse, test T3.2) |
| D7 | installeur NSIS contient `<resource_dir>/server/**` **et n'inclut PAS** `.env` (aucun `DATABASE_URL` / `BETTER_AUTH_SECRET`) ; la config DB est **fournie post-install** (hors bundle) |
| D8 | logs **structurés JSON** écrits dans `<app_log_dir>/partiva-desktop.log` (rotation `KeepSome(5)`, 10 Mo ; `PARTIVA_LOG_MAX_BYTES` pour forcer une rotation en test) ; **filtre par target** (`sidecar*`, `app_lib*`, `kicad*`) ; un run de 10 s contient au moins : `server_dir`, `démarré`, `readiness`, et les logs `sidecar:node` relayés |
| D9 | L'installeur génère à la fois le .exe (NSIS) et le .msi (WiX) sans erreur. |

**Points ouverts :** test IPC réel (T3.2) · packaging MSI + dépréciation `desktop/ui` (T3.3) · `D-V8-D-14-DB-CONFIG-POST-INSTALL` (config DB post-install à documenter).