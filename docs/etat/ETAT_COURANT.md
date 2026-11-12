# État courant du projet

**Date de mise à jour :** 2026-11-12
**HEAD actuel :** `413165d` (Merge PR #70 — V8-B-6-f close)
**Branche courante :** `master`
**Statut :** V7 close (V7-A → V7-H validées). V8 close (V8-B-6 intégralement clôturée).

---

## État des versions

| Version | Statut |
|---------|--------|
| V3 | CLOS |
| V4-A | CLOS |
| V4-B | CLOS |
| V5 | CLOS |
| V6 | CLOS |
| V8 | CLOS |
| V7 | **CLOSE** — V7-A → V7-H validées (2026-11-10 → 2026-11-11) |
| V8 | **CLOS** — V8-B-6 intégralement clôturée (PR #64 → #70) |

---

## Actions critiques

- **Mot de passe admin** : `$env:ADMIN_PASSWORD` doit être défini dans l'environnement avant tout démarrage E2E admin. Les tests admin sont bloqués sans cela.
- **Hook BOM** : les fichiers doivent être encodés UTF-8 sans BOM. Vérifier avec `Get-Content -Encoding Byte` avant commit.
- **Nettoyage branches** : `refactor/v7-clean-ui` est obsolète (mergée dans `master` et `origin/master`, aucun commit en avance). Suppression candidate dans la session d'hygiène (`D-GIT-BRANCH-HYGIENE`).

---

## Session V8-B-6 (UI Reconstruction CAO — complétée)

### V8-B-6-a (État des lieux) — PR #64
Audit complet du workflow Reverse Engineering : UI (5 pages), actions serveur (8), API (aucune), modèles Prisma (4), workflow couvert (données, CAO, photos, validation), écarts identifiés (upload réel, preview 3D, export STL, suppression, etc.).

### V8-B-6-b (Upload réel CAO) — PR #65
Remplacement du champ URL texte par un `react-dropzone` réel dans le dialog "Ajouter un fichier CAO". Appelle `POST /api/upload/cad` (Cloudinary, 50 Mo) puis `addCadFile`. États `cadUploading` / `cadError`. Rafraîchissement via `router.refresh()`.

### V8-B-6-c (Preview 3D) — PR #66
Intégration de `ModelViewer` dans l'onglet "Dossier CAO". Dispatch automatique : `CadViewer` (STEP/IGES via occt-import-js) ou `StlViewer` (STL/OBJ/3MF via Three.js). Modale de preview 600px avec bouton "Voir en 3D" par fichier. État `previewOpen` / `previewSrc` / `previewName`.

### V8-B-6-d (Export STL fiable) — PR #67
Nouveau fichier `src/lib/export/cad-to-stl.ts` avec fonction `exportCadToStl` :
- STEP/IGES → STL via occt-import-js (Web Worker) + `STLExporter` (binaire)
- STL/OBJ/3MF → fichier existant (pas de conversion)
- Vérification d'étanchéité `isWatertight` (chaque arête partagée par exactement 2 faces)
- Bouton "Exporter STL" (icône Download) intégré dans l'onglet "Dossier CAO"

### V8-B-6-e (Logs structurés) — PR #68
28 logs structurés `[RE:...]` ajoutés dans 3 fichiers :
- `reverse-engineering-content.tsx` : upload, preview, export, statut, étape
- `cad-to-stl.ts` : conversion STL, vérification étanchéité
- `reverse-engineering.ts` : création projet, statut, étape, fichier CAO

Format : `console.info('[RE:etape] message', { métadonnées })`, `console.warn` (étanchéité), `console.error` (échec).

---

## Session V8-B-6 (UI Reconstruction CAO — complétée)

### V8-B-6-a (État des lieux) — PR #64
Audit complet du workflow Reverse Engineering : UI (5 pages), actions serveur (8), API (aucune), modèles Prisma (4), workflow couvert (données, CAO, photos, validation), écarts identifiés (upload réel, preview 3D, export STL, suppression, etc.).

### V8-B-6-b (Upload réel CAO) — PR #65
Remplacement du champ URL texte par un `react-dropzone` réel dans le dialog "Ajouter un fichier CAO". Appelle `POST /api/upload/cad` (Cloudinary, 50 Mo) puis `addCadFile`. États `cadUploading` / `cadError`. Rafraîchissement via `router.refresh()`.

### V8-B-6-c (Preview 3D) — PR #66
Intégration de `ModelViewer` dans l'onglet "Dossier CAO". Dispatch automatique : `CadViewer` (STEP/IGES via occt-import-js) ou `StlViewer` (STL/OBJ/3MF via Three.js). Modale de preview 600px avec bouton "Voir en 3D" par fichier. État `previewOpen` / `previewSrc` / `previewName`.

### V8-B-6-d (Export STL fiable) — PR #67
Nouveau fichier `src/lib/export/cad-to-stl.ts` avec fonction `exportCadToStl` :
- STEP/IGES → STL via occt-import-js (Web Worker) + `STLExporter` (binaire)
- STL/OBJ/3MF → fichier existant (pas de conversion)
- Vérification d'étanchéité `isWatertight` (chaque arête partagée par exactement 2 faces)
- Bouton "Exporter STL" (icône Download) intégré dans l'onglet "Dossier CAO"

### V8-B-6-e (Logs structurés) — PR #68
28 logs structurés `[RE:...]` ajoutés dans 3 fichiers :
- `reverse-engineering-content.tsx` : upload, preview, export, statut, étape
- `cad-to-stl.ts` : conversion STL, vérification étanchéité
- `reverse-engineering.ts` : création projet, statut, étape, fichier CAO
Format : `console.info('[RE:etape] message', { métadonnées })`, `console.warn` (étanchéité), `console.error` (échec).

### V8-B-6-f (Logs manquants) — PR #70
Logs structurés `[RE:...]` ajoutés aux 8 boutons manquants du flux RE dans `reverse-engineering-content.tsx` :
- Navigation : Passage à la Méthode 4, Sélection demande
- Statut : Ouverture menu statut
- Workflow : Valider → Lancer Usinage
- Mesure : Suppression cote, Ajout cote
- Save : Sauvegarde dossier RE
- Workspace : Lancement analyse Workspace

Total : 18 logs `console.info('[RE:...]` couvrant tous les boutons du flux RE.

---

## Dernière session

- **SESSION-2026-11-12-V8-B-6** (clôturée) : UI Reconstruction CAO complète — 6 sous-étapes (a→f), 7 PR mergées (#64→#70), 3 checks CI verts à chaque PR.

---

## Prochaine étape

**V8-B-7** : à préciser par le coordinateur (périmètre, objectif, livrables).

Pistes possibles :
- Traiter `D-GIT-STASH-RESIDUELS` (E9-R3.a).
- Traiter `D-ADMIN-TEST-COVERAGE`.
- Traiter `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED`.
- Photogrammétrie réelle.
- Autre.
