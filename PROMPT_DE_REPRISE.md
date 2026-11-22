# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 8.16
**Date :** 2026-11-22
**Commit HEAD :** `e3085a9` (merge PR #148, 2026-11-22)
**Branche :** master
**Version en cours :** V7 close, V8 close, V8-D-14 close (Desktop Tauri), P6.3 → P10 closes, **Fast-Track P7 close** (Phases A-E, V1-V44), **post-Fast-Track commité** (SYNC-3), **fix chemin plateau KiCad (PR #143)**, **fix normalizeBoardPath platform-aware (PR #146)**, **bundle du plateau KiCad réel dans le build (PR #148)**, **clôture documentaire SYNC-1 → SYNC-4**.
**Dernière étape close :** PR #148 (bundle `carte-test.kicad_pcb` dans `src/lib/pcb/boards/` + `outputFileTracingIncludes` pour le bundle Vercel + documentation `PARTIVA_KICAD_BOARD`) — préc. PR #146 (fix `normalizeBoardPath` platform-aware).
**Prochaine étape :** C3 — canvas lisible (plan C1→C5 acté) — à spécifier (charte §9)

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

> **CLAUSE DE CLÔTURE** — cette régénération v8.16 est déclenchée par la validation coordinateur de PR #148 (bundle du plateau KiCad réel + tracing du build, commit `9b84159`). Elle ne déclenche AUCUNE autre étape.

---

## 1. Rôle de l'IA externe (résumé)

Voir `PROCEDURE_INTERACTION.md` §2.1. Analyser, planifier, proposer, exiger preuves brutes (L50/R9), émettre prompts unitaires (contenu exact, §5), valider accusés. Ne pas exécuter, ne pas modifier.

---

## 2. État actuel

| Élément | Valeur |
| --- | --- |
| **Projet** | PartIVA |
| **Version** | V7 close — V8 close (V8-B-6 intégralement clôturée) — V8-C-2a close — V8-D-4 close (dette requalifiée « résolution partielle ») — V8-D-5 / TÂCHE 1/2/3 closes — V8-D-7 PCB Design Studio close (a→g) — V8-D-8 → V8-D-13-b tracés (`DECISIONS.md` §14) — P5 (cartographie) close — **V8-D-14 close** — **P6.3 → P10 closes (2026-11-19)** — **Fast-Track P7 close (Phases A-E, V1-V44)** — **post-Fast-Track commité (SYNC-3)** — **fix chemin plateau KiCad (PR #143)** — **fix normalizeBoardPath platform-aware (PR #146)** — **bundle du plateau KiCad réel dans le build (PR #148)** — **clôture documentaire SYNC-1 → SYNC-4** |
| **HEAD** | `e3085a9` (merge PR #148, 2026-11-22) |
| **Dernière étape close** | **PR #148** (bundle `carte-test.kicad_pcb` + `outputFileTracingIncludes` pour Vercel + doc `PARTIVA_KICAD_BOARD`) — préc. PR #146 (fix `normalizeBoardPath` platform-aware) |
| **Prochaine étape** | **C3 — canvas lisible** (plan C1→C5 acté) — à spécifier (charte §9) |

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
| `D-V8-D-4-COMPARE-VISUAL-VALIDATION` | Moyenne | Validation visuelle mode Comparer — **activation disponible** : chaîne OCCT/Three.js câblée (`PcbProject.cadFileUrl` → `page.tsx` → `VisualComparisonOverlay` → `LayerMesh` → `<Canvas>`), repli SVG conservé (PR #139 `e291ae5`). **Statut : preuve à fournir** (rendu réel non capturé ; aucune URL renseignée en base ; aucun E2E WebGL exécuté). Réf. `docs/roadmap/P10_STATUS.md`. |
| `D-PCB-CATALOG-SYNC` | Moyenne | Injection web → local unidirectionnelle |
| `D-PCB-KICAD-IPC-GUI-DEPENDENCY` | Moyenne | L'IPC KiCad nécessite une instance GUI ouverte |
| `D-PCB-KICAD-VERSION-DEPENDENCY` | Moyenne | `kicad-cli` requis sur le poste Tauri |
| `D-SESSIONS-P1-P6-NON-INDEXEES` | Moyenne | Sessions P1→P6 (incl. V8-D-14) non indexées dans `docs/sessions/INDEX.md` |
| `D-PREUVES-NON-PERSISTEES` | Moyenne | Captures et logs runtime (`partiva-desktop.log`) dans `%TEMP%`, non persistés |
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

*Note v8.9 (2026-11-19) : `D-CLOUDINARY-KEY-LOGGED` **retirée** (résolue — PR #133, suppression du `console.log` dans `src/lib/cloudinary.ts`). `D-NEXT-IMAGES-DOMAINS-DEPRECATED` **retirée** (résolue — PR #133, retrait de `images.domains`, `remotePatterns` conservé). `D-V8-D-4-COMPARE-VISUAL-VALIDATION` maintenue — plan de résolution référencé vers `docs/roadmap/P7_ROADMAP.md` §4.*

*Note v8.13 (2026-11-22) : le tableau ci-dessus n'est pas re-généré. Les dettes Fast-Track P7 (17 actives + 4 soldées) sont dans `DETTES.md` §« Dettes Fast-Track P7 ». Les deux dettes critiques (`D-FT-P7-PRISMA-DRIFT`, `D-FT-P7-HEAD-DIVERGENCE`) sont **soldées**. Les 3 dettes constatées en SYNC-3 (`D-FT-P7-CURRENCY-HARDCODED`, `D-FT-P7-CANVAS-ORIGIN-HARDCODED`, `D-FT-P7-SOURCING-AUTOLOAD-COST`) sont actives.*

*Note v8.15 (2026-11-22) : PR #146 (fix `normalizeBoardPath` platform-aware — win32 conserve le chemin drive, POSIX convertit `C:/x` → `/c/x`) mergée sur `master` (commit `02f4661`). Vérifications : typecheck OK, 344 tests / 40 fichiers OK, prettier OK, lint OK, 3 checks CI verts (PR #146).*

*Note v8.16 (2026-11-22) : PR #148 (bundle du plateau KiCad réel `carte-test.kicad_pcb` dans `src/lib/pcb/boards/`, `outputFileTracingIncludes` pour le bundle Vercel, documentation de `PARTIVA_KICAD_BOARD`) mergée sur `master` (commit `e3085a9`). Variable `PARTIVA_KICAD_BOARD=src/lib/pcb/boards/carte-test.kicad_pcb` posée sur Vercel Production et Preview. Vérifications : typecheck OK, 344 tests / 40 fichiers OK, prettier OK, lint OK, `git diff --check` OK, 4 checks CI verts (PR #148). La vérification fonctionnelle post-déploiement de la page admin reste à consigner séparément.*

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
| (ap-1) | Écart L56 toléré pour un fix ciblé §8 — fond vérifié (pas de BOM, accents intacts via `ReadAllBytes` + `Select-String`). Réf. FIX-DOC-REPRISE 2026-11-17. |
| (ap-2) | Dépassement §8 assumé sur `ETAT_COURANT.md` (+48/−6) — tableau des 19 PR incompressible sans création de fichier non listé. Réf. FIX-DOC-REPRISE 2026-11-17. |
| (ap-3) | `D-V8-D-4-COMPARE-VISUAL-VALIDATION` maintenue OUVERTE, requalifiée « résolution partielle v2 » (PR #128 `621e1a4` + PR #131 `7b5a7eb` : rendu **SVG géométrique** 4 couches ; reste schématique, logs `[OCCT:compare]` absents en Desktop). Fermeture impossible sans preuve (charte §10). |
| (ap-4) | Leçon L61 — en Mode R2, si le prompt unitaire et le READY sont reçus dans le même tour, l'IA interne signale l'écart dans l'accusé et poursuit. L60 reste attribuée (pas de backtick dans guillemets doubles). |

### 5 dernières sessions

| ID | Date | Objet | Statut |
| --- | --- | --- | --- |
| V8-D-5 / T2 | 2026-11-15 | Assistant IA workspace (squelette chat, MessageList, E2E) | ✅ |
| V8-D-5 / T3 | 2026-11-15 | Automatisation E2E panneaux rétractables (3 tests, viewport) | ✅ |
| D-REGISTRE-ETAT-NETTOYAGE | 2026-11-15 | Nettoyage DETTES.md (triplon, entrées résolues, anomalie L13) | ✅ |
| V8-D-7 (a→g) | 2026-11-16 | PCB Design Studio : modèle Prisma, formulaire, bibliothèque, AI Engine, checkpoints, UI | ✅ |
| FIX-DOC-REPRISE | 2026-11-17 | Mise à jour traçabilité post-`216ed3e` (HEAD, statut, §Écarts détectés, requalification D-V8-D-4) | ✅ |
| FIX-DOC-DECISIONS-AP | 2026-11-17 | Solde S1 : (ap-1..ap-5) + L60/L61 dans `DECISIONS.md`, v8.2, clause de clôture | ✅ |
| P1 → P3 | 2026-11-17 | Revert `playwright.config.ts` (300_000), dette `D-E2E-PREEXISTANT-FAILURES`, amendement + commit `e1f63db` du doc sidecar, requalification `D-V8-D-4` | ✅ |
| P4 | 2026-11-17 | Leçons L62→L73 dans `DECISIONS.md` §7 + passage v8.3 + clause de clôture | ✅ |
| P5.1a | 2026-11-17 | `DECISIONS.md` §14 (14 entrées V8-D-8 → V8-D-13) + `INDEX.md` (entrée P5) | ✅ |
| P5.1b | 2026-11-17 | DETTES.md : `D-V8-D-8-E2E-NON-PROUVE` + recoupe D-V8-D-4 ; `PROMPT_DE_REPRISE.md` v8.4 | ✅ |
| P6.1a-ii | 2026-11-17 | Rejeu `--project=pcb` : 62 passed / 1 skipped / 0 failed (388 s) | ✅ |
| V8-D-14 | 2026-11-18 | Desktop Tauri fonctionnel (sidecar, auth réelle, PCB Studio, KiCad IPC, MSI/NSIS) | ✅ |
| V8-D-14 (merge) | 2026-11-19 | Merge PR #129 (`88fcaff`) — desktop Tauri + gouvernance v8.6 | ✅ |
| P6.3-b-2 | 2026-11-19 | Câblage GlbViewer multi-sources Niveau 1 (`28198eb`) | ✅ |
| P6.3-c1 | 2026-11-19 | Overlay Comparer SVG 4 couches + spec E2E geometric canvas — PR #131 (`b193259`) | ✅ |
| P6.3-c2 | 2026-11-19 | Fix Next.js 16.4.6 + anti-FOUC next-themes — PR #130 (`40b3850`) | ✅ |
| P7 | 2026-11-19 | Fix Cloudinary (logs) + migration `images.remotePatterns` + Roadmap P7 (D-V8-D-4) — PR #133 (`262a788`) | ✅ |
| P8 | 2026-11-19 | Câblage OCCT dans `VisualComparisonOverlay` (Canvas Three.js + fallback SVG) + `P8_STATUS.md` — PR #135 (`61c7471`) | ✅ |
| P9 | 2026-11-19 | Branchement défensif des données CAO (`layers`) dans la page projet + `P9_STATUS.md` — PR #137 (`20332f6`) | ✅ |
| P10 | 2026-11-19 | Migration Prisma `cadFileUrl`/`cadFileName` + activation du rendu CAO + `P10_STATUS.md` — PR #139 (`e291ae5`) | ✅ |
| Fast-Track P7 | 2026-11-19 → 2026-11-22 | Dashboard PCB, CDC client, analyse IA, placement KiCad, fiabilité et capitalisation (V1-V44) | ✅ |
| Post-Fast-Track | 2026-11-21 → 2026-11-22 | A2.5, LLM multi-provider, compilation CDC, sourcing composants, empreintes KiCad, canvas | ✅ |
| SYNC-1 → SYNC-4 | 2026-11-22 | Clôture documentaire (E10/E11/E12), commit post-Fast-Track, merge `master` (PR #141) | ✅ |
| PR #143 | 2026-11-22 | Fix chemin plateau KiCad (`normalizeBoardPath` Windows → POSIX + override `PARTIVA_KICAD_BOARD`) — `d75c75a` | ✅ |
| PR #146 | 2026-11-22 | Fix `normalizeBoardPath` platform-aware (win32 conserve le chemin drive, POSIX → `/c/x`) — `030c2d5` | ✅ |
| PR #148 | 2026-11-22 | Bundle plateau KiCad réel + tracing du build Vercel + doc `PARTIVA_KICAD_BOARD` — `9b84159` | ✅ |

---

## 3. Décisions clés (validées) — voir §2

---

## 4. Prochaine action attendue

**C3 — canvas lisible** (plan C1→C5 acté) : symboles 2×, labels lisibles, couleurs par type, zoom/pan, grille 2,54 mm, espacement des composants, chemin propre. À spécifier avant exécution (charte §9).

*Note v8.15 (2026-11-22) : Fast-Track P7 clos (44 étapes V1-V44), post-Fast-Track commité (`20e5993`), clôture documentaire (`57b0b00`), correctifs ESLint CI (`11220be`), fix chemin plateau KiCad (`36302a6`), fix `normalizeBoardPath` platform-aware (`030c2d5`), merge `master` via PR #146. `D-FT-P7-PRISMA-DRIFT` soldée (migration `20261120154239`) ; `D-FT-P7-HEAD-DIVERGENCE` soldée par ce merge. Vérifications : typecheck ✅, 344 tests / 40 fichiers ✅, prettier ✅, lint ✅, 3 checks CI verts.*

*Note v8.16 (2026-11-22) : plateau KiCad réel `carte-test.kicad_pcb` (158 532 octets) versionné dans `src/lib/pcb/boards/` et tracé dans le bundle via `outputFileTracingIncludes` (PR #148, merge `e3085a9`). Variable `PARTIVA_KICAD_BOARD` posée sur Vercel Production et Preview. Objectif : faire disparaître `Fichier KiCad introuvable : /c/Users/pc/.../carte-test.kicad_pcb` sur la page admin. C3 non démarré.*

*Options restant ouvertes : (a) C3 — canvas lisible ; (b) C4 — validation IPC sur le projet officiel `cmwo3y9z50000nsfc1ci309ll` ; (c) C5 — UX (chemin KiCad lisible, suppression, finitions) ; (d) synchronisation inverse KiCad → app ; (e) confirmation visuelle du placement par le coordinateur ; (f) mesure des faux positifs `cdc-quality` sur le golden set ; (g) runner live du golden set ; (h) nettoyage des orphelins ; (i) P11 — preuve E2E WebGL (solder `D-V8-D-4`) ; (j) `D-E2E-PREEXISTANT-FAILURES` — rejouer les 60 specs `admin/user/viewer/workspace/public` ; (k) dettes `D-PCB-*` basses. (Aucune nouvelle étape code ne doit être inventée sans spec — charte §9.)*

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
- **L88** (à consigner en P7, proposition IA externe 2026-11-19) : `Select-String -Pattern '^## X'` sur `Get-Content -Raw` ne matche pas les débuts de ligne (mode `-Raw` = chaîne unique). Utiliser `Select-String -Path` (ligne par ligne) ou `(?m)^## X` (mode multiline). Preuve : Bloc 3 vs [5.1] de la session P6.3-a.
