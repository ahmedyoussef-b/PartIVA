# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 6.0
**Date :** 2026-11-11
**Commit HEAD :** `1bb22ee` (V8-P0 — fiabilisation inter-sessions, PR #38)
**Branche :** `master`
**Version en cours :** V7 close — V8 en cours
**Dernière étape close :** V8-P0-4 (PR #38)
**Prochaine étape :** V8-B-0 (UI templates `/admin/part-templates`)

---

## ⚠️ ORDRE STRICT POUR L'IA INTERNE — À EXÉCUTER DANS CET ORDRE, SANS EXCEPTION

**Vous êtes l'IA interne (exécution). Avant TOUTE action, vous DEVEZ lire les fichiers de procédure dans cet ordre :**

1. **`docs/gouvernance/PROCEDURE_INTERACTION.md`** — **source unique des règles** (R1-R10, L45-L59, formats prompt/accusé).
2. **`docs/gouvernance/PROCEDURE_IA_INTERNE.md`** — votre rôle, responsabilités, règles d'action (lecture, édition, preuves, blocage).
3. **`docs/gouvernance/PROCEDURE_COORDINATEUR.md`** — rôle du coordinateur (pour comprendre qui décide quoi).
4. **`docs/gouvernance/CHARTE.md`** — principes généraux (charte du projet).

**Si vous ne pouvez pas lire un de ces fichiers** (non fourni, inaccessible), **arrêtez-vous** et **demandez-le au coordinateur**. **Ne continuez pas sans avoir lu les 4 fichiers.**

**Après lecture des 4 fichiers**, exécutez la §0.

**Message READY obligatoire** : après lecture des 4 fichiers, envoyer au coordinateur le message exact :
`READY — PROCEDURE_INTERACTION.md + PROCEDURE_IA_INTERNE.md + PROCEDURE_COORDINATEUR.md + CHARTE.md lus — prêt.`
Ne pas exécuter la §0 avant confirmation du coordinateur.

---

## 0. Action immédiate (à exécuter dès réception, APRÈS l'ordre strict ci-dessus)

1. **Lire ce document** (auto-suffisant).
2. **Lire les 4 fichiers de procédure** (cf. ordre strict ci-dessus).
3. **Vérifier** `git log --oneline -3` (HEAD).
4. **Émettre** le prompt de la prochaine étape (§4).

**Ne pas produire d'analyse statique. Exécuter ces 4 étapes.**

---

## 1. Rôle de l'IA externe (résumé)

Voir `PROCEDURE_INTERACTION.md` §2.1. Résumé :

- **Analyser, planifier, proposer.**
- **Ne pas exécuter, ne pas modifier.**
- **Exiger des preuves brutes** (L50, R9).
- **Émettre** des prompts unitaires (avec **contenu exact** des livrables, §5).
- **Valider** les accusés de réception.

---

## 2. État actuel

| Élément                | Valeur                             |
| ---------------------- | ---------------------------------- |
| **Projet**             | PartIVA                            |
| **Version**            | V7 close — V8 en cours             |
| **HEAD**               | `1bb22ee` (V8-P0, PR #38)          |
| **Dernière étape close** | V8-P0-4 (PR #38)                 |
| **Prochaine étape**    | V8-B-0 (UI templates)              |

### Dettes haute / moyenne actives

| ID                          | Sévérité | Objet              |
| --------------------------- | -------- | ------------------ |
| `D-E24-E2E-TIMEOUT-SOURCES` | Haute    | Timeout E2E sources |
| `D-ADMIN-TEST-COVERAGE`     | Moyenne  | Tests E2E admin    |
| `D-TRACEPARTS-CREDENTIALS`  | Moyenne  | Credentials réels  |
| `D-MIGRATION-CHECKSUM-MANUAL` | Moyenne  | Doc (non bloquant) |

### Décisions clés (a)→(o)

| ID  | Valeur                                                                        |
| --- | ----------------------------------------------------------------------------- |
| (a) | `CadFile.projectId` nullable + `requestId` nullable (XOR)                    |
| (b) | Preview STEP/IGES via `occt-import-js`, STL/OBJ via `three-stdlib`           |
| (c) | Route dédiée `/api/upload/cad`                                                |
| (d) | Orchestrateur = bouton + redirect + flag `?sequential=1`                      |
| (e) | Régénérer `migration.sql` avec `ON UPDATE CASCADE`                            |
| (f) | `PartTemplate` + `Solution` séparés                                           |
| (g) | Backend-only (pas d'UI en V7-F/G)                                             |
| (i) | Reconstruction backend-only (`reconstructFromCad`)                            |
| (j) | Zéro photogrammétrie (reportée V8)                                            |
| (k) | `Solution.confidence = 85` par défaut                                         |
| (l) | V7-H = doc minimale (5 fichiers)                                              |
| (m) | Pas de tag (V7 est un incrément)                                              |
| (o) | V8-P0 = 4 étapes (option C)                                                   |

### 5 dernières sessions

| ID    | Date       | Objet                                | Statut |
| ----- | ---------- | ------------------------------------ | ------ |
| V7-D  | 2026-11-10 | Import CAO (PR #32)                  | ✅     |
| V7-E  | 2026-11-11 | Orchestrateur (PR #34)               | ✅     |
| V7-F  | 2026-11-11 | Capitalisation BDD (PR #35)          | ✅     |
| V7-G  | 2026-11-11 | Reconstruction CAO (PR #36)          | ✅     |
| V7-H  | 2026-11-11 | Clôture doc V7 (PR #37)              | ✅     |
| V8-P0 | 2026-11-11 | Fiabilisation inter-sessions (PR #38)| ✅     |

---

## 3. Décisions clés (validées) — voir §2

---

## 4. Prochaine action attendue

**V8-B-0** : UI templates `/admin/part-templates` (liste + création + édition), backend `part-templates.ts` déjà existant.

**Prompt à émettre** : `V8-B-0` (fourni par l'IA externe).

---

## 5. Fichiers de référence

- `docs/gouvernance/PROCEDURE_INTERACTION.md` — **règles** (source unique, à lire en priorité)
- `docs/gouvernance/PROCEDURE_IA_INTERNE.md` — rôle IA interne
- `docs/gouvernance/PROCEDURE_COORDINATEUR.md` — rôle coordinateur
- `docs/gouvernance/CHARTE.md` — principes généraux
- `docs/etat/ETAT_COURANT.md` — état détaillé
- `docs/etat/DETTES.md` — dettes complètes
- `docs/etat/DECISIONS.md` — décisions complètes
- `docs/sessions/INDEX.md` — historique sessions

**Instruction** : si l'IA externe a besoin de détails (contenu exact d'un fichier), **demander à l'utilisateur de coller le fichier**. Ne **pas** supposer.

---

## 6. Règle de régénération

**Ce fichier doit être régénéré à chaque fin d'étape** (V8-B-1, V8-C-1, etc.) via le prompt `V8-<étape>-reprise` (intégré aux étapes).

Structure à mettre à jour :

- **Date** : date du jour.
- **Commit HEAD** : hash du dernier commit mergé.
- **Dernière étape close** : `<V8-...-N>`.
- **Prochaine étape** : `<V8-...-N+1>`.
- **Décisions clés** : ajouter les nouvelles.
- **5 dernières sessions** : ajouter la nouvelle.
