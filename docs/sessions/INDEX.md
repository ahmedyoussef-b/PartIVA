# INDEX DES SESSIONS — PartIVA

**Dernière mise à jour :** 2026-11-10
**Source :** Création E4-S1 ; synchronisation 2026-11-10 (session DOC-SYNC).
**Statut :** Index des sessions.

---

## 1. Sessions documentées (E17 → E29 — historique conservé)

| ID | Date | Objectif | Fonctionnalités | Statut | Rapport |
|---|---|---|---|---|---|
| E17 | 2026-10-20 | Clôture des dettes (IGES-ADMIN-E2E, THREE-CLOCK, PRINT-ON-DEMAND, DASHBOARD-FETCH) | Dettes | ✅ | `docs/sessions/rapports/SESSION-2026-10-20-E17.md` |
| E18 | 2026-10-20 | Routes API `/api/audit` et `/api/materials` | Audit, Materials | ✅ | `docs/sessions/rapports/SESSION-2026-10-20-E18.md` |
| E19 | 2026-10-20 | Suppression du getter mort `getMaterialBySlug` | Material Slug Getter | ✅ | `docs/sessions/rapports/SESSION-2026-10-20-E19.md` |
| E20 | 2026-10-20 | Clôture E20 + fix auth Vercel 401 | Gouvernance, Auth | ✅ | `docs/sessions/rapports/SESSION-2026-10-20-E20.md` |
| E21 | 2026-10-20 | Résolution `D-E16-IGES-ADMIN-E2E` (DB Neon accessible) | IGES | ✅ | `docs/sessions/rapports/SESSION-2026-10-20-E21.md` |
| E22 | 2026-10-20 → 2026-10-21 | Refonte dashboard (KPI, 3D 2 colonnes) + corrections critiques | Dashboard, 3D | ✅ | `docs/sessions/rapports/SESSION-2026-10-21-E22.md` |
| E23 | 2026-10-21 | Page `/admin/pieces/nouveau` + formulaire + API sécurisée | CRUD Pièces | ✅ | `docs/sessions/rapports/SESSION-2026-10-21-E23.md` |
| E24 | 2026-10-21 | Robustesse Prisma + credentials E2E auto-suffisants | Infrastructure, E2E | ✅ | `docs/sessions/rapports/SESSION-2026-10-21-E24.md` |
| E25 | 2026-10-21 | Plafonner le timeout `source=all` + propager signaux | Sources externes | ✅ | `docs/sessions/rapports/SESSION-2026-10-21-E25.md` |
| E26-bis-A | 2026-10-21 | Constat lecture seule (git status, CI, vérification droits) | Gouvernance | ✅ | `docs/sessions/rapports/SESSION-2026-10-21-E26-bis-A.md` |
| E26-bis-B | 2026-10-21 | Corrections documentaires (ETAT_COURANT, DETTES, DECISIONS, INDEX) | Documentation | ⏳ | `docs/sessions/rapports/SESSION-2026-10-21-E26-bis-B.md` |
| E26-bis-C | 2026-10-21 | Infrastructure CI (alignement branche, run vert, protection) | CI | ⏳ | `docs/sessions/rapports/SESSION-2026-10-21-E26-bis-C.md` |
| E26-bis-D | 2026-10-21 | Statut de suivi (post-incident CI) | CI | ⏳ | `docs/sessions/rapports/SESSION-2026-10-21-E26-bis-D.md` |
| E27-bis | 2026-10-22 | Activation checks CI requis + intégration rapports | Infrastructure CI | ✅ | `docs/sessions/rapports/SESSION-2026-10-22-E27-bis.md` |
| E28 | 2026-10-23 | Correction des 5 échecs E2E résiduels (D-E27-E2E-RESIDUAL) | E2E, Tests | ✅ | `docs/sessions/rapports/SESSION-2026-10-23-E28.md` |
| E29 | 2026-10-23 | Validation finale E2E + activation check requis sur master | E2E, CI, Gouvernance | ✅ | `docs/sessions/rapports/SESSION-2026-10-23-E29.md` |

### Sessions E58 (mention historique clarifiée)

| ID | Date | Objectif | Fonctionnalités | Statut | Rapport |
|---|---|---|---|---|---|
| E58-A → E58-E | 2026-11 (date exacte non tracée) | Consolidation E2E du workspace (14 tests) | E2E, Workspace | ✅ | *rapports non indexés — cf. `docs/sessions/rapports/`* |

**Note :** la session `E58-A → E58-E` était mentionnée en bas du fichier d'origine sans date ni statut. Elle est conservée ici pour traçabilité, mais son rapport n'est pas indexé. À compléter dans une session ultérieure si le coordinateur le demande.

---

## 2. Sessions V3 → V8 (ajoutées le 2026-11-10)

| ID | Date | Objectif | Fonctionnalités | Statut | Référence |
|---|---|---|---|---|---|
| V3 | 2026-11-07 | OpenSERP (CLI puis HTTP) | Connecteurs | ✅ | `DECISIONS.md` §3 |
| V4-A | 2026-11-07 | Auth validity + deep mode Playwright | Auth, E2E | ✅ | `DECISIONS.md` §3 |
| V4-B | 2026-11-07 | Cache web (collision, GET aggregate, enabled option) | Cache, API | ✅ | `DECISIONS.md` §3 |
| V5 | 2026-11-07 | Recherche multi-sources (UI, geometric, TraceParts mock, E2E, step.parts, CADENAS) | Recherche, Connecteurs | ✅ | `DECISIONS.md` §3 |
| V6 | 2026-11-07 | Reset password (web + SMTP) | Auth | ✅ | `DECISIONS.md` §3 |
| V8 | 2026-11-09 | Smart Router + Vue Hybride + Filtres + Bug fix (PR #18 `c0c86a2`) | Recherche, UI | ✅ | `DECISIONS.md` §3 |

---

## 3. Session en cours (2026-11-10)

| ID | Date | Objectif | Fonctionnalités | Statut |
|---|---|---|---|---|
| SESSION-2026-11-10-DOC-SYNC | 2026-11-10 | Synchronisation documentaire post-V8 (4 docs) | Gouvernance | ⏳ En cours |

**Détail :**
- **1-A** : `ETAT_COURANT.md` — en-tête 2026-11-10, versions V3–V8, actions critiques, prochaine étape V7-B. ✅
- **1-B** : `DETTES.md` — registre actif aligné v10 §3 (8 dettes + `D-GIT-BRANCH-HYGIENE`), garde-fou documentaire. ✅
- **1-C** : `DECISIONS.md` — Q1–Q6, C1–C3, V3–V8, L51–L56, décisions de méthode. ✅
- **1-D** : `INDEX.md` — en cours.
- **1-E** : commit + PR (à venir).

---

## 4. Décisions et leçons (renvoi)

Les décisions validées (Q1–Q6, C1–C3) et les leçons (L45–L57) sont consignées dans `docs/etat/DECISIONS.md`. Les dettes actives sont dans `docs/etat/DETTES.md`. L'état courant est dans `docs/etat/ETAT_COURANT.md`.

---

## 5. Index des fonctionnalités (E17 → E29 — historique conservé)

Noms canoniques des fonctionnalités traitées, avec les sessions correspondantes (charte §6).

| Fonctionnalité | Sessions | Statut |
|---|---|---|
| Dettes | E17, E20 | Actif |
| Audit | E18 | Actif |
| Materials | E18 | Actif |
| Material Slug Getter | E19 | Clôturé |
| Auth | E20 | Actif |
| IGES | E21 | Actif |
| Dashboard | E22 | Actif |
| 3D | E22 | Actif |
| CRUD Pièces | E23 | Actif |
| Infrastructure | E24 | Actif |
| E2E | E24 | Actif |
| Sources externes | E25 | Actif |
| Gouvernance | E20, E26 | Actif |

**Fonctionnalités V3 → V8 (ajoutées le 2026-11-10) :**

| Fonctionnalité | Sessions | Statut |
|---|---|---|
| Connecteurs | V3, V5 | Clôturé |
| Auth | V4-A, V6 | Clôturé |
| Cache / API | V4-B | Clôturé |
| Recherche | V5, V8 | Clôturé |
| UI | V8 | Clôturé |
| Gouvernance | DOC-SYNC | En cours |

---

## 6. Notes

- **Format :** Chaque rapport suit le modèle `MODELE_RAPPORT.md`.
- **Mise à jour :** L'index est mis à jour à chaque nouvelle session.
- **Sessions antérieures :** Les sessions E0 à E16 ne sont pas listées ici. Leur trace est conservée dans `docs/archive/JOURNAL.md` et `docs/archive/ROADMAP.md` (archivage effectué en E6). Si le coordinateur souhaite un historique indexé E0 → E16, un ordre de rattrapage sera nécessaire.
- **Noms canoniques :** toute fonctionnalité ajoutée à une session doit être reportée au §5 sous le même nom (charte §6).
- **Synchronisation 2026-11-10 :** les sessions V3–V8 et `SESSION-2026-11-10-DOC-SYNC` sont ajoutées. Les sessions E17–E29 sont conservées intégralement (charte §7). La mention `E58-A → E58-E` est clarifiée.
