# ÉTAT COURANT — PartIVA

**Dernière mise à jour :** 2026-10-21
**Commit HEAD :** `d227930` (E24 clôturée)
**Phase en cours :** E26 — Réforme de la procédure de coopération
**Statut du projet :** En cours

## 1. Objectif actuel

Réformer l'infrastructure documentaire pour accélérer et fiabiliser la coopération entre le coordinateur, l'IA interne et l'IA externe.

## 2. Architecture et choix applicables

- **Stack :** Next.js 16.4.0, React 19.3.0, Prisma 7.10.0, TypeScript 5.9.3, Tailwind 4.3.3.
- **Base de données :** Neon (PostgreSQL, pgvector).
- **Desktop :** Tauri (export statique).
- **Tests :** Playwright (E2E), ESLint, Prettier, TypeScript.
- **Structure documentaire :** En cours de réforme (E0→E7).

## 3. Travaux en cours

- **E26-Réforme :** Création des fichiers de gouvernance, modèles, état courant, sessions.

## 4. Blocages

- **D-E23-PRISMA-POOLER-TIMEOUT :** Un seul build vert. La dette reste active jusqu'à 2-3 runs consécutifs.
- **D-E24-E2E-TIMEOUT-SOURCES :** 2 tests `source=all` échouent (timeout 30s vs 32.8s réels).
- **D-E22-KPI-MOCK-DATA :** Données KPI factices en attendant un endpoint d'agrégats.
- **D-E22-PART-STATUS-BADGE :** Composant mixte Server/Client (fonctionnel).
- **D-E14-PRINT-ON-DEMAND :** Acceptée (facteur externe).

## 5. Décisions ayant un effet opérationnel

| ID | Décision | Date |
|---|---|---|
| `D-E16-STEP-1` | `occt-import-js` pour STEP/IGES | E16-R0b |
| `D-E18-AUDIT-1` | Routes API `/api/audit` et `/api/materials` créées | E18-R1 |
| `D-E22-UI-1` | Refonte dashboard (KPI, 3D 2 colonnes) | E22-R1 |
| `D-E23-CRUD-1` | Page `/admin/pieces/nouveau` créée | E23-R1 |
| `D-E24-PRISMA-1` | Pool Prisma explicite + `onPoolError` | E24-R1 |
| `D-E24-E2E-1` | Credentials E2E auto-suffisants | E24-R2 |

## 6. Prochaine étape autorisée ou proposée

- **ID Tâche :** `E7-S1` (validation finale de la cohérence documentaire).
- **Statut :** `PROPOSE` (en attente de validation du coordinateur).

## 7. Notes

- `CONTEXT.md` (ancien) est archivé dans `docs/archive/CONTEXT.md`.
- `DEBT.md` (ancien) a été scindé en `DETTES.md` (actives) + archive (clôturées) en E3-S2, puis archivé dans `docs/archive/DEBT.md`.
