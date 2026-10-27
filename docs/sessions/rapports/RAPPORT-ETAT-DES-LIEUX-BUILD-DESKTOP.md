# Rapport d'état des lieux — Build Desktop (Tauri)

**Date :** 2026-10-26  
**Auteur :** IA interne  
**Nature :** Analyse en lecture seule

## 1. Fichiers inspectés

| Fichier | Statut |
| --- | --- |
| `.github/workflows/release-desktop.yml` | complet |
| `next.config.mjs` | complet |
| `src-tauri/tauri.conf.json` | absent (à racine) |
| `desktop/src-tauri/tauri.conf.json` | complet |
| `src-tauri/Cargo.toml` | absent (à racine) |
| `desktop/src-tauri/Cargo.toml` | complet |
| `package.json` (scripts + versions) | complet |
| `scripts/publish-desktop.mjs` | complet |

## 2. Structure du projet

- **Emplacement du projet Tauri :** `desktop/src-tauri/` (présent). Des répertoires `*tauri*` trouvés dans `desktop/src-tauri/`, `desktop/node_modules/@tauri-apps`, `desktop/ui/node_modules/@tauri-apps`, `node_modules/@tauri-apps`. `src-tauri/` n'existe pas à la racine.
- **Routes API dans `src/app` :** 46 routes `route.ts` listées (voir sortie §2.5). Principalement sous `src/app/api/` (plusieurs sous-arbres : admin, auth, dashboard, desktop, desktop-builds, fit-reports, health, installers, materials, parts, plastiques, requests, reverse-cao, search, sync, upload, upload-installer, upload-url).
- **Versions :** `next` ^16.4.1 (package.json ligne 47), `@tauri-apps/cli` présent dans `desktop/node_modules/@tauri-apps` (et `node_modules` racine). Tauri CLI utilisé via `npx tauri build` dans `desktop/src-tauri` (workflow ligne 85).

## 3. Workflow CI (release-desktop.yml)

### Étapes de déplacement
Le workflow déplace uniquement certains sous-dossiers de `src/app/` vers la racine sous forme `*.disabled` (shell bash) :
- `src/app/api` ? `api.disabled` (si existe)
- `src/app/admin` ? `admin.disabled` (si existe)
- `src/app/materiaux` ? `materiaux.disabled` (si existe)
- `src/app/reverse-engineering` ? `reverse-engineering.disabled` (si existe)

**Constat** : le déplacement ne concerne **pas** l'ensemble de `src/app/api`, il ne concerne que ces 4 sous-dossiers (api, admin, materiaux, reverse-engineering). Les autres routes API sous `src/app/api/...` restent en place.

### Étapes de restauration
L'étape "Restore API routes" (`if: always()`, shell bash) restaure les dossiers depuis `*.disabled` vers `src/app/*` s'ils existent :
- `api.disabled` ? `src/app/api`
- `admin.disabled` ? `src/app/admin`
- `materiaux.disabled` ? `src/app/materiaux`
- `reverse-engineering.disabled` ? `src/app/reverse-engineering`

### Shell utilisé
Les étapes "Temporarily disable API routes for static export" et "Restore API routes" utilisent explicitement `shell: bash`. Les autres étapes utilisent le shell par défaut selon OS.

## 4. Script de publication (publish-desktop.mjs)

- **Chemins de recherche des binaires :** recherche récursive depuis `bundleDir` via `findInstallerFiles()` (parcourt récursivement les sous-répertoires). Extensions recherchées : `.exe`, `.msi`, `.dmg`, `.appimage`, `.deb` (lignes 28, 48-63).
- **Gestion des erreurs :** vérifie existence/répertoire du `bundleDir`, vérifie présence de token `BLOB_READ_WRITE_TOKEN`, échoue si aucun installeur trouvé, échoue sur erreur upload ou sur échec API auto-save, sinon log succès.

## 5. Résultats du build statique local

- **Commande exécutée :** `$env:NEXT_EXPORT='true'; npm run build 2>&1 | Tee-Object -FilePath build-static.log` (sans modification de fichiers)
- **Résultat :** **Échec** du build Next.js en mode export statique
- **Erreur exacte (dernières lignes) :**
  ```
  Error: Failed to collect configuration for /api/desktop-builds
      at ignore-listed frames {
    [cause]: Error: export const dynamic = "force-static"/export const revalidate not configured on route 
  "/api/desktop-builds" with "output: export". See more info here: 
  https://nextjs.org/docs/advanced-features/static-html-export
        at ignore-listed frames
  }
  > Build error occurred
  Error: Failed to collect page data for /api/desktop-builds
  ```
- **Présence de `out/` :** non confirmé (build échoué avant génération complète)

## 6. Réponses aux 8 questions (§4)

| # | Question | Réponse | Preuve |
| --- | --- | --- | --- |
| 1 | Où se trouve physiquement le projet Tauri (`src-tauri`, `desktop/src-tauri`, autre) ? | `desktop/src-tauri/` | Sortie `Get-ChildItem -Path . -Directory -Filter "*tauri*" -Recurse` |
| 2 | Combien de routes API existent dans `src/app` ? | 46 fichiers `route.ts` | Sortie `Get-ChildItem -Path src/app -Recurse -Filter "route.ts" \| Select-Object FullName` |
| 3 | Le workflow CI déplace-t-il **tout** `src/app/api` ou seulement certains sous-dossiers ? | Seulement certains sous-dossiers : `src/app/api`, `src/app/admin`, `src/app/materiaux`, `src/app/reverse-engineering` | Extrait `.github/workflows/release-desktop.yml` lignes 42-57 |
| 4 | Le workflow restaure-t-il les dossiers déplacés en cas d'échec ? | Oui, avec `if: always()` | Extrait `.github/workflows/release-desktop.yml` lignes 66-81 |
| 5 | Quelle est la version de Next.js dans `package.json` ? | ^16.4.1 | `package.json` ligne 47 |
| 6 | Le build statique local échoue-t-il ? Sur quelle route exactement ? | Oui, sur `/api/desktop-builds` | 30 dernières lignes de `build-static.log` |
| 7 | Le workflow utilise-t-il `shell: bash` pour les étapes de déplacement ? | Oui | `.github/workflows/release-desktop.yml` lignes 43, 68 |
| 8 | Le script `publish-desktop.mjs` cherche-t-il le `.msi`/`.dmg`/`.AppImage` dans un chemin fixe ou récursif ? | Récursif | `scripts/publish-desktop.mjs` lignes 48-63 |

## 7. Points de fragilité identifiés

- **Déplacement partiel** : Seuls 4 sous-dossiers sont déplacés alors qu'il y a 46 routes API au total. D'autres routes API restent présentes et provoquent l'échec en mode `output: export`.
- **Restauration conditionnelle** : `if: always()` mais basée sur l'existence des dossiers `*.disabled`.
- **Chemins hardcodés** : Pas de vérification explicite après `mv`.
- **Secrets manquants en local** : Erreurs BetterAuth "default secret" observées.
- **Next.js 16 export** : Erreur "Server Actions are not supported with static export" présente dans les logs CI.
- **Chemin relatif** : `../../scripts/publish-desktop.mjs` depuis `desktop/src-tauri`.

## 8. Recommandations pour l'instrumentation des logs

- **Workflow** : logger avant/après déplacement, état de `out/`, état `*.disabled`, routes API présentes
- **next.config.mjs** : logger `isExport`, `output`
- **Build** : capturer erreur complète avec route concernée
- **publish-desktop.mjs** : logger bundleDir, fichiers trouvés, uploads, réponses API
- **Tauri** : logger `frontendDist` et présence de `out/index.html`
