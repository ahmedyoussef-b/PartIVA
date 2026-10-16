# E9-R2-quinquies-bis — Diagnostic architecture Tauri

## 1. Structure réelle du projet

```
PartIVA/ (racine)
├── src/                      # Code source Next.js WEB (production Vercel)
│   └── app/
│       ├── admin/dashboard/  # Dashboard admin (EXISTE)
│       └── ...
├── desktop/                   # Projet Tauri Desktop
│   ├── ui/                   # UI E8P-S06 (export statique)
│   │   ├── next.config.mjs   # output: 'export', distDir: 'out'
│   │   └── out/              # Build statique (catalogue, login, recherche)
│   │       └── index.html    # « PartIVA Desktop », catalogue
│   ├── src-tauri/            # Code Rust Tauri
│   │   ├── tauri.conf.json   # frontendDist: "../ui/out"
│   │   ├── src/lib.rs        # Navigation vers /admin/dashboard
│   │   └── ...
│   ├── server/               # Next.js STANDALONE (E9 build)
│   │   ├── server.js         # Patché avec PARTIVA_SERVER_PORT
│   │   ├── .next/server/app/admin/dashboard.html  # EXISTE
│   │   └── ...
│   └── scripts/build-server.cjs
├── .next/standalone/          # Build Next.js (racine)
└── package.json               # Build principal: npm run build
```

## 2. tauri.conf.json — Analyse

**build :**
```json
"frontendDist": "../ui/out"    // Pointe vers ANCIENNE UI statique E8P-S06
"devUrl": "http://localhost:3100"
```

**windows :**
```json
"windows": [
  { "label": "splash", "url": "splash.html", "visible": true },
  { "label": "main", "url": "about:blank", "visible": false }
]
```

**security (CSP) :**
```
default-src 'self' http://127.0.0.1:*; 
script-src 'self' 'unsafe-inline' 'unsafe-eval' http://127.0.0.1:*; 
style-src 'self' 'unsafe-inline' http://127.0.0.1:*; 
img-src 'self' data: blob: http://127.0.0.1:* https://res.cloudinary.com;
```

## 3. lib.rs — Séquence de démarrage

1. **Lancement** (`run()`) → `tauri::Builder` avec plugins log + shell
2. **Initialisation BDD** (`db::init_local_db()`) - E8P-S02
3. **Spawn sidecar** (`start_server()`) → `node` exécutant `server/server.js`
4. **Extraction port** → Hook `PARTIVA_SERVER_PORT=<port>` (server.js patché)
5. **Healthcheck** → `http://127.0.0.1:<port>/api/health` (30s timeout)
6. **Navigation** → `main_window.navigate(url.parse::<tauri::Url>("http://127.0.0.1:<port>/admin/dashboard"))`
7. **Affichage** → `main_window.show()`
8. **Fermeture splash** → `splash.close()`

**⚠️ Point critique ligne 100 :**
```rust
let url = format!("http://127.0.0.1:{}/admin/dashboard", port)
    .parse::<tauri::Url>().map_err(|e| e.to_string())?;
main_window.navigate(url).map_err(|e| e.to_string())?;
```

**Bug identifié :** `.map_err(|e| e.to_string())` **ignore l'erreur** de navigation ! Si `parse::<tauri::Url>()` échoue, l'erreur est transformée en string mais **jamais propagée**. La fenêtre reste sur `about:blank`.

## 4. Navigation — Mécanisme utilisé

Le code utilise `webview_window.navigate()` de Tauri 2.

**Problème potentiel 1 :** `tauri::Url::parse()` peut échouer si le format n'est pas valide. En mode release, les erreurs sont silencieuses.

**Problème potentiel 2 :** `main_window.navigate()` peut échouer si la fenêtre n'est pas prête. Le `show()` est appelé **après** `navigate()`, ce qui est correct, mais si `navigate()` échoue, on montre une fenêtre vide.

**Problème potentiel 3 :** Le `frontendDist: "../ui/out"` charge l'ancienne UI au démarrage. Si la navigation échoue, l'utilisateur voit l'ancien catalogue via `frontendDist` fallback.

## 5. Artefacts disponibles

| Chemin | Existe | Contenu |
|---|---|---|
| `desktop/ui/out/index.html` | ✅ | UI E8P-S06 (catalogue) |
| `desktop/ui/out/admin/` | ❌ | **N'EXISTE PAS** |
| `desktop/server/.next/server/app/admin/dashboard.html` | ✅ | Dashboard admin HTML |
| `desktop/server/.next/server/app/admin/dashboard.rsc` | ✅ | React Server Component |
| `desktop/server/api/health` | ✅ | Endpoint healthcheck |
| `desktop/server/server.js` | ✅ | Patché avec PORT/127.0.0.1 hook |

**Conclusion critique :** Le serveur standalone contient `/admin/dashboard`, mais `frontendDist` pointe vers une UI sans ce chemin.

## 6. CSP

La CSP autorise `http://127.0.0.1:*` dans tous les dépots nécessaires (`default-src`, `script-src`, `style-src`, `img-src`, `connect-src` implicite via `default-src`).

**CSP n'est PAS le problème.**

## 7. Cause probable de l'affichage catalogue

**Hypothèse principale confirmée :**

1. Tauri démarre → charge `desktop/ui/out/index.html` (ancien catalogue)
2. Le sidecar Node.js démarre → serveur écoute sur un port dynamique
3. **Le code Rust tente de naviguer vers `http://127.0.0.1:<port>/admin/dashboard`**
4. **BUG CRITIQUE ligne 99-101 :** La conversion `parse::<tauri::Url>()` peut échouer silencieusement (erreur masquée par `.map_err(|e| e.to_string())`)
5. La fenêtre `main` reste sur `about:blank` → Tauri fallback sur `frontendDist` → **catalogue**

**Cause racine :** La navigation Rust échoue ou est bloquée sans visibilité (logs absents).

## 8. Correctifs recommandés

### Priorité 1 — Logs de diagnostic
Ajouter des `println!`/`log::info!` AVANT et APRÈS la navigation pour tracer :

```rust
eprintln!("[DEBUG] Navigation: url={}", url);
eprintln!("[DEBUG] navigate() result: {:?}", main_window.navigate(url));
eprintln!("[DEBUG] show() result: {:?}", main_window.show());
```

### Priorité 2 — Correction navigation Rust
Ne pas masquer l'erreur :

```rust
// Ligne 99-102 - CORRECTIF
let url = format!("http://127.0.0.1:{}/admin/dashboard", port)
    .parse::<tauri::Url>().map_err(|e| format!("URL parse error: {}", e))?;
main_window.navigate(url).map_err(|e| format!("Navigate error: {}", e))?;
main_window.show().map_err(|e| format!("Show error: {}", e))?;
```

### Priorité 3 — Vérifier `frontendDist`
Option 1 : Laisser `frontendDist` et assurer que la navigation fonctionne.
Option 2 : Supprimer `frontendDist` et laisser le sidecar gérer tout (Tauri 2).

### Priorité 4 — Test manuel
Lancer le binaire en terminal et observer les logs Rust pour confirmer la suite de l'exécution.

## 9. Questions pour le Superviseur

1. **La navigation Rust est-elle vraiment exécutée ?** Besoin de logs console pendant le test.
2. **Quel est le résultat de `parse::<tauri::Url>()` ?** Peut-être que le format URL n'est pas supporté par Tauri 2.
3. **Faut-il désactiver `frontendDist` ?** Pour forcer la navigation dynamique sans fallback.

## 10. Résumé exécutif

| Élément | Statut |
|---|---|
| Serveur standalone contient `/admin/dashboard` | ✅ Oui |
| `desktop/ui/out/admin/` existe | ❌ Non |
| Code Rust a la logique de navigation | ✅ Oui |
| `frontendDist: "../ui/out"` | ⚠️ Pointe vers UI obsolète |
| Navigation Rust cache-t-elle les erreurs | ⚠️ Oui (`.map_err(\|e\| e.to_string())`) |
| CSP | ✅ Correcte |

**Prochaine étape :** Tester le binaire avec logs debug pour confirmer où la navigation échoue.