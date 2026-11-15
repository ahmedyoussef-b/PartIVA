# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 7.5
**Date :** 2026-11-15
**Commit HEAD :** `0edfb85` (Merge PR #94 — V8-D-4 layout flex, close avec dette)
**Branche :** master
**Version en cours :** V8 close (V8-B-6 intégralement clôturée), V8-C-2a close, V8-D-4 close (avec dette)
**Dernière étape close :** V8-D-4 (comparaison OCCT + layout flex)
**Prochaine étape :** V8-D-5 (assistant IA)

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
| **Version** | V7 close — V8 close (V8-B-6 intégralement clôturée) — V8-C-2a close — V8-D-4 close (avec dette) |
| **HEAD** | `0edfb85` (Merge PR #94, V8-D-4 layout flex) |
| **Dernière étape close** | **V8-D-4** (close avec dette) |
| **Prochaine étape** | **V8-D-5** (assistant IA) |

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
| `D-V8-D-4-COMPARE-VISUAL-VALIDATION` | Moyenne | Validation visuelle mode Comparer (4 couleurs) non fournie (PR #91/#92/#94 mergées) |
| `D-V8-B-1-C-NOUVEAU-DOUBLON` | Basse | Route `/admin/part-templates/nouveau` (V8-B-0) conservée en parallèle de `/new` (V8-B-1-c). |
| `D-V8-B-1-D-SPEC-EMPLACEMENT` | Basse | Spec E2E placée dans `e2e/admin/` (pas racine `e2e/`). Décision (p) actée dans DECISIONS.md. |
| `D-PROCEDURE-WRAPPER-KILO` | Basse | `bash` Kilo = wrapper PowerShell, autorisé |
| `D-V8-B-0-FIX-1-HORS-PERIMETRE` | Basse | `test-files.txt` supprimé hors périmètre (tracé) |
| `D-ESLINT-IGNORE-DEPRECATED` | Basse | `.eslintignore` déprécié |
| `D-GIT-STASH-RESIDUELS` | Basse | Travail E9-R3.a en attente (2 stashes : sidebar Tauri + backend Tauri avec commandes unifiées). Stashes conservés (pas de suppression). |
| `D-PROCEDURE-DECOUPAGE-SOUS-ETAPES` | Basse | Découpage strict des prompts (réforme du 2026-11-11, Mode R2). |
| `D-V8-D-4-TEST-FIXTURES-NON-TRACKED` | Basse | `public/models/cube-3mm.step`, `cube-3p5mm.step` non trackés (artefacts test) |

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
| (p) | Specs E2E admin → emplacement `e2e/admin/` |
| (q) | PROPOSITION (non actée) : 3 checks R3 nécessaires mais non suffisants pour UI interactives |
| (r) | Schémas Zod Reverse Engineering : utiliser `z.string().cuid()` pour tous les ID Prisma |
| (s) | Accessibilité label : tout `<Label>` doit avoir `htmlFor` et l'`<Input>` associé un `id` |
| (t) | Tests d'intégration réels hors CI : script `npm run test:sources` |
| (u) | Réforme gouvernance 3 acteurs (IA externe, coordinateur, IA interne) |
| (v) | Logs structurés `[RE:...]` dans le flux Reverse Engineering (V8-B-6-e) |
| (w) | Logs complets sur tous les boutons du flux RE (18 logs `console.info('[RE:...]`) — V8-B-6-f |
| (x) | Upload CAO robuste (AbortController 30s, cursor-pointer dropzone, logs complets) — V8-B-6-g |
| (y) | Éditeur 3D CadEditor (TransformControls, redimensionnement) + sauvegarde dimensions partielle — V8-B-6-h |
| (z) | Pipeline STEP/IGES via libcascade (importCadFile + tessellateShape + OcctViewer) — V8-C-2a |
| (aa) | Layout Workspace : flex (w-1/4, w-2/4, w-1/4) au lieu de grid (grid-cols-[1fr_2fr_1fr]) — plus fiable avec Tailwind 4 |

### 5 dernières sessions

| ID | Date | Objet | Statut |
| --- | --- | --- | --- |
| V8-B-6-g | 2026-11-12 | Correction upload CAO (AbortController 30s + cursor-pointer) | ✅ |
| V8-B-6-h | 2026-11-12 | Éditeur 3D CadEditor + croix fermeture | ✅ |
| V8-C-2a | 2026-11-12 | Pipeline STEP/IGES via libcascade + page détail [id] | ✅ |
| V8-D-4 | 2026-11-15 | Comparaison OCCT (OcctCompareTool + Cut/Common + FitCamera) + layout flex | ✅ (dette) |
| — | — | — | — |

---

## 3. Décisions clés (validées) — voir §2

---

## 4. Prochaine action attendue

**V8-D-5** : assistant IA (workspace) — prompt à émettre par l'IA externe.

*(Options alternatives selon arbitrage : V8-C-1c validation POC Tauri, V8-C-3 opérations paramétriques, traitement dette `D-V8-D-4-COMPARE-VISUAL-VALIDATION`.)*

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