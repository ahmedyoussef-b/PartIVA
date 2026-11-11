# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 5.0
**Date :** 2026-11-11
**Commit HEAD :** `ce8665b` (V7-H clôture — PR #37)
**Branche :** `master`
**Version en cours :** V7 close — V8 en cours
**Dernière étape close :** V7-H-2 (PR #37)
**Prochaine étape :** V8-P0-1

---

## 0. Action immédiate (à exécuter dès réception)

1. **Lire ce document** (auto-suffisant).
2. **Lire** `docs/gouvernance/PROCEDURE_INTERACTION.md` (règles).
3. **Vérifier** `git log --oneline -3` (HEAD).
4. **Émettre** le prompt de la prochaine étape (§4).

**Ne pas produire d'analyse statique. Exécuter ces 4 étapes.**

---

## 1. Rôle de l'IA externe

Voir `PROCEDURE_INTERACTION.md` §2.1. Résumé :
- **Analyser, planifier, proposer.**
- **Ne pas exécuter, ne pas modifier.**
- **Exiger des preuves brutes** (L50, R9).
- **Émettre** des prompts unitaires.
- **Valider** les accusés de réception.

---

## 2. État actuel

| Élément | Valeur |
|---|---|
| **Projet** | PartIVA |
| **Version** | V7 close — V8 en cours (fiabilisation inter-sessions) |
| **HEAD** | `ce8665b` |
| **Dernière étape close** | V7-H-2 (PR #37) |
| **Prochaine étape** | V8-P0-1 |

---

## 3. Décisions clés (validées)

| ID | Valeur |
|---|---|
| (a) | `CadFile.projectId` nullable + `requestId` nullable (XOR) |
| (b) | Preview STEP/IGES via `occt-import-js`, STL/OBJ via `three-stdlib` |
| (c) | Route dédiée `/api/upload/cad` |
| (d) | Orchestrateur = bouton + redirect + flag `?sequential=1` |
| (e) | Régénérer `migration.sql` avec `ON UPDATE CASCADE` |
| (f) | `PartTemplate` + `Solution` séparés, `method/sourceMethod` String |
| (g) | Backend-only (pas d'UI en V7-F/G) |
| (i) | Reconstruction backend-only (`reconstructFromCad`) |
| (j) | Zéro photogrammétrie (reportée V8) |
| (k) | `Solution.confidence = 85` par défaut |
| (l) | V7-H = doc minimale (5 fichiers) |
| (m) | Pas de tag (V7 est un incrément) |
| (o) | V8-P0 = 4 étapes (option C) |

---

## 4. Prochaine action attendue

**V8-P0-1** : créer `docs/gouvernance/PROCEDURE_INTERACTION.md` (source unique des règles) + régénérer `PROMPT_DE_REPRISE.md` v5.0 (point de reprise auto-suffisant).

Prompt à émettre : `V8-P0-1` (fourni par l'IA externe).

---

## 5. Fichiers de référence

- `docs/gouvernance/PROCEDURE_INTERACTION.md` — **règles d'interaction** (source unique)
- `docs/etat/ETAT_COURANT.md` — état détaillé
- `docs/etat/DETTES.md` — dettes complètes
- `docs/etat/DECISIONS.md` — décisions complètes
- `docs/sessions/INDEX.md` — historique sessions

---

## 6. Règle de régénération

**Ce fichier doit être régénéré à chaque fin d'étape** (V8-P0-1, V8-P0-2, etc.) via le prompt `V8-P0-<N>-reprise` (intégré aux étapes).

Structure à mettre à jour :
- **Date** : date du jour.
- **Commit HEAD** : hash du dernier commit mergé.
- **Dernière étape close** : `<V8-P0-N>`.
- **Prochaine étape** : `<V8-P0-N+1>`.
- **Décisions clés** : ajouter les nouvelles décisions validées.
