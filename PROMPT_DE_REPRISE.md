# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 6.7
**Date :** 2026-11-12
**Commit HEAD :** `6e1e792` (Merge PR #57 — V8-B-3-c close)
**Branche :** master
**Version en cours :** V8 en cours
**Dernière étape close :** V8-B-3-c
**Prochaine étape :** V8-B-4 (à préciser par le coordinateur)

---

## ⚠️ ORDRE STRICT POUR L'EXÉCUTANT — À EXÉCUTER DANS CET ORDRE, SANS EXCEPTION

**Avant TOUTE action, lire les fichiers de procédure dans cet ordre :**

1. **`docs/gouvernance/PROCEDURE_INTERACTION.md`** — source unique des règles (R1-R10, L45-L59, formats prompt/accusé).
2. **`docs/gouvernance/PROCEDURE_IA_INTERNE.md`** — rôle exécution, responsabilités.
3. **`docs/gouvernance/PROCEDURE_COORDINATEUR.md`** — rôle coordinateur.
4. **`docs/gouvernance/CHARTE.md`** — principes généraux.

**Si un fichier est inaccessible : s'arrêter et demander au coordinateur.**

**Message READY obligatoire** : `READY — PROCEDURE_INTERACTION.md + PROCEDURE_IA_INTERNE.md + PROCEDURE_COORDINATEUR.md + CHARTE.md lus — prêt.`

**Mode d'exécution R2** (acté 2026-11-11) : pas d'IA interne séparée — coordinateur-exécutant + IA externe. Le coordinateur exécute, l'IA externe valide. Le wrapper `bash` Kilo invoque PowerShell : autorisé.

---

## 0. Action immédiate

1. Lire ce document.
2. Lire les 4 fichiers de procédure.
3. Vérifier `git log --oneline -3` (HEAD).
4. Émettre le prompt de la prochaine étape (§4).

---

## 1. Rôle de l'IA externe (résumé)

Voir `PROCEDURE_INTERACTION.md` §2.1. Analyser, planifier, proposer, exiger preuves brutes (L50/R9), émettre prompts unitaires (contenu exact, §5), valider accusés. Ne pas exécuter, ne pas modifier.

---

## 2. État actuel

| Élément | Valeur |
| --- | --- |
| **Projet** | PartIVA |
| **Version** | V7 close — V8 en cours |
| **HEAD** | `6e1e792` (Merge PR #57, V8-B-3-c close) |
| **Dernière étape close** | **V8-B-3-c** |
| **Prochaine étape** | **V8-B-4** (à préciser) |

### Dettes haute / moyenne / basse actives

| ID | Sévérité | Objet |
| --- | --- | --- |
| `D-E24-E2E-TIMEOUT-SOURCES` | Haute | Timeout E2E sources |
| `D-PROCEDURE-3-ACTEURS-INAPPLICABLE` | Haute | Procédure 3 acteurs → 2 acteurs (R2) |
| `D-V8-B-1-C-FORM-ACTION-INLINE` | Haute | Formulaire `[id]/page.tsx` V8-B-1-c utilisait `action={inline}` rejeté par Next.js (form cassé au rendu). Corrigé en V8-B-1-d (edit-form.tsx, PR #48). Clôture formelle : PR de clôture V8-B-1-e. |
| `D-ADMIN-TEST-COVERAGE` | Moyenne | Tests E2E admin — partiellement couverte (part-templates, PR #48). Reste à couvrir : autres pages admin (machines, dashboard, etc.). |
| `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` | Moyenne | Route admin download bloquée par auth |
| `D-TRACEPARTS-CREDENTIALS` | Moyenne | Credentials réels |
| `D-MIGRATION-CHECKSUM-MANUAL` | Moyenne | Doc (non bloquant) |
| `D-V8-B-0-JSON-FIELDS` | Moyenne | `dimensions`/`cadParams`/`analysisData` exclus de V8-B-0 (D2b) |
| `D-PROCEDURE-LONGUEUR-PROMPTS` | Moyenne | Subdivision en sous-étapes si dépassement |
| `D-V8-B-1-C-NOUVEAU-DOUBLON` | Basse | Route `/admin/part-templates/nouveau` (V8-B-0) conservée en parallèle de `/new` (V8-B-1-c). |
| `D-V8-B-1-D-SPEC-EMPLACEMENT` | Basse | Spec E2E placée dans `e2e/admin/` (pas racine `e2e/`). Décision (p) actée dans DECISIONS.md. Clôture : ce PR. |
| `D-PROCEDURE-WRAPPER-KILO` | Basse | `bash` Kilo = wrapper PowerShell, autorisé |
| `D-V8-B-0-FIX-1-HORS-PERIMETRE` | Basse | `test-files.txt` supprimé hors périmètre (tracé) |
| `D-ESLINT-IGNORE-DEPRECATED` | Basse | `.eslintignore` déprécié |
| `D-GIT-STASH-RESIDUELS` | Basse | Travail E9-R3.a en attente (2 stashes : sidebar Tauri + backend Tauri avec commandes unifiées). Stashes conservés (pas de suppression). |

### Décisions clés

| ID | Valeur |
| --- | --- |
| (a) | `CadFile.projectId` nullable + `requestId` nullable (XOR) |
| (b) | Preview STEP/IGES via `occt-import-js`, STL/OBJ via `three-stdlib` |
| (c) | Route dédiée `/api/upload/cad` |
| (d) | Orchestrateur = bouton + redirect + flag `?sequential=1` |
| (e) | Régénérer `migration.sql` avec `ON UPDATE CASCADE` |
| (f) | `PartTemplate` + `Solution` séparés |
| (g) | Backend-only (pas d'UI en V7-F/G) |
| (i) | Reconstruction backend-only (`reconstructFromCad`) |
| (j) | Zéro photogrammétrie (reportée V8) |
| (k) | `Solution.confidence = 85` par défaut |
| (l) | V7-H = doc minimale (5 fichiers) |
| (m) | Pas de tag (V7 est un incrément) |
| (o) | V8-P0 = 4 étapes (option C) |
| (p) | Specs E2E admin → emplacement `e2e/admin/` (seul projet Playwright injecte `storageState`) |
| (q) | PROPOSITION (non actée) : 3 checks R3 nécessaires mais non suffisants pour UI interactives — proposer un smoke test Playwright minimal pour les sous-étapes UI futures. À arbitrer en V8-B-2 ou ultérieur. |
| (r) | Schémas Zod Reverse Engineering : utiliser `z.string().cuid()` (et non `uuid()`) pour tous les ID Prisma. |
| (s) | Accessibilité label : tout `<Label>` doit avoir `htmlFor` et l'`<Input>` associé un `id` (pour `getByLabel` et l'accessibilité). |

### 5 dernières sessions

| ID | Date | Objet | Statut |
| --- | --- | --- | --- |
| V7-G | 2026-11-11 | Reconstruction CAO (PR #36) | ✅ |
| V7-H | 2026-11-11 | Clôture doc V7 (PR #37) | ✅ |
| V8-P0 | 2026-11-11 | Fiabilisation inter-sessions (PR #38) | ✅ |
| V8-P0-5 | 2026-11-11 | Prompt de reprise v6.0 (PR #39) | ✅ |
| V8-B-3 | 2026-11-12 | Dettes Reverse Engineering (schémas cuid, getByLabel, stash E9-R3.a) | ✅ |

---

## 3. Décisions clés (validées) — voir §2

---

## 4. Prochaine action attendue

**V8-B-4** : à préciser par le coordinateur (périmètre, objectif, livrables).

**Prompt à émettre** : `V8-B-4` (fourni par l'IA externe).

---

## 5. Fichiers de référence

- `docs/gouvernance/PROCEDURE_INTERACTION.md` — règles (source unique)
- `docs/gouvernance/PROCEDURE_IA_INTERNE.md` — rôle exécution
- `docs/gouvernance/PROCEDURE_COORDINATEUR.md` — rôle coordinateur
- `docs/gouvernance/CHARTE.md` — principes généraux
- `docs/etat/ETAT_COURANT.md` — état détaillé
- `docs/etat/DETTES.md` — dettes complètes
- `docs/etat/DECISIONS.md` — décisions complètes
- `docs/sessions/INDEX.md` — historique sessions

**Instruction** : si l'IA externe a besoin de détails, demander à l'utilisateur de coller le fichier. Ne pas supposer.

---

## 6. Règle de régénération

Ce fichier doit être régénéré à chaque fin d'étape via le prompt `V8-<étape>-reprise`.

Structure à mettre à jour :
- Date, Commit HEAD, Dernière étape close, Prochaine étape
- Décisions clés (ajouter les nouvelles)
- 5 dernières sessions (ajouter la nouvelle)

---

## 7. Contraintes d'exécution (actées 2026-11-11)

- **R2** : 2 acteurs (coordinateur-exécutant + IA externe).
- **Wrapper Kilo** : `bash` Kilo = PowerShell, autorisé.
- **Longueur** : subdiviser en sous-étapes si dépassement de la limite d'acceptation.
- **Preuves brutes** : obligatoires (L50/R9). Un rapport n'est pas une preuve.
