# INDEX DES SESSIONS — PartIVA

**Dernière mise à jour :** 2026-10-21
**Source :** Création E4-S1
**Statut :** Index des sessions

## 1. Sessions documentées

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
| E26 | 2026-10-21 | Réforme de la procédure de coopération | Gouvernance | 🟡 En cours | `docs/sessions/rapports/SESSION-2026-10-21-E26.md` |

## 2. Rapports créés

Les rapports E17 → E24 sont créés (8/8). Seul le rapport de la session E26 reste à produire, à la clôture de la session.

## 3. Index des fonctionnalités

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

## 4. Notes

- **Format :** Chaque rapport suit le modèle `MODELE_RAPPORT.md`.
- **Mise à jour :** L'index est mis à jour à chaque nouvelle session.
- **Sessions antérieures :** Les sessions E0 à E16 ne sont pas listées ici. Leur trace est conservée dans `docs/archive/JOURNAL.md` et `docs/archive/ROADMAP.md` (archivage prévu en E6). Si le coordinateur souhaite un historique indexé E0 → E16, un ordre de rattrapage sera nécessaire.
- **Noms canoniques :** toute fonctionnalité ajoutée à une session doit être reportée au §3 sous le même nom (charte §6).
