# DÉCISIONS VALIDÉES — PartIVA

**Dernière mise à jour :** 2026-10-21
**Source :** Création E3-S3 (référencé par `ETAT_COURANT.md` §5)
**Statut :** Registre des décisions validées

## 1. Décisions techniques

### `D-E16-STEP-1` — Viewer STEP/IGES via occt-import-js

- **Date :** E16-R0b (cadrage) → E16-R1 (2026-10-19)
- **Décision :** Utiliser `occt-import-js` pour le support STEP/IGES dans le visualiseur 3D.
- **Justification :** Seule bibliothèque documentée pour STEP/IGES navigateur, sortie compatible Three.js.
- **Conséquences :** `CadViewer` créé, `ModelViewer` auto-détection, fixtures STEP/IGES, tests E2E.

### `D-E18-AUDIT-1` — Routes API `/api/audit` et `/api/materials`

- **Date :** E18-R1 (2026-10-20)
- **Décision :** Créer les routes API manquantes pour les pages admin audit et matériaux.
- **Justification :** Les getters `getAuditLogs()` et `getMaterials()` appelaient des routes inexistantes.
- **Conséquences :** Routes créées, fallbacks ajoutés dans `data-client.ts`.

### `D-E22-UI-1` — Refonte dashboard (KPI, 3D 2 colonnes)

- **Date :** E22-R1 (2026-10-21)
- **Décision :** Refondre le dashboard avec des KPI modernes et intégrer la 3D dans une disposition 2 colonnes.
- **Justification :** UI/UX inacceptable, 3D cachée derrière un onglet.
- **Conséquences :** `KpiCard` corrigé, layout 2 colonnes, `viewer-shell.tsx` créé.

### `D-E23-CRUD-1` — Page `/admin/pieces/nouveau`

- **Date :** E23-R1 (2026-10-21)
- **Décision :** Créer la page de création de pièce avec formulaire minimal (partNumber, name, description).
- **Justification :** Le bouton "Nouvelle pièce" redirigeait vers une route inexistante.
- **Conséquences :** Page créée, formulaire fonctionnel, API sécurisée (`requireAdmin`).

### `D-E24-PRISMA-1` — Pool Prisma explicite + `onPoolError`

- **Date :** E24-R1 (2026-10-21)
- **Décision :** Configurer explicitement le pool Prisma avec `connectionTimeoutMillis: 10_000` et `onPoolError`.
- **Justification :** Timeout sporadique sur le pooler Neon.
- **Conséquences :** Trace des erreurs pool, fail-fast à 10s.

### `D-E24-E2E-1` — Credentials E2E auto-suffisants

- **Date :** E24-R2 (2026-10-21)
- **Décision :** Aligner le seed sur `ADMIN_PASSWORD` pour les comptes E2E, et charger `dotenv` dans `playwright.config.ts`.
- **Justification :** Les tests USER/VIEWER échouaient en 401.
- **Conséquences :** 4 setups passent, fixture auto-suffisant.

## 2. Décisions de gouvernance

### `D-E26-REFORME-1` — Réforme de la procédure de coopération

- **Date :** E26 (2026-10-21)
- **Décision :** Réformer l'infrastructure documentaire pour accélérer la coopération.
- **Justification :** Procédure actuelle trop lente (frictions de preuve, granularité trop fine, redondance documentaire).
- **Conséquences :** Création de `docs/gouvernance/`, `docs/modeles/`, `docs/etat/`, `docs/sessions/`.

### `D-E26-DETTES-1` — Scission `DEBT.md` en `DETTES.md` + archive

- **Date :** E3-S2 (2026-10-21) — *référence historique : scission `DEBT.md` → `DETTES.md` effectuée en E3-S2 ; conservée telle quelle par la réforme E26.*
- **Décision :** Séparer les dettes actives (dans `DETTES.md`) de l'historique des dettes clôturées (dans `DEBT_HISTORIQUE.md`).
- **Justification :** `DEBT.md` mélangeait actif et historique, contredisant la charte §10.
- **Conséquences :** `DETTES.md` (6 actives), `DEBT_HISTORIQUE.md` (30 clôturées), `DEBT.md` archivé dans `docs/archive/DEBT.md` (E6).

## 3. Notes

- **Mise à jour :** Les nouvelles décisions sont ajoutées ici après validation par le coordinateur.
- **Référence :** `ETAT_COURANT.md` §5 renvoie à ce fichier pour les décisions opérationnelles.
- **Archivage :** Les décisions obsolètes sont conservées ici (pas d'archivage séparé).
- **Traçabilité :** Les 6 décisions techniques reprennent des faits validés par commits (`714a966`, `bbc7566`, `348d435`, `f8c9a33`, `d227930`) ; chaque identifiant est unique et ne remplace aucune décision antérieure.
