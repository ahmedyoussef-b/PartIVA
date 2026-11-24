# Développement desktop Tauri — mode `tauri dev`

**Date :** 2026-11-23
**Périmètre :** `desktop/` (Tauri 2 + serveur Next.js)

## 1. Objet

Le cycle « build standalone → copie `desktop/server` → `tauri build` → installation NSIS/MSI »
coûte plusieurs minutes par itération. Pour le développement courant, utiliser `tauri dev` :
le serveur Next.js tourne en mode développement sur le port 3100, la fenêtre Tauri s'y connecte
directement et les modifications front-end sont rechargées à chaud.

Les installeurs restent nécessaires uniquement pour valider un livrable ou tester le sidecar.

## 2. Commande

```powershell
cd F:\PartIVA\desktop
npm run tauri:dev
```

La première compilation Rust prend quelques minutes ; les suivantes sont incrémentales.

## 3. Ce que fait `tauri dev`

1. `beforeDevCommand` = `node ./scripts/dev-server.cjs` :
   - lit `%APPDATA%\PartIVA\db.toml` (ou les variables `PARTIVA_DATABASE_URL` /
     `PARTIVA_BETTER_AUTH_SECRET`) ;
   - injecte `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL=http://localhost:3100`,
     `PARTIVA_DESKTOP=1` et les clés LLM optionnelles (`GROQ_*`, `CEREBRAS_*`, `OPENROUTER_*`,
     `OPENAI_*`, `GOOGLE_AI_API_KEY`, `LLM_PROVIDER`) ;
   - lance `next dev -p 3100` (Turbopack) dans la racine du dépôt. Aucune valeur de secret n'est
     loguée (seulement la présence des clés).
2. Rust (`desktop/src-tauri/src/lib.rs`) détecte le mode dev via `tauri::is_dev()` :
   - ne démarre **pas** le sidecar Node ;
   - ferme le splash, affiche la fenêtre principale et la navigue vers `http://localhost:3100/`.
3. Les routes API Next.js, l'authentification Better Auth et les fonctions PCB/KiCad sont servies
   par le serveur de développement ; `PARTIVA_DESKTOP=1` conserve l'ouverture de KiCad.

## 4. Différences avec le build installé

| Élément    | `tauri dev`                              | Build NSIS/MSI                                    |
| ---------- | ---------------------------------------- | ------------------------------------------------- |
| Serveur    | `next dev` (port 3100)                   | sidecar Node `desktop/server` (port 3210 → 3220)  |
| Front-end  | rechargement à chaud                     | build standalone figé                             |
| Binaire    | Rust debug incrémental                   | Rust release + bundling                           |
| Installeur | aucun                                    | NSIS + MSI                                        |
| Config     | `%APPDATA%\PartIVA\db.toml`              | même fichier, injecté par Rust                    |

## 5. Fichiers de travail PCB

Les plateaux et fichiers de travail sont écrits dans `%APPDATA%\PartIVA\pcb-work\<projectId>`
(le dossier d'installation `Program Files` n'est pas inscriptible). Comportement identique en dev
et en installé.

## 6. Dépannage

- **Port 3100 occupé** : arrêter l'autre `next dev`
  (`Get-NetTCPConnection -LocalPort 3100 -State Listen`).
- **Écran de configuration** : `%APPDATA%\PartIVA\db.toml` absent ou sans `DATABASE_URL`.
- **Turbopack en échec** : relancer avec `PARTIVA_DEV_WEBPACK=1` (le script ajoute `--webpack`).
- **Cache WebView2** : fermer l'app puis supprimer
  `%LOCALAPPDATA%\com.partiva.desktop\EBWebView`.
- **KiCad** : le plateau est **toujours** persisté par `place_footprints.py` (écriture fichier avec
  `--force`). `scripts/kicad/sync_board_live.py` ne fait que rafraîchir l'affichage de l'éditeur via
  l'API IPC, **sans jamais sauvegarder depuis la mémoire de KiCad** : celle-ci peut être obsolète et
  écraserait les composants ajoutés entre-temps.
  - Déplacement d'un composant déjà présent dans l'éditeur → visible immédiatement dans KiCad.
  - Nouveau composant (ajouté au fichier alors que KiCad est ouvert) → recharger le plateau dans
    KiCad (l'API IPC n'expose pas de commande de rechargement). L'app affiche une indication.
  - Prérequis IPC : `kicad-python` dans le site-packages utilisateur de KiCad
    (`%USERPROFILE%\Documents\KiCad\10.0\3rdparty\Python311\site-packages`) et serveur d'API activé
    dans Préférences > Plugins. Sans cela, l'écriture fichier reste fonctionnelle.

## 7. Vérification

- 2026-11-23 : `node --check desktop/scripts/dev-server.cjs` OK · `cargo check` OK ·
  `GET /api/health` sur le serveur de dev → 200 · `tauri dev` lancé et vérifié : log
  `{"target":"dev","msg":"mode développement : sidecar désactivé, webview → http://localhost:3100/"}`,
  compilation de `/` par Next.js (requête du webview), processus `partiva-desktop.exe` et port 3100
  actifs (voir `docs/etat/ETAT_COURANT.md`, session 2026-11-23).
