# E8P — Rapport de clôture de phase

**Phase :** E8P (Desktop Tauri)  
**Date de clôture :** 2026-10-16  
**Statut :** ✅ CLÔTURÉE  
**Sessions :** 15 (S01 → S10-bis)  
**Branche :** `master`  

---

## 1. Objet de la phase

La phase **E8P (Desktop Tauri)** a doté PartIVA d'une application de bureau Windows native packagée (Tauri 2), conçue pour les utilisateurs atelier et terrain nécessitant un accès garanti à leur référentiel technique sans dépendance permanente au réseau.

Ses piliers techniques structurants :
1. **Architecture offline-first** : Réplique locale relationnelle sous SQLite (`partiva.db` dans `%APPDATA%\PartIVA\data\`), interrogée via Rust (`sqlx`) avec un schéma aligné sur le modèle central.
2. **Synchronisation unidirectionnelle (web → local)** : Modèle pull-only où le cloud PostgreSQL (Neon) demeure la source unique de vérité, éliminant tout conflit de données en V1.
3. **Sécurité et authentification native** : Session BetterAuth avec persistance sécurisée du jeton dans le gestionnaire d'identifiants de l'OS (Windows Credential Manager / keyring OS).
4. **Interface utilisateur hybride** : Frontend Next.js packagé en export statique, reproduisant l'expérience web (catalogue, recherche 6 modes, fiches pièces, fitments véhicules) et couplé au backend Rust via IPC Tauri.
5. **Distribution industrielle intégrée** : Générateur d'installeurs NSIS (`setup.exe`), couplé à une page d'administration web dédiée (`/admin/desktop-downloads`) pour le téléchargement direct et la traçabilité des versions.

---

## 2. Sessions et commits

La phase E8P s'est déroulée en **15 sessions** (initiales, spécialisées et correctives) :

| Session | Commit | Objet | Statut |
|---|---|---|---|
| **E8P-S01** | `e5f5e80` | Cadrage Desktop Tauri + sync BDD locale unidirectionnelle | ✅ |
| **E8P-S02** | `7600a9a` | Setup toolchain Rust + squelette Tauri 2 + SQLite local | ✅ |
| **E8P-S03** | `905baf4` | Schéma BDD locale SQLite + migrations SQLx | ✅ |
| **E8P-S04** | `f274aea` | Migration 0004 SQLx + endpoints API sync (`/api/desktop/sync/*`) | ✅ |
| **E8P-S05** | `68b6d48` | Client sync Rust (manifest/pull + upsert SQLite) | ✅ |
| **E8P-S06** | `62c1577` | UI desktop V1 (catalogue, 6 modes de recherche, fiches pièces) | ✅ |
| **E8P-S07** | `7b969b6` | Packaging NSIS (`setup.exe`) + documentation installation | ✅ |
| **E8P-S08** | `bcefed8` | Tests E2E desktop headless (16 Rust + 8 Playwright UI) | ✅ |
| **E8P-S02-bis** | `c00644e` | Correctif UX autofill web (`autoComplete="off"` / `"new-password"`) | ✅ |
| **E8P-S09-bis** | `d0e6e26` | Correctif login desktop + autofill UI (`readOnly` au focus) | ✅ |
| **E8P-S09-ter** | `180dbb8` | Login desktop — alignement headers requête Rust sur navigateur | ✅ |
| **E8P-S09-quater-bis** | `1b741dc` | Parsing cookie de session dual-name (`__Secure-better-auth.session_token`) | ✅ |
| **E8P-S09-quater-ter** | `e9d91b3` | Sync desktop (plugin `bearer()` BetterAuth) + navbar conditionnelle | ✅ |
| **E8P-S10** | `71176d4` | Page admin téléchargement desktop (`/admin/desktop-downloads`) + DevTools F12 | ✅ |
| **E8P-S10-bis** | `107d9db` | Résolution `@vercel/blob`, helper `auth-admin`, proxy download et types Next 16 | ✅ |

---

## 3. Livrables produits

### 3.1 Application Desktop
- **Code Rust** (`desktop/src-tauri/`) :
  - Client HTTP sécurisé, gestionnaire d'authentification et intégration OS keyring (`src/auth.rs`) ;
  - Moteur d'accès base de données SQLite asynchrone (`src/db.rs`) ;
  - Moteur de recherche et consultation catalogue (`src/parts.rs`) ;
  - Client de synchronisation incrémentale avec gestion des curseurs (`src/sync.rs`) ;
  - 4 migrations SQLx locales (`migrations/`) reproduisant les tables `part`, `vehicle`, `fitment`, `part_image`, `part_version`, `part_specification`, `part_category`, `sync_metadata`.
- **Frontend Desktop** (`desktop/ui/`) :
  - Layout conditionnel avec indicateur de synchronisation temps réel (`AppNav.tsx`, `SyncStatus.tsx`) ;
  - Pages Catalogue, Recherche (6 modes), Fiche détaillée et Login ;
  - Export statique optimisé pour WebView2.
- **Packaging** :
  - Configuration Tauri 2 (`desktop/src-tauri/tauri.conf.json`) ;
  - Installeur NSIS Windows autonome (`PartIVA Desktop_0.1.0_x64-setup.exe`, ~3.9 Mo).

### 3.2 Backend Web & Distribution
- **Endpoints de synchronisation** :
  - `GET /api/desktop/sync/manifest` : Fourniture du manifeste versionné et curseurs de mise à jour ;
  - `GET /api/desktop/sync/pull` : Flux de données sérialisé pour ingestion locale.
- **Portail de distribution** :
  - Route d'affichage administrateur : `/admin/desktop-downloads` ;
  - Route API de métadonnées releases : `/api/admin/desktop-downloads` ;
  - Route API proxy de téléchargement : `/api/admin/desktop-downloads/[version]/download` ;
  - Script d'enregistrement de release : `scripts/upload-desktop-installer.ts` ;
  - Répertoire des releases : `docs/desktop-releases.json` ;
  - Helper d'autorisation administrateur réutilisable : `src/lib/auth-admin.ts`.

### 3.3 Documentation et Procédures
- `docs/e8-desktop-tauri-scope.md` : Cadrage complet de l'architecture hybride.
- `docs/e8-desktop-manual-validation.md` : Protocole de vérification manuelle pour poste Windows avec interface graphique.
- `docs/desktop-install-guide.md` : Manuel d'installation et de dépannage utilisateur.
- `docs/e8p-close-report.md` : Ce rapport officiel de clôture.

---

## 4. Métriques finales et clarification de baseline

### 4.1 Clarification critique de l'écart de baseline (61 → 64 routes)

L'audit approfondi de la session de clôture a permis d'élucider définitivement l'alerte sur le compte de routes rapporté en E8P-S10-bis (**45/45 routes**) par rapport à la baseline attendue (**61 → 62 routes**) :

1. **Origine de l'écart (Hypothèse H1 validée)** :
   Lors de l'étape de compilation Next.js 16 (Turbopack), la ligne :
   `✓ Generating static pages using 7 workers (45/45) in 5.6s`
   correspond **exclusivement au sous-ensemble des routes statiques (`○`) pré-générées**, et **non** au total des routes de l'application. Le rapport E8P-S10-bis a confondu ce compteur de pages statiques avec le total global.
2. **Décompte réel exhaustif** :
   Le build Next.js génère exactement **64 routes** réparties en :
   - **45 routes statiques (`○`)** (dont la nouvelle page `/admin/desktop-downloads`) ;
   - **19 routes dynamiques (`ƒ`)** (dont les 2 nouvelles routes `/api/admin/desktop-downloads` et `/api/admin/desktop-downloads/[version]/download`) ;
   - **Total : 64 routes** (45 + 19 = 64).
3. **Évolution de la baseline** :
   - Baseline E8P-S08 : **61 routes** (44 statiques + 17 dynamiques) ;
   - Ajouts E8P-S10 : **+3 routes** (+1 statique, +2 dynamiques) ;
   - Baseline finale E8P-S09 : **64 routes**.
   **Aucune route n'a disparu. Zéro régression.**

### 4.2 Tableau synthétique des métriques

| Métrique | Baseline E8P-S08 | Réel constaté E8P-S09 | Statut |
|---|---|---|---|
| **Build web total** | 61 routes | **64 routes** (45 statiques + 19 dynamiques) | ✅ Conforme (+3 routes S10) |
| **ESLint** | 0/0 | **0 erreur, 0 warning** | ✅ Parfait |
| **TypeScript (`typecheck`)** | 0 erreur | **0 erreur** | ✅ Parfait |
| **Prettier (`format:check`)** | 0 écart | **100% conforme** | ✅ Parfait |
| **Tests Rust (`cargo test`)** | 16 passed | **18 passed / 0 failed** (+2 auth) | ✅ Parfait |
| **Tests E2E UI Desktop** | 8 passed | **8 passed / 0 failed** (Playwright) | ✅ Parfait |
| **Tests E2E Web** | 284 passed / 4 skipped | **284 passed / 0 failed / 4 skipped** (288 listés) | ✅ Baseline maintenue |
| **Prisma Migrations** | 15 migrations | **15 migrations** (schéma Neon à jour, 0 drift) | ✅ Parfait |
| **Taille binaire installeur** | — | **3.90 Mo** | ✅ Conforme (<10 Mo) |

---

## 5. Décisions verrouillées

| Décision | Portée | Statut |
|---|---|---|
| `D-E8P-S01-1` | Périmètre V1 consultation et recherche en lecture seule | ✅ Verrouillé |
| `D-E8P-S01-2` | Synchronisation unidirectionnelle web → local exclusive en V1 | ✅ Verrouillé |
| `D-E8P-S01-3` | Cycle de sync : initial complet, démarrage incrémental, manuel UI | ✅ Verrouillé |
| `D-E8P-S01-4` | Moteur BDD locale SQLite | ✅ Verrouillé |
| `D-E8P-S01-5` | Frontend desktop en export statique Next.js réutilisé | ✅ Verrouillé |
| `D-E8P-S01-6` | Framework applicatif desktop Tauri 2 | ✅ Verrouillé |
| `D-E8P-S01-7` | ORM Rust `sqlx` asynchrone avec migrations intégrées | ✅ Verrouillé |
| `D-E8P-S01-8` | Transport HTTP REST pull-only sur TLS | ✅ Verrouillé |
| `D-E8P-S01-9` | Authentification BetterAuth par session token + keyring OS | ✅ Verrouillé |
| `D-E8P-S01-11` | Embeddings et recherche vectorielle locale différés | ✅ Verrouillé |
| `D-E8P-S01-12` | Namespace d'API sync isolé sous `/api/desktop/sync/*` | ✅ Verrouillé |
| `OS-V1` | Ciblage système Windows 10/11 pour la V1 | ✅ Verrouillé |
| `D-E8P-C12` | Validation des résolutions techniques E8P-S10-bis | ✅ Verrouillé |
| `D-E8P-S09-1` | Pose du tag Git de clôture `v0.1.0-e8p` | ✅ Verrouillé |

---

## 6. Dettes actives (bilan)

### 6.1 Dettes Moyennes (5)
1. `D-junction-npm-prefix` : Création intempestive d'une jonction de répertoires Windows lors des `npm install --prefix` sous-dossiers (mitigation : script de suppression systématique de la jonction).
2. `D-traceparts-credentials` : Connecteur TraceParts en mode mock (en attente contrat R.5.22).
3. `D-tecdoc-credentials` : Connecteur TecDoc en mode mock (en attente contrat R.5.22).
4. `D-tecdoc-auto-parts` : Modèle et seed auto-parts opérationnels, enrichissement en attente contrat.
5. `D-deploy-comptes` : Déploiement Vercel live (`part-iva.vercel.app`), domaine et Sentry optionnels.

### 6.2 Dettes Faibles (~21)
- Dettes documentaires et contraintes d'environnement (filesystem `F:\`, timeouts de charge E2E Playwright).
- Spécificités desktop :
  - `D-sync-stub-d48` : Coexistence du stub historique `/api/sync` avec `/api/desktop/sync/*` ;
  - `D-desktop-icons-default` : Icônes Tauri par défaut (absence de logo vectoriel dédié) ;
  - `D-desktop-code-signing` : Absence de certificat de signature de code EV/OV Windows en V1 (SmartScreen) ;
  - `D-desktop-manual-validation` : Checklist de recette physique déléguée au Coordinateur.

### 6.3 Dettes Hautes (0)
- **0 dette Haute active.**

---

## 7. Réserve — Validation manuelle Coordinateur

Conformément à la gouvernance tripartite PCT, les environnements d'exécution automatisés (bacs à sable headless sans session graphique) ne permettent pas de valider physiquement l'affichage des fenêtres natives Windows, l'interaction avec le Windows Credential Manager et le dialogue WebView2 natif.

Le protocole complet de validation manuelle est consigné dans :
👉 **`docs/e8-desktop-manual-validation.md`**

**Points sous réserve de recette par le Coordinateur :**
- Exécution de l'installeur NSIS sur poste Windows 10/11 réel ;
- Premier lancement et initialisation automatique du fichier `%APPDATA%\PartIVA\partiva.db` ;
- Saisie des identifiants et vérification de la création de la clé dans le gestionnaire d'identifiants ;
- Déclenchement de la synchronisation initiale et remplissage du catalogue local ;
- Déconnexion du réseau et validation du comportement de consultation hors-ligne.

---

## 8. Incidents notables et leçons apprises

### 8.1 Incident login desktop multi-niveaux (E8P-S09-bis à quater-ter)
- **Manifestation** : Échec initial de connexion desktop, messages d'erreur génériques, blocage du jeton.
- **Résolution méthodique** :
  1. *Autofill navigateur/OS* : Neutralisation par `readOnly` au focus et attributs stricts.
  2. *En-têtes HTTP* : Alignement des requêtes Rust (`reqwest`) sur le comportement d'un navigateur réel (`Origin`, `Referer`, `User-Agent`).
  3. *Préfixe de cookie HTTPS* : Détection du comportement BetterAuth en production Vercel qui préfixe les cookies de session par `__Secure-` ; adaptation du parser Rust pour gérer le double nommage et les valeurs quotées.
  4. *En-tête Bearer* : Découverte que BetterAuth requiert explicitement le plugin `bearer()` côté serveur Next.js pour autoriser les requêtes API desktop non basées sur des cookies.
- **Leçon** : Toujours inspecter le code source des bibliothèques tierces (`node_modules`) pour valider les comportements non documentés (nommage exact des cookies, plugins d'authentification par token).

### 8.2 Incident `@vercel/blob` (E8P-S10-bis)
- **Manifestation** : Erreurs de compilation Next.js suite à des imports de fonctions et symboles inexistants dans le SDK `@vercel/blob`.
- **Résolution** : Remplacement par une abstraction d'accès fichiers sécurisée locale (`auth-admin.ts`, proxy de téléchargement, validation JSON sans BOM).
- **Leçon** : Ne jamais introduire de dépendances cloud optionnelles sans en tester préalablement la présence de l'API exacte et les contraintes de typage strict en mode build.

### 8.3 Incident de la jonction npm sous Windows (E8P-S02, S04, S07)
- **Manifestation** : `npm install --prefix` créait un lien symbolique récursif (jonction NTFS) vers la racine, faisant boucler le build Webpack/Turbopack.
- **Résolution** : Automatisation du nettoyage de la jonction par commande PowerShell après chaque manipulation de dépendances dans les sous-dossiers.

---

## 9. Hors périmètre V1 (V1.x / V2)

Les fonctionnalités suivantes ont été expressément exclues de la V1 et réservées pour les évolutions ultérieures :
1. **Écriture locale & synchronisation bidirectionnelle** : Création ou édition de pièces en mode déconnecté avec arbitrage de conflits cloud.
2. **Support multi-OS natif** : Déclinaisons pour macOS et distributions Linux.
3. **Mise à jour automatique in-app (Tauri Updater)** : Remplacement de l'installeur manuel par un mécanisme d'auto-update silencieux.
4. **Recherche vectorielle et sémantique locale** : Embarquement d'un modèle d'embeddings et moteur vectoriel local (ex. sqlite-vec).
5. **Signature cryptographique des exécutables** : Acquisition d'un certificat d'autorité Windows pour lever les avertissements SmartScreen.

---

## 10. Recommandations pour la phase E9 (Refonte hybride)

1. **Unification des types et contrats de données** :
   Consolider les contrats partagés entre le schéma Prisma (web) et les migrations SQLite (desktop) dans un package de types unique pour prévenir tout drift futur.
2. **Optimisation du flux de synchronisation** :
   Introduire une compression gzip/brotli sur les payloads de synchronisation volumineux (`/api/desktop/sync/pull`).
3. **Outillage de CI/CD desktop automatisé** :
   Intégrer le build Tauri et la génération des artefacts NSIS dans les GitHub Actions sur tag Git pour automatiser la publication des releases.

---

**Fin du rapport de clôture de la phase E8P — Phase officiellement clôturée.**
