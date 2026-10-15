# E8P-S08 — Validation manuelle de l'installateur (Coordinateur)

> Checklist à exécuter par le **Coordinateur** sur une machine Windows avec GUI.
> Les tests automatisés headless (16 tests Rust + 8 tests E2E UI) sont verts ;
> cette checklist couvre ce qui ne peut pas l'être en bac à sable (Bloc H de E8P-S08).

## Prérequis

- Machine Windows 10/11 avec session graphique
- Installateur : `desktop/src-tauri/target/release/bundle/nsis/PartIVA Desktop_0.1.0_x64-setup.exe`
  (régénérable : `cd desktop; npx tauri build --bundles nsis`)
- Un compte PartIVA valide (email + mot de passe)

## 1. Installation

- [ ] Double-clic sur `PartIVA Desktop_0.1.0_x64-setup.exe`
- [ ] Avertissement SmartScreen possible (installeur non signé — `D-desktop-code-signing`) : « Informations complémentaires » → « Exécuter quand même »
- [ ] Assistant NSIS s'ouvre (langue français par défaut)
- [ ] Dossier d'installation : `%LOCALAPPDATA%\PartIVA\` (ou personnalisé)
- [ ] Installation terminée sans erreur
- [ ] Raccourci **bureau** créé
- [ ] Raccourci **menu Démarrer** créé
- [ ] L'app apparaît dans « Ajout/Suppression de programmes »

## 2. Premier lancement

- [ ] La fenêtre « PartIVA Desktop » s'ouvre (1280×800)
- [ ] L'écran de **login** s'affiche
- [ ] Le fichier `%APPDATA%\PartIVA\partiva.db` est créé
- [ ] Les tables SQLite existent (`part`, `vehicle`, `fitment`, `part_image`, `part_version`, `part_specification`, `part_category`, `sync_metadata`, `_sqlx_migrations`) — vérifiable avec DB Browser for SQLite

## 3. Login

- [ ] Saisie email + mot de passe valides
- [ ] Connexion réussie → redirection vers le catalogue
- [ ] Identifiants invalides → message d'erreur clair (pas de crash)
- [ ] Token présent dans le **Gestionnaire d'identification Windows** (Credential Manager → Identifiants Windows → `com.partiva.desktop`)

## 4. Sync

- [ ] L'indicateur de sync passe à « Sync en cours… » puis « Sync à jour »
- [ ] Après sync : le catalogue affiche des pièces
- [ ] Une deuxième sync est plus rapide (incrémentale)

## 5. Recherche et fiches

- [ ] Les 6 modes de recherche sont présents
- [ ] Recherche par **référence** → résultats
- [ ] Recherche par **véhicule** (ex. « Clio ») → pièces compatibles
- [ ] Recherche par **spécifications** → résultats
- [ ] Clic sur une référence → fiche pièce (détails + specs + images + fitments)
- [ ] `/part?id=` sans id → message d'erreur propre

## 6. Hors ligne

- [ ] Couper le réseau (Wi-Fi/Ethernet)
- [ ] Le catalogue, la recherche et les fiches restent fonctionnels
- [ ] La sync échoue proprement : indicateur « Sync en erreur », pas de crash, données locales conservées
- [ ] Rétablir le réseau → la sync suivante réussit

## 7. Persistance et désinstallation

- [ ] Fermer puis rouvrir l'app : pas de re-login (token keyring)
- [ ] Désinstaller via « Ajout/Suppression de programmes »
- [ ] Binaire et raccourcis supprimés
- [ ] `%LOCALAPPDATA%\PartIVA\` nettoyé

## Rapport

Consigner les résultats dans `SESSION.md` (section E8P-S08, sous-section « Validation manuelle »)
et signaler tout échec au Superviseur avant clôture de phase (E8P-S09).
