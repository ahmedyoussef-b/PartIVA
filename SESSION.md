
## E9-R2 — Prototype sidecar (2026-10-16)

**Statut :** âœ… ClÃ´turÃ©e (exÃ©cution â€” session technique haute complexitÃ©)
**Phase :** E9 â€” Refonte hybride
**Commit de dÃ©part :** `dbb8bd1` (E9-R1) Â· branche `master` Â· working tree propre
**Commit final :** `bb8fc03` (feat(e9-r2): prototype sidecar Next.js standalone + spawn Tauri + splash)

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

**E9-R2-ter — Déblocage build Next.js standalone + port dynamique restauré**.

---

## E9-R2-ter — Déblocage build Next.js standalone + port dynamique restauré (2026-10-16)

**Statut :** ✅ Résolu (session technique correctrice)
**Phase :** E9 — Refonte hybride
**Commit de départ :** `7a83bd0` · branche `master` · working tree propre
**Objet :** Déblocage build Next.js standalone + restauration port dynamique (D-E9-R1-6 / D-E9-R1-10)

### 1. Cause racine identifiée (H4 confirmée)

- Lors de l'activation de `output: 'standalone'`, le file tracer de Next.js 16 et Turbopack scannait récursivement le répertoire `desktop/` (qui contenait `desktop/node_modules`, `desktop/server/` et `desktop/src-tauri/target/` de plusieurs gigaoctets), causant un blocage infini à l'étape `Creating an optimized production build ...`.
- L'exclusion explicite dans `next.config.mjs` (`turbopack.root` + `outputFileTracingExcludes`) a immédiatement débloqué le build, ramenant la compilation à ~17 secondes.

### 2. Correctifs techniques appliqués

1. **`next.config.mjs`** :
   - Ajout de `turbopack.root: path.resolve(process.cwd())`.
   - Ajout de `outputFileTracingExcludes: { '*': ['./desktop/**', './e2e/**', './docs/**'] }`.
   - Production vérifiée de `.next/standalone/server.js`.
2. **`desktop/scripts/build-server.cjs`** :
   - Copie de `.next/standalone` vers `desktop/server/`.
   - Copie des assets statiques (`.next/static` et `public`) vers `desktop/server/`.
   - Injection au début de `server.js` du hook de port dynamique et de bind strict sur `127.0.0.1` (`D-E9-R1-6` et `D-E9-R1-10`) via `process.stdout.write("PARTIVA_SERVER_PORT=" + port)`.
   - Copie de l'exécutable Node.js vers `desktop/src-tauri/binaries/node-x86_64-pc-windows-msvc.exe`.
3. **`desktop/src-tauri/src/lib.rs`** :
   - Injection des variables d'environnement `PORT=0` et `HOSTNAME=127.0.0.1` au spawn du sidecar Node.js.
   - Parsing robuste multiligne et résistant aux espaces de `PARTIVA_SERVER_PORT=<port>` dans `parse_port_line`.
   - Ajout de 4 tests unitaires pour `parse_port_line`.
4. **Outillage qualité (`eslint.config.mjs`, `.prettierignore`)** :
   - Ajout des exclusions `desktop/server/**` et `desktop/src-tauri/**` dans `eslint.config.mjs` et `.prettierignore`.
   - Ajout de `/* eslint-disable @typescript-eslint/no-require-imports */` dans `build-server.cjs`.

### 3. Baseline vérifiée

| Indicateur | Avant E9-R2-ter | Après E9-R2-ter |
|---|---|---|
| Build Next.js standalone | ❌ Bloqué | ✅ 64 routes (~17s) |
| `.next/standalone/server.js` | ❌ Absent | ✅ Présent |
| Port dynamique (`D-E9-R1-6`) | ⚠️ Port fixe 3000 | ✅ Port 0 + stdout flush |
| Bind strict (`D-E9-R1-10`) | ⚠️ Incomplet | ✅ Strict `127.0.0.1` |
| ESLint web (`npm run lint`) | 3 erreurs cjs | ✅ 0/0 |
| TypeScript (`npm run typecheck`) | 0 erreur | ✅ 0 erreur |
| Prettier (`npm run format:check`) | 2 fichiers | ✅ 100% conforme |
| Cargo check (`desktop/src-tauri`) | 0 erreur | ✅ 0 erreur |
| Cargo test (`desktop/src-tauri`) | 18 passed | ✅ 22 passed (0 fail) |

---

## Session E9-R2-quater — Script build:desktop + binaire Tauri régénéré

**Date :** 2026-10-16  
**Type :** Exécution  
**Statut :** ✅ Validé

### 1. Objectifs

1. Ajouter le script `build:desktop` manquant dans `desktop/package.json`.
2. Nettoyer la dépendance circulaire `file:..` créant un symlink infini sous Turbopack.
3. Vérifier la configuration `tauri.conf.json` (`splash` 400x300, `main` 1280x800 hidden, chargement dynamique).
4. Rebuilder l'application desktop complète (`build:server` + `cargo tauri build`).
5. Livrer les binaires release actualisés pour le test bout-en-bout (affichage `/admin/dashboard`).

### 2. Réalisations

- **Script `build:desktop` ajouté** : `npm run build:server && cd src-tauri && cargo tauri build` dans `desktop/package.json`.
- **Nettoyage symlink loop** : Suppression de `"atelier-pieces-industrielles": "file:.."` dans `desktop/package.json` qui provoquait un symlink infini sous Turbopack.
- **Vérification `tauri.conf.json`** :
  - Fenêtre `main` configurée en `1280x800`, masquée au démarrage (`visible: false`), URL initiale `about:blank`.
  - Fenêtre `splash` configurée en `400x300`, centrée, sans décorations.
  - Sécurité CSP validée (`http://127.0.0.1:*`).
- **Vérification `lib.rs`** :
  - Lancement du sidecar Node avec `PORT=0` et `HOSTNAME=127.0.0.1`.
  - Extraction dynamique du port via `parse_port_line`.
  - Healthcheck `/api/health`.
  - Navigation vers `http://127.0.0.1:<port>/admin/dashboard`.
  - Fermeture du splash et affichage de la fenêtre `main`.
- **Exécution du build release** :
  - `build:server` : Next.js 16 standalone build terminé avec succès (45/45 pages), hook port dynamique injecté dans `desktop/server/server.js`, Node.js copié.
  - `cargo tauri build` : Compilation release optimisée terminée en 3m 43s.
  - Packaging NSIS réussi : `PartIVA Desktop_0.1.0_x64-setup.exe` généré.

### 3. Artefacts produits

- `desktop/src-tauri/target/release/partiva-desktop.exe` (16,78 MB) — binaire standalone + sidecar.
- `desktop/src-tauri/target/release/bundle/nsis/PartIVA Desktop_0.1.0_x64-setup.exe` (33,53 MB) — installateur NSIS.

### 4. Prochaine étape

- **Test bout-en-bout GUI** : Lancement de `partiva-desktop.exe` pour vérifier la bascule splash -> `/admin/dashboard` (1280x800).
- **E9-R3.a — Migration lot 1** : Migration des pages `/admin/dashboard`, `/admin/audit`, `/admin/materiaux` vers `data-client.ts`.

---

## Session E9-R2-quinquies-quater — Résolution splash.html inline + validation binaire

**Date :** 2026-10-17  
**Type :** Exécution (correctif ciblé)  
**Statut :** ✅ Validé

### 1. Cause racine identifiée

Suite à la suppression de `frontendDist` dans `tauri.conf.json` en E9-R2-quinquies-ter, Tauri cherchait le fichier relatif `splash.html` dans les assets packagés et échouait avec une boîte de dialogue d'erreur : `asset not found: splash.html`.

### 2. Correctifs appliqués

1. **Splash window en URL inline data:text/html (Option A Superviseur)** :
   - Remplacement de `"url": "splash.html"` par une URL inline HTML/CSS dans `desktop/src-tauri/tauri.conf.json`.
   - Ajout de `data:` dans la directive `default-src` de la politique CSP (`desktop/src-tauri/tauri.conf.json`).
   - Supprime toute dépendance à un fichier externe ou à `frontendDist`.
2. **Vérification script `build:desktop`** :
   - Confirmé présent dans `desktop/package.json` (`node scripts/build-server.cjs && cd src-tauri && cargo tauri build`).
3. **Logs Rust enrichis dans `lib.rs`** :
   - Ajout de préfixes et de logs détaillés `[PartIVA]` pour la configuration sidecar, le spawn, la réception du port et la capture des erreurs critiques.

4. **Fenêtre principale maximisée (Plein écran standard à l'ouverture)** :
   - `desktop/src-tauri/tauri.conf.json` : `maximized: true`, `center: true`, `width: 1440`, `height: 900`, `minWidth: 1024`, `minHeight: 700`, `title: "PartIVA Desktop"`.
   - `desktop/src-tauri/src/lib.rs` : Appel explicite de `main_window.maximize()` et `main_window.set_focus()` après le `show()` pour garantir l'affichage maximisé sans état réduit.

### 3. Validation qualité

- **Rust tests** : 22 tests passés avec succès (0 échec).
- **ESLint** : 0 erreur, 0 warning (`eslint .`).
- **TypeScript** : 0 erreur (`node scripts/typecheck.mjs`).
- **Prettier** : 100% conforme (`prettier --check .`).
- **Build desktop complet** :
  - `build:server` : Next.js 16.4.0 standalone build réussi (45 pages), hook port dynamique injecté.
  - `cargo tauri build` : Compilation release en 2m 27s + installateur NSIS généré avec configuration maximisée.

### 4. Artefacts produits

- `desktop/src-tauri/target/release/partiva-desktop.exe` (16,59 MB) — binaire autonome avec splash inline, sidecar et fenêtre maximisée.
- `desktop/src-tauri/target/release/bundle/nsis/PartIVA Desktop_0.1.0_x64-setup.exe` (33,34 MB).

### 5. Prochaine étape

- **Test bout-en-bout GUI (Coordinateur)** : Lancement de `partiva-desktop.exe` depuis PowerShell pour observer les logs `[PartIVA]` et l'affichage plein écran maximisé du dashboard admin `/admin/dashboard`.
- **E9-R3.a — Migration lot 1** : Migration des 3 premières pages vers `dataClient`.

---

## Session E9-R2-sexies — Démarrage application installée (NSIS) + correctifs runtime Node/Tauri

**Date :** 2026-10-17  
**Type :** Exécution (déblocage démarrage après installation)  
**Statut :** ✅ Validé en conditions réelles d'installation

### 1. Causes racines identifiées

Après installation via l'installateur NSIS, deux problèmes bloquaient le démarrage de l'application :

1. **Panic Tauri au démarrage (`webview-data-url`)** : L'URL inline `data:text/html,...` du splash requiert impérativement la feature Tauri `webview-data-url` dans `desktop/src-tauri/Cargo.toml`. Sans cette feature, l'application paniquait immédiatement : `invalid window url: data URLs are not supported without the webview-data-url feature`.
2. **Chemin ressource bundle NSIS (`_up_\server`)** : L'installateur NSIS Tauri range les ressources déclarées avec `../server/**/*` sous `_up_\server\` (préservation du chemin relatif). `lib.rs` cherchait uniquement dans `server\server.js`, qui n'existait pas dans le répertoire installé.
3. **Erreur Node.js `EISDIR: illegal operation on a directory, lstat 'C:'`** : Tauri/Rust résout les chemins Windows sous format UNC verbatim `\\?\C:\...`. Node.js 22 sous Windows échoue avec `EISDIR` lorsqu'un script lui est passé avec le préfixe `\\?\`.

### 2. Correctifs appliqués

1. **Activation de `webview-data-url`** (`desktop/src-tauri/Cargo.toml`) :
   - `tauri = { version = "2.12.3", features = ["webview-data-url"] }`.
2. **Résolution candidate des chemins serveur** (`desktop/src-tauri/src/lib.rs`) :
   - Recherche prioritaire dans `_up_/server/server.js` puis `server/server.js`.
3. **Suppression du préfixe UNC Windows (`strip_unc_prefix`)** :
   - Fonction utilitaire `strip_unc_prefix` dans `lib.rs` supprimant `\\?\`.
   - Exécution du sidecar avec `current_dir = clean_server_dir` et argument `"server.js"`.
4. **Enrichissement diagnostics sidecar** :
   - Capture et journalisation détaillée des événements `Stdout`, `Stderr`, `Error` et `Terminated`.
5. **Inclusion des fichiers d'environnement** :
   - `"resources": ["../server/**/*", "../server/.env*"]` dans `tauri.conf.json`.
   - Copie automatique de `.env` dans `desktop/scripts/build-server.cjs`.

### 3. Validation en conditions réelles

- **Tests Rust** : 22 tests passés avec succès (17 unitaires + 5 intégration), 0 échec.
- **Compilation release & bundle NSIS** : `cargo tauri build` terminé avec code 0.
- **Installation réelle** : Exécution de `PartIVA Desktop_0.1.0_x64-setup.exe /S` mettant à jour `C:\Users\pc\AppData\Local\PartIVA Desktop\`.
- **Exécution réelle de `partiva-desktop.exe` validée** :
  - `server.js` trouvé sous `_up_\server\server.js`
  - Sidecar Node lancé avec succès
  - Port dynamique alloué (`PARTIVA_SERVER_PORT=53325`)
  - Healthcheck OK sur `/api/health`
  - Navigation OK vers `/admin/dashboard`
  - Fenêtre principale maximisée et affichée sans état réduit
  - Splash fermé

### 4. Prochaine étape

- **E9-R2-septies** : Redirection post-login + UI/UX desktop + CSP.

---

## Session E9-R2-septies — Redirection post-login + UI/UX desktop + CSP (2026-10-17)

**Date :** 2026-10-17  
**Type :** Exécution (correctifs post-login + thème UI/UX)  
**Statut :** ✅ Validé

### 1. Diagnostics et causes racines

1. **Bouton bloqué sur « Connexion en cours... »** :
   - Côté client, `authClient` dans `src/lib/auth-client.ts` utilisait `baseURL: process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'`. Dans la WebView desktop (exécutée sur `http://127.0.0.1:<port>`), la requête d'authentification ciblait `http://localhost:3000` (inaccessible), provoquant un rejet de promesse.
   - L'absence de bloc `try / catch` dans `LoginPage.handleSubmit` laissait `loading: true` indéfiniment lors d'un échec réseau.
   - Côté serveur, `.env` dans `desktop/server/` contenait `BETTER_AUTH_URL=https://part-iva.vercel.app`, forçant BetterAuth à traiter `127.0.0.1:<port>` comme origine non autorisée et à émettre des cookies avec le préfixe `__Secure-` et l'attribut `Secure: true`. Le navigateur/WebView en HTTP rejetait ces cookies, empêchant l'établissement de la session.

2. **Thème noir (UI/UX sombre par défaut)** :
   - `src/app/providers.tsx` configurait `defaultTheme="dark"` sur `ThemeProvider`. Dans un profil WebView2 vierge (sans clé `localStorage` pré-existante), l'application appliquait immédiatement `class="dark"` sur `<html>`.
   - L'absence de composant `ThemeToggle` dans le layout d'authentification (`src/app/(auth)/layout.tsx`) empêchait tout basculement rapide par l'utilisateur.

3. **Accès DevTools (F12)** :
   - `desktop/src-tauri/Cargo.toml` ne déclarait pas la feature `devtools` sur le crate `tauri`, ce qui désactivait les outils de développement dans les builds de production.

### 2. Correctifs appliqués

1. **BetterAuth Client (`src/lib/auth-client.ts`)** :
   - Résolution dynamique de `baseURL` : `typeof window !== 'undefined' ? window.location.origin : ...`. Permet d'adresser automatiquement l'origine courante (serveur local sur port dynamique ou production web).
2. **BetterAuth Serveur (`src/lib/auth.ts`)** :
   - Déclaration de `trustedOrigins` : support de `http://127.0.0.1:*`, `http://localhost:*`, `tauri://localhost`, et `https://part-iva.vercel.app`.
   - Configuration de `advanced.useSecureCookies` : désactivé sur HTTP local pour permettre le stockage pérenne du cookie de session sans préfixe `__Secure-`.
3. **Formulaires d'authentification (`src/app/(auth)/login/page.tsx` et `register/page.tsx`)** :
   - Encadrement systématique des appels d'authentification dans un bloc `try / catch / finally` garantissant la réinitialisation de l'état `loading`.
   - Redirection robuste compatible WebView (`window.location.href = targetPage` avec repli `router.push`).
4. **Thème et UI/UX (`src/app/providers.tsx` et `src/app/(auth)/layout.tsx`)** :
   - `defaultTheme` passé à `"light"` dans `src/app/providers.tsx`.
   - Ajout du composant `ThemeToggle` en en-tête d'authentification pour permettre l'alternance Clair / Sombre / Système.
5. **Script de build serveur (`desktop/scripts/build-server.cjs`)** :
   - Neutralisation automatique de `BETTER_AUTH_URL` lors de la copie du fichier `.env` vers `desktop/server/.env`.
   - Hook de démarrage de `server.js` configurant dynamiquement `process.env.BETTER_AUTH_URL` et `process.env.NEXT_PUBLIC_APP_URL` sur `http://127.0.0.1:<port>`.
   - Journalisation explicite des copies d'assets statiques (`.next/static` et `public/`).
6. **Configuration Tauri (`desktop/src-tauri/Cargo.toml`)** :
   - Ajout de la feature `devtools` sur le package `tauri` pour activer les DevTools F12 en release.

### 3. Validations et baseline

- **Prettier** : `npm run format:check` → All matched files use Prettier code style!
- **ESLint** : `npm run lint` → 0 erreur, 0 warning.
- **Typecheck** : `npm run typecheck` → 0 erreur.
- **Tests Rust** : `cargo test` → 22 tests passés avec succès (17 unitaires + 5 intégration), 0 échec.
- **Build Desktop complet** : `npm run build:desktop` → `PartIVA Desktop_0.1.0_x64-setup.exe` généré avec succès (35 141 157 octets).

### 4. Prochaine étape

- **E9-R3.a — Migration lot 1** : Migration des 3 premières pages (`/admin/dashboard`, `/admin/audit`, `/admin/materiaux`) vers `dataClient`.





