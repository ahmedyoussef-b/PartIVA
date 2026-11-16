# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 8.0
**Date :** 2026-11-16
**Commit HEAD :** `097d7e1` (Merge PR #109 — V8-D-7 PCB Design Studio close)
**Branche :** master
**Version en cours :** V8 close (V8-B-6 intégralement clôturée), V8-C-2a close, V8-D-4 close (avec dette), V8-D-5 / TÂCHE 1/2/3 closes, V8-D-7 PCB Design Studio close (a→g)
**Dernière étape close :** V8-D-7 (PCB Design Studio — PRs #103 → #109, merge `097d7e1`)
**Prochaine étape :** V8-D-8 (Intégration Tauri hybride + KiCad — IPC + CLI)

---

## ⚠️ ORDRE STRICT POUR L'EXÉCUTANT — À EXÉCUTER DANS CET ORDRE, SANS EXCEPTION

**Avant TOUTE action, lire les fichiers de procédure dans cet ordre :**

1. **`docs/gouvernance/PROCEDURE_INTERACTION.md`** — source unique des règles (R1-R10, L45-L60, formats prompt/accusé).
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
| **Version** | V7 close — V8 close (V8-B-6 intégralement clôturée) — V8-C-2a close — V8-D-4 close (avec dette) — V8-D-5 / TÂCHE 1/2/3 closes — V8-D-7 PCB Design Studio close (a→g) |
| **HEAD** | `097d7e1` (Merge PR #109, V8-D-7 PCB Design Studio) |
| **Dernière étape close** | **V8-D-7** (PCB Design Studio — a→g) |
| **Prochaine étape** | **V8-D-8** (Intégration Tauri hybride + KiCad — IPC + CLI) |

### Dettes haute / moyenne / basse actives

| ID | Sévérité | Objet |
| --- | --- | --- |
| `D-E24-E2E-TIMEOUT-SOURCES` | Haute | Timeout E2E sources |
| `D-PROCEDURE-3-ACTEURS-INAPPLICABLE` | Haute | Procédure 3 acteurs → 2 acteurs (R2) |
| `D-V8-B-1-C-FORM-ACTION-INLINE` | Haute | Formulaire `[id]/page.tsx` V8-B-1-c utilisait `action={inline}` rejeté par Next.js. Corrigé en V8-B-1-d (edit-form.tsx, PR #48). |
| `D-E2E-BUTTON-RENAMED` | Haute | `workspace.spec.ts` et `groq.spec.ts` ciblent `/Analyser/i` alors que le bouton réel est `Reconstruire CAO` (`IngestZone.tsx:338-344`). Specs pré-existamment cassées. |
| `D-ADMIN-TEST-COVERAGE` | Moyenne | Tests E2E admin — partiellement couverte (part-templates, PR #48). |
| `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` | Moyenne | Route admin download bloquée par auth |
| `D-TRACEPARTS-CREDENTIALS` | Moyenne | Credentials réels |
| `D-MIGRATION-CHECKSUM-MANUAL` | Moyenne | Doc (non bloquant) |
| `D-V8-B-0-JSON-FIELDS` | Moyenne | `dimensions`/`cadParams`/`analysisData` exclus de V8-B-0 (D2b) |
| `D-V8-D-4-COMPARE-VISUAL-VALIDATION` | Moyenne | Validation visuelle mode Comparer (4 couleurs) non fournie |
| `D-PCB-CATALOG-SYNC` | Moyenne | Injection web → local unidirectionnelle |
| `D-PCB-KICAD-IPC-GUI-DEPENDENCY` | Moyenne | L'IPC KiCad nécessite une instance GUI ouverte |
| `D-PCB-KICAD-VERSION-DEPENDENCY` | Moyenne | `kicad-cli` requis sur le poste Tauri |
| `D-V8-B-1-C-NOUVEAU-DOUBLON` | Basse | Route `/admin/part-templates/nouveau` conservée en parallèle de `/new`. |
| `D-V8-B-1-D-SPEC-EMPLACEMENT` | Basse | Spec E2E placée dans `e2e/admin/`. Décision (p) actée. |
| `D-PROCEDURE-WRAPPER-KILO` | Basse | `bash` Kilo = wrapper PowerShell, autorisé |
| `D-V8-B-0-FIX-1-HORS-PERIMETRE` | Basse | `test-files.txt` supprimé hors périmètre (tracé) |
| `D-ESLINT-IGNORE-DEPRECATED` | Basse | `.eslintignore` déprécié |
| `D-GIT-STASH-RESIDUELS` | Basse | Travail E9-R3.a en attente (2 stashes). Stashes conservés. |
| `D-PROCEDURE-DECOUPAGE-SOUS-ETAPES` | Basse | Découpage strict des prompts (Mode R2). |
| `D-WORKSPACE-LAYOUT-CSS` | Basse | Layout CSS (flex w-1/4/w-2/4/w-1/4). |
| `D-V8-D-5-ASSISTANT-LLM-REAL` | Basse | Assistant IA en mode squelette — appel LLM réel reporté. |
| `D-CHAT-TESTABILITY` | Basse | Textarea chat non pilotable par `fill`/`pressSequentially`. |
| `D-V8-D-5-USE-AI-CHAT-UNIFY` | Basse | Double implémentation chat (`handleSend` fetch direct vs `useAiChat`). |
| `D-AI-MOCK-NON-CABLÉ` | Basse | Drapeau `AI_MOCK` non câblé en E2E ni en `.env.example`. |
| `D-PCB-AUTOROUTER-ABSENT` | Basse | Pas d'autorouteur IPC natif ; Freerouting externe |

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
| (r) | Schémas Zod Reverse Engineering : utiliser `z.string().cuid()` |
| (s) | Accessibilité label : tout `<Label>` doit avoir `htmlFor` et l'`<Input>` associé un `id` |
| (t) | Tests d'intégration réels hors CI : script `npm run test:sources` |
| (u) | Réforme gouvernance 3 acteurs (IA externe, coordinateur, IA interne) |
| (v) | Logs structurés `[RE:...]` dans le flux Reverse Engineering (V8-B-6-e) |
| (w) | Logs complets sur tous les boutons du flux RE (18 logs) — V8-B-6-f |
| (x) | Upload CAO robuste (AbortController 30s) — V8-B-6-g |
| (y) | Éditeur 3D CadEditor (TransformControls) — V8-B-6-h |
| (z) | Pipeline STEP/IGES via libcascade — V8-C-2a |
| (aa) | Layout Workspace : flex (w-1/4, w-2/4, w-1/4) |
| (ab) | Workspace : panneaux rétractables (toggle PanelLeft/PanelRight) |
| (ac) | Assistant IA (V8-D-5/T2) : mock `AI_MOCK` dev manuel, `page.route` E2E, setter natif React |
| (ad) | Automatisation E2E panneaux rétractables (V8-D-5/T3) |
| (ae) | PCB Core = source de vérité ; KiCad = représentation synchronisée |
| (af) | V1 = mode guidé ; mode automatique en V8-D-9 |
| (ag) | Bibliothèque curatée (50 composants) + prix ajustables admin |
| (ah) | Mode Tauri hybride (IPC + CLI) |
| (ai) | Approvisionnement intelligent (BOM → prix/stock/alternatives) |
| (aj) | Revue de conception automatisée (design review) |
| (ak) | Simulation first-pass (SI/PI/EMC/Thermique) |
| (al) | Autoroutage assisté (Freerouting) |
| (am) | Templates de circuits de référence |
| (an) | BDD locale = catalogue + prix ajustables, injection web → local unidirectionnelle |
| (ao) | Formulaire intelligent 7 blocs (questions conditionnelles, suggestions IA, détection incohérences) |

### 5 dernières sessions

| ID | Date | Objet | Statut |
| --- | --- | --- | --- |
| V8-D-5 / T2 | 2026-11-15 | Assistant IA workspace (squelette chat, MessageList, E2E) | ✅ |
| V8-D-5 / T3 | 2026-11-15 | Automatisation E2E panneaux rétractables (3 tests, viewport) | ✅ |
| D-REGISTRE-ETAT-NETTOYAGE | 2026-11-15 | Nettoyage DETTES.md (triplon, entrées résolues, anomalie L13) | ✅ |
| V8-D-7 (a→g) | 2026-11-16 | PCB Design Studio : modèle Prisma, formulaire, bibliothèque, AI Engine, checkpoints, UI | ✅ |
| (à venir) | — | V8-D-8 (Intégration Tauri hybride + KiCad) | — |

---

## 3. Décisions clés (validées) — voir §2

---

## 4. Prochaine action attendue

**V8-D-8** : Intégration Tauri hybride + KiCad (IPC + CLI).

*(Options alternatives selon arbitrage : traitement dette `D-V8-D-4-COMPARE-VISUAL-VALIDATION`, `D-PCB-CATALOG-SYNC`, ou V8-D-9 mode automatique.)*

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
- **L59** : substituer tout placeholder `<hash>` / `<PR_NUMBER>` avant exécution.
- **L60** : pas de backtick `` ` `` dans les chaînes à guillemets doubles — utiliser `[char]96`.