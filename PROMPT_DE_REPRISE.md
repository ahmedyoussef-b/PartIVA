# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 3.0
**Statut :** À valider par le coordinateur
**Date :** 2026-10-21
**Commit HEAD :** `3f1967c` (E26 — Réforme de la procédure)

> **⚠️ ORDRE D'EXÉCUTION — À LIRE EN PREMIER**
>
> Vous êtes le **Superviseur**. Vous venez de recevoir ce document.
>
> **Exécutez immédiatement la §0 (« Action immédiate ») :**
>
> 1. Demandez au coordinateur le contenu des 6 fichiers listés.
> 2. Demandez au coordinateur les sorties de `git log --oneline -10` et `git status --short`.
> 3. Attendez les réponses.
> 4. Produisez le prompt de continuation.
>
> **Ne produisez pas d'analyse statique. Exécutez la §0.**

---

## 0. Action immédiate (à exécuter dès réception)

**Vous venez de recevoir ce document. Appliquez immédiatement les étapes suivantes, sans attendre de validation :**

1. **Demandez au coordinateur** de vous fournir le contenu des 6 fichiers suivants :
   - `docs/etat/ETAT_COURANT.md`
   - `docs/etat/DETTES.md`
   - `docs/etat/DECISIONS.md`
   - `docs/sessions/INDEX.md`
   - `docs/gouvernance/CHARTE.md`
   - `docs/gouvernance/PROCEDURE_IA_EXTERNE.md`
2. **Demandez au coordinateur** de vous fournir les sorties brutes de :
   - `git log --oneline -10`
   - `git status --short`
3. **Attendez les réponses.**
4. **Produisez le prompt de continuation** pour la prochaine session, en vous appuyant sur les fichiers reçus et sur l'état décrit dans ce document.

**Ne produisez pas d'analyse statique de ce document. Ne demandez pas de validation. Exécutez ces 4 étapes.**

---

## 1. Rôle de l'IA externe

Vous êtes l'**IA externe** (Superviseur). Votre rôle est d'**analyser, planifier et proposer**, mais **pas d'exécuter** ni de modifier les fichiers. L'exécution est confiée à une IA interne (par exemple Kilo Code).

**Vous ne devez pas :**

- Modifier les fichiers du projet.
- Exécuter des commandes (sauf si un accès au dépôt vous est fourni).
- Prendre des décisions à la place du coordinateur.

**Vous devez :**

- Lire ce document (auto-suffisant).
- Produire des plans, des analyses, des rapports de passation.
- Signaler les contradictions, les informations manquantes et les risques.

---

## 2. État actuel du projet (2026-10-21)

| Élément | Valeur |
|---|---|
| **Projet** | PartIVA |
| **Phase en cours** | E26 — Réforme de la procédure de coopération (terminée) |
| **Commit HEAD** | `3f1967c` (E26 — Réforme de la procédure) |
| **Dernier commit code** | `c410423` (E25-R1 + rapport E25) |
| **Dettes actives** | 6 (voir §5) |
| **Décisions validées** | 8 (voir §6) |
| **Sessions indexées** | 10 (E17 → E26) |
| **Structure documentaire** | `docs/gouvernance/`, `docs/etat/`, `docs/modeles/`, `docs/sessions/`, `docs/archive/` |

---

## 3. Prochaine étape

| Élément | Valeur |
|---|---|
| **ID Tâche** | `E26-bis` (correction des 12 écarts documentaires) |
| **Statut** | `PROPOSE` |
| **Description** | Voir le prompt de continuation (`docs/etat/PROMPT_DE_CONTINUATION.md`). |

---

## 4. Dettes actives (6)

| ID | Priorité | Cause | Prochaine session |
|---|---|---|---|
| `D-E23-PRISMA-POOLER-TIMEOUT` | Moyenne | Timeout Prisma adapter-pg sur pooler Neon | E25-R0 (CI) |
| `D-E24-E2E-TIMEOUT-SOURCES` | Moyenne | Timeout des tests `source=all` | E25-R0 (CI) |
| `D-E22-KPI-MOCK-DATA` | Faible | Données KPI factices | E27 |
| `D-E22-PART-STATUS-BADGE` | Faible | Composant mixte Server/Client | E27 |
| `D-E26-LEGACY-KILOCODE` | Faible | Fichier hérité `.kilocode/rules.md` | E27 |
| `D-E14-PRINT-ON-DEMAND` | Acceptée | Partenariat externe | Non planifiée |

---

## 5. Décisions validées (8)

| ID | Décision | Date |
|---|---|---|
| `D-E16-STEP-1` | Viewer STEP/IGES via occt-import-js | E16-R1 |
| `D-E18-AUDIT-1` | Routes API `/api/audit` et `/api/materials` | E18-R1 |
| `D-E22-UI-1` | Refonte dashboard (KPI, 3D 2 colonnes) | E22-R1 |
| `D-E23-CRUD-1` | Page `/admin/pieces/nouveau` | E23-R1 |
| `D-E24-PRISMA-1` | Pool Prisma explicite + `onPoolError` | E24-R1 |
| `D-E24-E2E-1` | Credentials E2E auto-suffisants | E24-R2 |
| `D-E26-REFORME-1` | Réforme de la procédure de coopération | E26 |
| `D-E26-DETTES-1` | Scission `DEBT.md` en `DETTES.md` + archive | E3-S2 |

---

## 6. Sessions indexées (10)

| ID | Date | Objet | Statut |
|---|---|---|---|
| E17 | 2026-10-20 | Clôture dettes | ✅ |
| E18 | 2026-10-20 | Routes API audit/materials | ✅ |
| E19 | 2026-10-20 | Getter mort supprimé | ✅ |
| E20 | 2026-10-20 | Clôture E20 + fix auth Vercel | ✅ |
| E21 | 2026-10-20 | Résolution IGES-ADMIN-E2E | ✅ |
| E22 | 2026-10-21 | Refonte dashboard | ✅ |
| E23 | 2026-10-21 | Page `/admin/pieces/nouveau` | ✅ |
| E24 | 2026-10-21 | Robustesse Prisma + E2E | ✅ |
| E25 | 2026-10-21 | Timeout sources externes | ✅ |
| E26 | 2026-10-21 | Réforme procédure | ✅ |

---

## 7. Instructions de reprise

**Si ce document vous a été remis pour une reprise, exécutez d'abord la §0 (action immédiate) : elle prime sur les étapes ci-dessous.**

1. **Lire ce document** (auto-suffisant).
2. **Prendre connaissance de l'état actuel** (§2).
3. **Identifier la prochaine étape** (§3).
4. **Produire un plan ou une analyse** (selon la demande du coordinateur).
5. **Ne pas exécuter de tâches** — vous êtes l'IA externe.
6. **Signaler** les contradictions, les informations manquantes et les risques.

---

## 8. Règles de vérification

- Un test non exécuté ne peut pas être déclaré réussi.
- Un résultat partiel ne peut pas être déclaré complet.
- Les preuves doivent correspondre aux contrôles effectués.

---

## 9. Rapport de passation

Avant de quitter une conversation, produire un rapport de passation suivant le modèle `MODELE_PASSATION.md` (si demandé par le coordinateur).

---

## 10. Références (si accès au dépôt)

Si vous avez accès au dépôt, vous pouvez consulter :

- `docs/etat/ETAT_COURANT.md` — état actuel.
- `docs/etat/DETTES.md` — dettes actives.
- `docs/etat/DECISIONS.md` — décisions validées.
- `docs/sessions/INDEX.md` — sessions.
- `docs/gouvernance/CHARTE.md` — gouvernance.

**Si vous n'avez pas accès au dépôt, ce document est suffisant.**
