# Rapport comparatif — Implémentation Tauri (référence vs PartIVA)

**Date :** 2026-10-26  
**Auteur :** IA interne  
**Nature :** Analyse en lecture seule — aucun code modifié

---

## 1. Inventaire du projet de référence

- **Emplacement du dossier :** `F:\PartIVA\docs\app\` (projet NexaFlow / ETAPE-B-CCP).
- **Fichiers Tauri identifiés :**
  - `docs/app/src-tauri/tauri.conf.json` (lignes 1-55)
  - `docs/app/src-tauri/Cargo.toml` (lignes 1-30)
- **Fichiers de configuration Next.js identifiés :**
  - `docs/app/next.config.mjs` (lignes 1-34)
  - `docs/app/package.json` (lignes 1-100)
- **Workflow CI identifié :** Aucun dans le dossier copié (`docs/app/.github/workflows/` inexistant — glob retourné vide).
- **Script de build desktop identifié :**
  - `docs/app/scripts/build-desktop.js` (lignes 1-52)
- **Script de publication identifié :**
  - `docs/app/scripts/upload-installers.js` (lignes 1-216)
- **Page de téléchargement identifiée :** Aucune page de téléchargement dédiée trouvée dans le dossier copié (pas de `app/admin/desktop-downloads/` ni équivalent). La référence publie sur GitHub Releases et expose les URLs `browser_download_url` directement.
- **Fichiers Tauri côté client identifiés :**
  - `docs/app/src/lib/tauri/env.ts` (détection environnement Tauri)
  - `docs/app/src/lib/tauri/fetch-with-auth.ts` (fetch avec inject token Tauri)

---

## 2. Réponses aux 10 questions (§2)

| # | Question | Réponse de la référence (preuve) | Réponse de PartIVA (preuve) |
|---|---|---|---|
| 1 | Le projet de référence utilise-t-il `output: 'export'` ? | **Oui**, mais conditionné par la variable d'environnement `BUILD_TARGET === 'desktop'` (pas `NEXT_EXPORT`). Extrait `docs/app/next.config.mjs` lignes 4-13 : `const isDesktop = process.env.BUILD_TARGET === 'desktop';` puis `output: 'export'`, `distDir: 'out'`. | **Oui**, conditionné par `NEXT_EXPORT === 'true'`. Extrait `next.config.mjs` lignes 4-7 : `const isExport = process.env.NEXT_EXPORT === 'true';` puis `output: isExport ? 'export' : undefined`. |
| 2 | Comment le projet de référence gère-t-il les routes API en mode Desktop ? | **Suppression complète** de `src/app/api/` avant le build, puis restauration. Extrait `docs/app/scripts/build-desktop.js` lignes 38-41 : copie `src/app/api/` vers `src/app/_api_skip/`, puis `removeDir(apiDir)`. Restauration dans le bloc `finally` (lignes 48-51). Aucune route API n'est présente pendant le build statique. | **Déplacement partiel** : seuls 4 sous-dossiers sont déplacés (`src/app/api`, `src/app/admin`, `src/app/(public)`, `src/app/client/dashboard`, `src/lib/actions`). Extrait `.github/workflows/release-desktop.yml` lignes 42-46. Les autres routes API sous `src/app/api/` restent en place et provoquent l'échec (erreurs sur `/api/desktop-builds`). |
| 3 | Comment gère-t-il `force-dynamic` et `generateStaticParams` ? | Aucune occurrence de `export const dynamic = 'force-dynamic'` ni de `generateStaticParams` dans les routes API de la référence, car **tout `src/app/api/` est supprimé avant le build**. Pas de `serverActions` en mode export (`next.config.mjs` ligne 23-25 : `experimental: {}` en mode desktop). | `export const dynamic = 'force-dynamic'` sur `src/app/api/desktop-builds/auto-save/route.ts` ligne 4, et `export const dynamic = 'force-static'` sur `src/app/api/desktop-builds/download/route.ts` ligne 1. `serverActions` configuré en mode web uniquement (`next.config.mjs` lignes 25-29). |
| 4 | Comment publie-t-il les fichiers `.exe`/`.msi` ? | **GitHub Releases** (pas Vercel Blob). Extrait `docs/app/scripts/upload-installers.js` lignes 29-36 : `GITHUB_TOKEN`, `GITHUB_OWNER`, `GITHUB_REPO`. Upload via API GitHub (`api.github.com`, `uploads.github.com`), lignes 58-175. Retourne `browser_download_url`. | **Vercel Blob** + API auto-save. Extrait `scripts/publish-desktop.mjs` lignes 18-19 : `import { put } from '@vercel/blob';`, lignes 42-46 : vérifie `BLOB_READ_WRITE_TOKEN`. Puis appel à `${apiBaseUrl}/api/desktop-builds/auto-save` (lignes 100-113). |
| 5 | Comment la page de téléchargement récupère-t-elle les fichiers ? | **Aucune page de téléchargement dédiée** trouvée dans le dossier copié. La référence publie sur GitHub Releases et expose les URLs `browser_download_url` directement (extrait `upload-installers.js` lignes 196-200). | Lecture depuis **Prisma DB** (`prisma.desktopInstaller`). Extrait `src/app/admin/desktop-downloads/page.tsx` lignes 10-12. Le client utilise `@vercel/blob/client` pour l'upload (`DesktopDownloadsClient.tsx` ligne 74). |
| 6 | Quelle est la structure du workflow CI ? | **Aucun workflow CI** dans le dossier copié (`docs/app/.github/workflows/` absent). Le build se fait localement via `scripts/build-desktop.js` puis `scripts/upload-installers.js`. | **Un seul job Windows** (`windows-latest`). Extrait `.github/workflows/release-desktop.yml` lignes 12-13. Déplace les dossiers, build Next.js avec `NEXT_EXPORT='true'`, restaure, `npx tauri build`, puis publie sur Vercel Blob. |
| 7 | Quel est le mode d'accès du stockage utilisé ? | **Public** via GitHub Releases (`browser_download_url` accessible publiquement). Pas de token nécessaire pour télécharger, seulement `GITHUB_TOKEN` pour uploader. | **Public** sur Vercel Blob (`access: 'public'` dans `publish-desktop.mjs` ligne 87 et `DesktopDownloadsClient.tsx` ligne 75). Token `BLOB_READ_WRITE_TOKEN` requis pour uploader. |
| 8 | Y a-t-il un `serverActions` ou une configuration `experimental` spécifique ? | **Non** en mode desktop : `next.config.mjs` lignes 23-25 montre `experimental: {}` quand `isDesktop` est vrai. Pas de `serverActions` configuré. | **Oui** en mode web : `experimental: { serverActions: { bodySizeLimit: '10mb' } }` (`next.config.mjs` lignes 25-29). En mode export : `experimental: {}` (ligne 24). |
| 9 | Quelle version de Next.js et de Tauri ? | **Next.js 14.2.35** (`package.json` ligne 61 : `"next": "14.2.35"`). **React 18** (ligne 66). **Tauri CLI 2.11.4** (ligne 79), `@tauri-apps/api 2.11.1` (ligne 51). Cargo.toml : `tauri = "2"` (ligne 10). | **Next.js 16.4.1** (`package.json` ligne 47 : `"next": "^16.4.1"`). **React 19** (ligne 52). **Tauri CLI 2.0.0** (`desktop/package.json` ligne 14), Cargo.toml : `tauri = "2.12.3"` (ligne 24). |
| 10 | Y a-t-il un `tsconfig.json` avec des exclusions spécifiques ? | **Oui** : `docs/app/tsconfig.json` ligne 30 — `exclude: ["node_modules", "backups", "docs/src"]`. Pas d'exclusion pour les dossiers déplacés car le build script les supprime physiquement. | **Oui** : `tsconfig.json` lignes 40-45 — `exclude: ["node_modules", "desktop/ui", "api.disabled", "disabled-pages"]`. Les dossiers `*.disabled` créés par le workflow sont exclus. |

---

## 3. Différences structurelles majeures

### Impact élevé (cause probable du bug)

1. **Déplacement partiel des routes API** : La référence supprime **intégralement** `src/app/api/` avant le build statique (copie + suppression + restauration dans `finally`). PartIVA ne déplace que 4 sous-dossiers, laissant d'autres routes API (dont `/api/desktop-builds`) en place, ce qui provoque l'erreur `force-dynamic` / `force-static` avec `output: export`. Preuve : `docs/app/scripts/build-desktop.js` lignes 38-51 vs `.github/workflows/release-desktop.yml` lignes 42-46.
2. **Variable d'environnement différente pour le build statique** : La référence utilise `BUILD_TARGET === 'desktop'` ; PartIVA utilise `NEXT_EXPORT === 'true'`. Si l'orchestrateur de PartIVA passe `BUILD_TARGET` au lieu de `NEXT_EXPORT`, le mode export ne s'active pas. Preuve : `docs/app/next.config.mjs` ligne 4 vs `next.config.mjs` ligne 4.
3. **Stockage différent (GitHub Releases vs Vercel Blob)** : La référence publie sur GitHub Releases avec `GITHUB_TOKEN` ; PartIVA utilise Vercel Blob avec `BLOB_READ_WRITE_TOKEN` + un appel API auto-save qui nécessite une route API fonctionnelle (`/api/desktop-builds/auto-save` avec `force-dynamic`), incompatible avec l'export statique. Preuve : `docs/app/scripts/upload-installers.js` lignes 29-36 vs `scripts/publish-desktop.mjs` lignes 18-19, 42-46, 100-113.

### Impact moyen

4. **Page de téléchargement reposant sur la DB** : PartIVA lit les installateurs depuis Prisma (`prisma.desktopInstaller`) dans une Server Component (`page.tsx` lignes 10-12), ce qui nécessite une connexion DB au rendu. La référence n'a pas de page de téléchargement dédiée dans le dossier copié ; les URLs viennent de GitHub Releases. Preuve : `src/app/admin/desktop-downloads/page.tsx` lignes 10-12.
5. **Route de download lisant le disque** : PartIVA a une route `/api/desktop-builds/download` avec `force-static` qui lit `public/builds` sur le disque. Cette route est problématique en mode export car elle tente d'accéder au système de fichiers serveur. La référence n'a pas cette route. Preuve : `src/app/api/desktop-builds/download/route.ts` lignes 1, 17-22.
6. **Cible de bundle Tauri différente** : La référence build `msi` + `nsis` ; PartIVA build `nsis` uniquement. Preuve : `docs/app/src-tauri/tauri.conf.json` lignes 28-31 vs `desktop/src-tauri/tauri.conf.json` ligne 43.
7. **Chemin `frontendDist` différent** : Référence : `../out` (relatif à `src-tauri/`). PartIVA : `../../out` (relatif à `desktop/src-tauri/`). Preuve : `docs/app/src-tauri/tauri.conf.json` ligne 9 vs `desktop/src-tauri/tauri.conf.json` ligne 10.

### Impact faible

8. **Versions Next.js / React différentes** : Référence Next.js 14.2.35 + React 18 ; PartIVA Next.js 16.4.1 + React 19. Certaines APIs (ex. `serverActions`, `output: export`) peuvent comporter des différences de comportement entre versions. Preuve : `package.json` lignes 47, 61, 66 vs `docs/app/package.json` lignes 47, 61, 66.
9. **`tsconfig.json` exclusions** : La référence n'exclut pas `api.disabled` car elle ne crée pas de dossiers `*.disabled` (suppression physique). PartIVA exclut `api.disabled` et `disabled-pages`. Preuve : `docs/app/tsconfig.json` ligne 30 vs `tsconfig.json` lignes 40-45.

---

## 4. Ce que PartIVA peut copier directement

1. **Suppression complète de `src/app/api/` avant le build statique** (pattern `build-desktop.js`) : Copier `docs/app/scripts/build-desktop.js` comme modèle — copie `src/app/api/` vers un dossier de sauvegarde, suppression, build avec `BUILD_TARGET='desktop'`, restauration dans un bloc `finally` pour garantir la restauration même en cas d'échec.
2. **Publication sur GitHub Releases** au lieu de Vercel Blob : Copier `docs/app/scripts/upload-installers.js` — upload direct des assets `.msi`/`.exe` vers une release GitHub, pas de dépendance à une route API `/api/desktop-builds/auto-save` ni à `BLOB_READ_WRITE_TOKEN`.
3. **Configuration `next.config.mjs` mode desktop avec `BUILD_TARGET`** : Utiliser `process.env.BUILD_TARGET === 'desktop'` au lieu de `NEXT_EXPORT === 'true'`, avec `output: 'export'`, `distDir: 'out'`, `images: { unoptimized: true }`, `trailingSlash: true`, et `experimental: {}` (pas de `serverActions`). Preuve : `docs/app/next.config.mjs` lignes 4-13.
4. **Pas de `force-dynamic` / `force-static` sur les routes API** : Puisque toutes les routes API sont supprimées avant le build, aucune ne doit porter ces directives. La référence n'en a aucune. Preuve : absence de ces directives dans `docs/app/src/app/api/**/route.ts`.

---

## 5. Ce que PartIVA doit adapter

1. **Workflow CI** : La référence n'a pas de workflow CI dans le dossier copié. PartIVA doit adapter son `.github/workflows/release-desktop.yml` pour utiliser le pattern de suppression complète de `src/app/api/` (ou de tout `src/app/`) au lieu du déplacement partiel des 4 sous-dossiers.
2. **Script de publication** : Remplacer `scripts/publish-desktop.mjs` (Vercel Blob + API auto-save) par un script d'upload GitHub Releases (type `upload-installers.js`). Cela élimine la dépendance à `BLOB_READ_WRITE_TOKEN` et à `/api/desktop-builds/auto-save`.
3. **Page de téléchargement** : Si PartIVA veut garder une page de téléchargement dans l'app web, elle doit soit (a) lire les données depuis une source statique (JSON généré au build), soit (b) les charger côté client depuis l'API GitHub Releases, car une Server Component lisant Prisma ne fonctionne pas en `output: export`.
4. **Route `/api/desktop-builds/download`** : Cette route lit le disque (`public/builds`) et est marquée `force-static`. En mode export statique, elle ne devrait pas exister ou doit être remplacée par des liens directs vers GitHub Releases.
5. **`desktop/package.json` script `build:desktop`** : Actuellement `cd ../ && npm run build && cd desktop/src-tauri && npx tauri build` — il faut ajouter le passage de `BUILD_TARGET='desktop'` et l'étape de déplacement/restauration des routes API avant le `next build`.

---

## 6. Recommandation

**Plan d'action en 3 étapes :**

1. **Aligner la stratégie de build statique** : Remplacer le déplacement partiel des 4 sous-dossiers dans `.github/workflows/release-desktop.yml` par une suppression complète de `src/app/api/` avant le `next build` (pattern `docs/app/scripts/build-desktop.js`), avec restauration garantie dans un bloc `finally`. Passer la variable d'environnement `BUILD_TARGET='desktop'` au lieu de `NEXT_EXPORT='true'`.
2. **Remplacer le stockage Vercel Blob par GitHub Releases** : Supprimer `scripts/publish-desktop.mjs` et le remplacer par un script d'upload GitHub Releases (modèle `docs/app/scripts/upload-installers.js`). Mettre à jour le workflow CI pour utiliser `GITHUB_TOKEN` au lieu de `BLOB_READ_WRITE_TOKEN` et supprimer l'étape d'appel à `/api/desktop-builds/auto-save`.
3. **Adapter la page de téléchargement** : Remplacer la lecture Prisma côté serveur dans `src/app/admin/desktop-downloads/page.tsx` par un fetch côté client vers les URLs GitHub Releases (ou un JSON statique généré au build). Supprimer ou neutraliser la route `/api/desktop-builds/download` (lecture disque incompatible avec l'export statique).