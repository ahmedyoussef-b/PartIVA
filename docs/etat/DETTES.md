# DETTES ACTIVES — PartIVA

**Dernière mise à jour :** 2026-11-15
**Source :** `PROMPT DE PASSATION — Superviseur IA Externe — v12` §3 (2026-11-10)
**Statut :** Registre actif — dettes non résolues uniquement (charte §10).

> **Garde-fou documentaire.** Ce registre est la **liste arbitrée** des dettes actives, alignée sur v10 §3. Les dettes non listées dans v10 ne sont **pas** portées ici : elles sont considérées comme non suivies. L'historique complet reste consultable via `git log -- docs/etat/DETTES.md` et `git show <commit>:docs/etat/DETTES.md`. Les **actions critiques** (non dettes) figurent dans `ETAT_COURANT.md` §« Actions critiques », pas dans ce registre (C1a).

---

## Haute

### `D-MIGRATION-CHECKSUM-MANUAL` — Checksum migration V7-D recalculé manuellement
### `D-V8-B-1-C-FORM-ACTION-INLINE` — Formulaire [id]/page.tsx cassé (action inline)

- **Statut :** Corrigé (en attente clôture V8-B-1-e)
- **Cause :** `src/app/admin/part-templates/[id]/page.tsx` utilisait `action={handleUpdate}` (fonction inline définie dans le composant serveur) dans V8-B-1-c. Next.js rejette : *"Functions cannot be passed directly to Client Components unless you explicitly expose it by marking it with 'use server'"*. Le formulaire d'édition était cassé au rendu : le champ `getByLabel(/Nom/i)` était introuvable.
- **Périmètre :** `src/app/admin/part-templates/[id]/page.tsx`, `src/app/admin/part-templates/[id]/edit-form.tsx`.
- **Effort estimé :** Faible (déplacer la logique dans un composant client `EditTemplateForm` avec `onSubmit` + `updatePartTemplate`/`deletePartTemplate` + `router.push`, suivant le pattern `editer/part-template-form.tsx`).
- **Bloquant :** Oui (pour le test E2E "mettre à jour" en V8-B-1-d).
- **Condition de résolution :** correction validée — 4 tests E2E CRUD passent (PR #48). Retirer de DETTES.md au merge du PR de clôture V8-B-1-e.

---

## Moyenne

### `D-ADMIN-TEST-COVERAGE` — Pas de tests E2E admin dédiés

- **Statut :** Partiellement couverte (part-templates)
- **Cause :** absence de couverture E2E dédiée au projet `admin` (au-delà des tests existants).
- **Périmètre :** `e2e/admin/`.
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** 4 tests E2E CRUD admin part-templates livrés (PR #48). Reste à couvrir : autres pages admin (machines, dashboard, etc.).

---

### `D-RE-CAD-DIMENSIONS-PERSIST` — Dimensions éditées dans CadEditor non persistées

- **Statut :** Active
- **Cause :** pas de champ `metadata` sur `CadFile` (nécessiterait une migration Prisma). Les dimensions éditées via `CadEditor` sont loguées en console mais non persistées.
- **Périmètre :** `src/components/3d/cad-editor.tsx`, `src/lib/actions/reverse-engineering.ts`.
- **Effort estimé :** Moyen (ajout champ `metadata Json?` sur `CadFile` + migration Prisma).
- **Bloquant :** Non.
- **Condition de résolution :** migration Prisma ajoutant `metadata` à `CadFile`, puis persistance effective dans `saveCadDimensions`.

---

### `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` — Route admin download bloquée par auth

- **Statut :** Active (bloquée V1.5)
- **Cause :** `/api/admin/desktop-downloads/[version]/download` requiert `requireAdmin()`. Bloquée par `D-E2E-AUTH-SEED-INVALIDATES-STORAGESTATE` (V1.5).
- **Périmètre :** `e2e/admin/`, `src/app/api/admin/desktop-downloads/[version]/download/route.ts`.
- **Effort estimé :** Moyen.
- **Bloquant :** Oui (pour cette route).
- **Condition de résolution :** résoudre V1.5, ou tester via `request.get` avec cookie admin manuel dans `D-ADMIN-TEST-COVERAGE`.

---

### `D-TRACEPARTS-CREDENTIALS` — TraceParts en mode mock (substitut documenté)

- **Statut :** Active
- **Cause :** pas de credentials `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY`. Le connecteur fonctionne en `mode: 'mock'` (3 produits statiques dans `src/lib/data/traceparts.ts`). L'agrégateur émet un warning `SOURCE_MOCK` structuré. L'UI affiche un badge `Mock`.
- **Substitut en place :** le connecteur CADENAS (`industrial-catalog.ts`) sert de source réelle-ish (dataset embarqué, 11 items).
- **Périmètre :** `src/lib/data/traceparts.ts`, `src/lib/connectors/traceparts.ts`.
- **Effort estimé :** Moyen.
- **Bloquant :** Non.
- **Condition de résolution :** obtenir les credentials TraceParts, passer `traceparts.ts` en `mode: 'real'`, remplacer le mock statique par l'API REST v3 réelle, tester unitaire + runtime, retirer le badge `Mock`.

---

### `D-MIGRATION-CHECKSUM-MANUAL` — Checksum migration V7-D recalculé manuellement

- **Statut :** Active (documentée)
- **Cause :** la migration `20261110215229_v7d_cadfile_request_link` a été trackée manuellement en DB (`_prisma_migrations.checksum`) lors de V7-D-2.1-fix3, puis corrigée en V7-D-2.9-fix. Le checksum est désormais aligné sur le SHA256 réel du fichier (`82d167a2...`).
- **Action future :** tout nouveau dev qui clone le repo doit lancer `migrate dev` (qui recalculera le checksum si besoin) — pas de fix manuel nécessaire.
- **Condition de résolution :** documenté pour traçabilité (pas d'action corrective requise).

---

### `D-MIGRATION-FK-ONUPDATE` — Drift FK cad_files_requestId_fkey (résolue)

- **Statut :** Résolue (V7-D-2.9-fix)
- **Cause :** la FK `cad_files_requestId_fkey` avait été appliquée sans `ON UPDATE CASCADE` (V7-D-2.1-fix2, application manuelle), puis le fichier `migration.sql` commité en V7-D-2.7 contenait `ON UPDATE CASCADE`. Drift corrigé (DB alignée sur fichier).
- **Condition de résolution :** dette fermée.

---

### `D-V8-D-4-COMPARE-VISUAL-VALIDATION` — Validation visuelle du mode Comparer non effectuée

- **Statut :** Active
- **Cause :** Les correctifs FitCamera (PR #92), OcctCompareTool (PR #91) et layout flex (PR #94) sont mergés, mais la preuve visuelle des 4 couleurs (rouge, bleu, orange, vert) n'a pas été fournie.
- **Périmètre :** Workspace mode Comparer (STEP/IGES).
- **Effort estimé :** Faible (test manuel).
- **Bloquant :** Non.
- **Condition de résolution :** Exécuter le protocole manuel (upload cube-3mm + cube-3p5mm, clic Comparer, vérification 4 couleurs, capture d'écran).

---

### `D-V8-D-5-COLLAPSIBLE-VISUAL-VALIDATION` — Validation visuelle des panneaux rétractables non effectuée

- **Statut :** Active
- **Cause :** Les panneaux Collecte et Assistant sont rétractables (WorkspaceContext + boutons PanelLeft/PanelRight, PR #97), mais la validation visuelle n'a pas été effectuée car l'upload de fichier via PowerShell 5.1 a échoué (multipart/form-data non supporté par Invoke-WebRequest).
- **Périmètre :** `src/components/workspace/WorkspaceLayout.tsx`, `ViewerZone.tsx`.
- **Effort estimé :** Faible (test manuel dans le navigateur).
- **Bloquant :** Non.
- **Condition de résolution :** Uploader un fichier STEP via l'interface, cliquer sur les boutons de toggle, vérifier que le viewport s'élargit, capturer l'écran.

---

## Basse

### `D-V2-CACHE-HIT-LATENCY-12S` — Mesure POST HIT à faire

- **Statut :** Active
- **Cause :** latence `GET /api/search` 12,76 s. Cause réelle diagnostiquée en V4-B : `GET /api/search` n'appelle jamais `aggregateSearch`, le cache n'est jamais sollicité en GET. Le correctif V4-B (`D-V2-SEARCH-GET-NO-AGGREGATE`) a routé GET vers `aggregateSearch`, mais la mesure POST HIT reste à faire.
- **Périmètre :** `src/app/api/search/route.ts`, `src/lib/connectors/aggregator.ts`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** mesure POST HIT documentée (latence cache validée).

---

### `D-WS-HISTORY-UNAUTH-REDIRECT` — `[search/history]` redirige `/login`

- **Statut :** Active
- **Cause :** `[search/history]` GET lance `NEXT_REDIRECT /login;307` quand `/workspace` est ouvert sans session.
- **Périmètre :** `src/app/api/search/history`, `src/app/workspace/`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** vérifier que `/api/search/history` répond `401 JSON` (pas redirect) sans session, ou que le client ne l'appelle pas sans session.

---

### `D-CAMPAGNE-ENCODING` — Mojibake historique (config VSCode appliquée)

- **Statut :** Active
- **Cause :** notes du registre mal encodées (UTF-8). Config VSCode appliquée ; le mojibake résiduel dans les fichiers historiques n'est pas corrigé.
- **Périmètre :** `docs/etat/`, fichiers historiques.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** encodage UTF-8 sans BOM vérifié sur les fichiers concernés, mojibake corrigé ou documenté comme historique.

---

### `D-GIT-BRANCH-HYGIENE` — 14 branches locales résiduelles

- **Statut :** Active
- **Cause :** branches issues de phases closes (V3, V4-A, V4-B, V5, V6, V8) non supprimées après merge, plus 2 branches de backup (`backup-dfb2dcf`, `backup-pre-rebase-e16`) et une branche au nom non conventionnel (`bonsoir`). Branche `refactor/v7-clean-ui` incluse (obsolète, mergée dans `master` et `origin/master`, aucun commit en avance — vérifié en 0-C-bis).
- **Périmètre :** `git branch` local (et vérification `origin` correspondant).
- **Effort estimé :** Faible (audit + suppression sélective, une session).
- **Bloquant :** Non.
- **Condition de résolution :** chaque branche est soit supprimée (si mergée et sans usage), soit documentée comme conservée avec motif. Preuve : `git branch` final + justification par branche.

---

### `D-PRISMA-MIGRATION-DRIFT-HISTORIQUE` — Lignes fantômes `_prisma_migrations` (add_analysis_data_to_part)

- **Statut :** Active
- **Cause :** 3 lignes dans `_prisma_migrations` pour la migration `20261101173317_add_analysis_data_to_part` (dont 2 avec finished_at: null, applied_steps_count: 0). **Pré-existant à V7-D**, non causé par V7-D.
- **Action future :** nettoyage manuel des lignes fantômes (hors scope V7).
- **Condition de résolution :** lignes fantômes supprimées ou documentées comme acceptées.

---

### `D-PRISMA-FORMAT-DIFF` — Bruit diff `prisma format` sur `schema.prisma`

- **Statut :** Active
- **Cause :** `prisma format` a réécrit intégralement `prisma/schema.prisma` (bruit diff dans le commit V7-D `7b2bcdc`, +1309/-684).
- **Action future :** commit séparé `chore(prisma): format` si le bruit devient gênant. **Non bloquant.**
- **Condition de résolution :** diff normalisé ou accepté.

---

### `D-ESLINT-IGNORE-DEPRECATED` — `.eslintignore` déprécié

- **Statut :** Active
- **Cause :** warning `.eslintignore` déprécié (Prisma 7 / ESLint 9). **Pré-existant**, non bloquant.
- **Action future :** migrer vers `eslint.config.mjs` `ignores` quand le temps le permettra.
- **Condition de résolution :** configuration ESLint migrée, warning absent.

---

### `D-CADFILE-DELETE` — Suppression fichier CAO import admin absente

- **Statut :** Active
- **Cause :** pas de bouton « supprimer » un fichier CAO dans `/admin/demandes/[id]/import-cad`.
- **Action future :** ajouter une Server Action `deleteCadFile` + bouton. **V7-E+.**
- **Condition de résolution :** suppression disponible et vérifiée.

---

### `D-CADFILE-XOR-GUARD` — Garde-fou XOR projectId/requestId absent

- **Statut :** Active
- **Cause :** pas de garde-fou Zod si un futur code passe `projectId` ET `requestId` simultanément à `prisma.cadFile.create`.
- **Action future :** ajouter `.refine()` dans le schéma Zod de `importCad` et `addCadFile`. **V7-E+.**
- **Condition de résolution :** garde-fou en place et testé.

---

### `D-RECONSTRUCT-UI` — Pas d'UI de reconstruction CAO

- **Statut :** Active
- **Cause :** V7-G a créé `reconstructFromCad` (backend-only), pas d'UI.
- **Périmètre :** `src/app/admin/demandes/[id]/import-cad/` (ou page dédiée).
- **Effort estimé :** Moyen.
- **Action future :** ajouter un formulaire (dimensions + matériau) qui appelle `reconstructFromCad`. **V7-H/V8.**
- **Condition de résolution :** UI disponible et testée.

---

### `D-RECONSTRUCT-PHOTOGRAMMETRY` — Photogrammétrie reportée V8

- **Statut :** Active
- **Cause :** décision (j)=A — pas de photogrammétrie en V7. Reconstruction uniquement à partir de CAO + mesures.
- **Périmètre :** V8.
- **Effort estimé :** Élevé (intégration colmap/meshroom).
- **Action future :** V8.
- **Condition de résolution :** pipeline photogrammétrie intégré et testé.

---

### `D-V8-B-0-JSON-FIELDS` — `dimensions`/`cadParams`/`analysisData` exclus de V8-B-0

- **Statut :** Active
- **Cause :** décision D2b — les 3 champs du `CreatePartTemplateSchema` sont `z.record(z.string(), z.any())`. Une string brute échoue chez Zod. Exclus de V8-B-0.
- **Périmètre :** `src/app/admin/part-templates/nouveau/part-template-form.tsx`, `src/app/admin/part-templates/[id]/editer/part-template-form.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** parseur JSON côté client + tests.

---

### `D-MIGRATION-CHECKSUM-MANUAL` — Checksum migration V7-D recalculé manuellement

### `D-PROCEDURE-LONGUEUR-PROMPTS` — Subdivision en sous-étapes

- **Statut :** Active
- **Cause :** prompts trop longs → refus de l'outil d'exécution. Subdivision actée en V8-B-0.
- **Périmètre :** `docs/gouvernance/PROCEDURE_INTERACTION.md` §5.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** acté dans §5 (fait en V8-B-0).

---

### `D-PROCEDURE-WRAPPER-KILO` — `bash` Kilo = wrapper PowerShell

- **Statut :** Active
- **Cause :** l'outil `bash` de Kilo invoque PowerShell. Autorisé en lecture/écriture.
- **Périmètre :** `docs/gouvernance/PROCEDURE_INTERACTION.md` §5.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** acté dans §5 (fait en V8-B-0).

---

### `D-GIT-STASH-RESIDUELS` — Travail E9-R3.a en attente (2 stashes)

- **Statut :** Active (travail en cours)
- **Cause :** 2 stashes contiennent du travail non commité de la session E9-R3.a (intégration desktop Tauri) :
  - stash@{0} : modification `src/components/layout/admin-sidebar.tsx` (mode Tauri, lien Téléchargements Desktop conditionnel).
  - stash@{1} : modifications desktop Tauri (`desktop/src-tauri/src/lib.rs` — commandes unifiées E9-R3.a, `package.json`, `package-lock.json` — dépendance @tauri-apps/cli).
- **Périmètre :** Intégration desktop Tauri (E9-R3.a), `.git/refs/stash` (local)
- **Effort estimé :** Moyen (finalisation ou archivage formel)
- **Bloquant :** Non
- **Condition de résolution :** Finaliser et commiter le travail E9-R3.a sur une branche dédiée, ou l'archiver, puis supprimer les stashes avec `git stash drop`.

---

### `D-V8-B-0-FIX-1-HORS-PERIMETRE` — `test-files.txt` supprimé hors périmètre

- **Statut :** Active
- **Cause :** suppression hors périmètre pendant V8-B-0-FIX-1 (F1). Tracée, non bloquante.
- **Périmètre :** racine dépôt.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** clôture manuelle (tracé).

---

### `D-V8-B-1-C-NOUVEAU-DOUBLON` — Route `/nouveau` conservée en parallèle de `/new`

- **Statut :** Active
- **Cause :** V8-B-1-c a ajouté `/admin/part-templates/new` (formulaire création) sans retirer `/admin/part-templates/nouveau` (hérité V8-B-0). Deux routes de création coexistent.
- **Périmètre :** `src/app/admin/part-templates/new/`, `src/app/admin/part-templates/nouveau/`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** déprécier/rediriger `/nouveau` vers `/new` dans une étape ultérieure (V8-B-x).

---

### `D-V8-B-1-D-SPEC-EMPLACEMENT` — Spec E2E placée dans `e2e/admin/`

- **Statut :** Active (décision (p) actée)
- **Cause :** V8-B-1-d a placé la spec `admin-part-templates.spec.ts` dans `e2e/admin/` (pas racine `e2e/`). Justification : seul le projet Playwright `admin` injecte `storageState: '.auth/admin.json'`. Une spec à la racine tournerait sur le projet `chromium` sans auth admin → tests en 401.
- **Périmètre :** `e2e/admin/`, `playwright.config.ts`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** décision (p) ajoutée dans DECISIONS.md. Retirer de DETTES.md au merge du PR de clôture V8-B-1-e.

---

### `D-PROCEDURE-DECOUPAGE-SOUS-ETAPES` — Découpage strict des prompts

- **Statut :** Active
- **Cause :** réforme du 2026-11-11 (Mode R2). Les prompts doivent être divisés en étapes et sous-étapes, avec validation intermédiaire obligatoire.
- **Condition de résolution :** procédures `PROCEDURE_INTERACTION.md` §13 et `PROCEDURE_COORDINATEUR.md` §6 actées.

---

### `D-WORKSPACE-LAYOUT-CSS` — Layout CSS source de bugs

- **Statut :** Active
- **Cause :** `grid-cols-[1fr_2fr_1fr]` ne s'appliquait pas correctement (Tailwind 4). Le layout a été stabilisé en `flex` avec `w-1/4, w-2/4, w-1/4`.
- **Périmètre :** `src/components/workspace/WorkspaceLayout.tsx`.
- **Effort estimé :** Faible.
- **Bloquant :** Non.
- **Condition de résolution :** Documenter la solution retenue (flex) dans DECISIONS.md (aa). Ne plus utiliser `grid-cols-[1fr_2fr_1fr]`.

### `D-V8-D-5-ASSISTANT-LLM-REAL` — Assistant IA en mode squelette (pas de LLM réel)

- **Statut :** Active
- **Cause :** L'assistant IA (TÂCHE 2) est un squelette : `AI_MOCK` court-circuite le fournisseur réel (`route.ts` l.9-11), et le seul mock E2E est `page.route('**/api/ai/chat')` (`assistant-chat.spec.ts` l.4). Aucun appel LLM réel n'est effectué.
- **Périmètre :** `src/app/api/ai/chat/route.ts`, `src/lib/ai/providers.ts`, `src/lib/ai/groq-client.ts`.
- **Effort estimé :** Moyen (branchement provider réel + gestion erreurs + tests).
- **Bloquant :** Non.
- **Condition de résolution :** appel LLM réel fonctionnel (Groq ou autre), testé manuellement et en E2E avec un provider mocké.

---

### `D-CHAT-TESTABILITY` — Textarea chat non pilotable par fill/pressSequentially

- **Statut :** Active
- **Cause :** Le textarea de `ChatInput` n'est pas pilotable par `fill`/`pressSequentially` (tracker React) → `onChange` non déclenché. Contournement : setter natif `HTMLTextAreaElement.prototype` + `input` event + `waitForChatHydrated` (`__reactProps`) dans `e2e/workspace/assistant-chat.spec.ts` l.13-24. Couplage aux internes React.
- **Périmètre :** `src/components/workspace/ChatInput.tsx`, `e2e/workspace/assistant-chat.spec.ts`.
- **Effort estimé :** Faible (ajout `data-testid` ou `type()` post-hydratation).
- **Bloquant :** Non.
- **Condition de résolution :** textarea pilotable par Playwright sans setter natif (data-testid + `type()`), spec simplifiée.

---

### `D-V8-D-5-USE-AI-CHAT-UNIFY` — Double implémentation chat (fetch direct vs useAiChat)

- **Statut :** Active
- **Cause :** Deux chemins clients vers `/api/ai/chat` : `AssistantZone.tsx` l.60 (`handleSend`, fetch direct) et l.232 (`handleGenerateFiche`), **et** `src/lib/ai/use-ai-chat.ts` l.139 (hook non branché). Unification non faite (décision §4.b = garder fetch direct).
- **Périmètre :** `src/components/workspace/AssistantZone.tsx`, `src/lib/ai/use-ai-chat.ts`.
- **Effort estimé :** Moyen (migration vers `useAiChat` + suppression fetch direct + tests).
- **Bloquant :** Non.
- **Condition de résolution :** un seul chemin client vers `/api/ai/chat` (`useAiChat`), `AssistantZone` migré, tests E2E verts.

---

### `D-REGISTRE-ETAT-NETTOYAGE` — Nettoyage global du registre DETTES.md (violations §10)

- **Statut :** Active
- **Cause :** `DETTES.md` viole §10 (« dettes non résolues uniquement ») sur au moins 8 entrées + 1 triplon + 1 anomalie structurelle :
  - triplon `D-MIGRATION-CHECKSUM-MANUAL` (L13 orphelin / L72 / L245) ;
  - entrées résolues encore listées : `D-MIGRATION-FK-ONUPDATE` (L81), `D-V8-B-1-C-FORM-ACTION-INLINE` (PR #48 mergée), `D-WORKSPACE-LAYOUT-CSS` (condition = décision (aa) `DECISIONS.md:325`), `D-V8-B-1-D-SPEC-EMPLACEMENT` (décision (p) `DECISIONS.md:315`), `D-PROCEDURE-LONGUEUR-PROMPTS`, `D-PROCEDURE-WRAPPER-KILO`, `D-PROCEDURE-DECOUPAGE-SOUS-ETAPES` ;
  - anomalie structurelle : heading L13 orphelin (sans corps), séparateurs `---` manquants.
- **Périmètre :** `docs/etat/DETTES.md`.
- **Effort estimé :** Faible (diff auditable dédié).
- **Bloquant :** Non.
- **Condition de résolution :** registre conforme §10 (aucune entrée résolue, aucun doublon, structure valide), diff auditable, preuve brute.

---

### `D-AI-MOCK-NON-CABLÉ` — Drapeau AI_MOCK non câblé en E2E ni en .env.example

- **Statut :** Active
- **Cause :** `AI_MOCK` n'apparaît **que** dans `route.ts:9` (seule occurrence du dépôt). Absent de `.env`, `.env.local`, `.env.test`, `.env.example`, et absent de `playwright.config.ts:102-109` (`webServer.env`). Le drapeau est **inactivable** en E2E comme en `.env.example` — seul `page.route('**/api/ai/chat')` mocke réellement en test.
- **Périmètre :** `src/app/api/ai/chat/route.ts`, `playwright.config.ts`, `.env.example`.
- **Effort estimé :** Faible (documenter `AI_MOCK` dans `.env.example` ou retirer le drapeau).
- **Bloquant :** Non.
- **Condition de résolution :** `AI_MOCK` soit documenté dans `.env.example`, soit retiré de `route.ts` (remplacé par `page.route` seul).

---

## Notes

- **Registre actif uniquement** (charte §10). Les dettes résolues ne figurent pas ici.
- **Actions critiques (non dettes) :** voir `ETAT_COURANT.md` §« Actions critiques » (mot de passe admin, hook BOM, `$env:ADMIN_PASSWORD`).
- **Source :** v10 §3 (2026-11-10). Toute modification ultérieure nécessite un arbitrage du coordinateur.
- **Historique :** `git log -- docs/etat/DETTES.md` + `git show <commit>:docs/etat/DETTES.md`.
- **Note :** `D-PROCEDURE-HEAD-FAUX` n'a jamais été créée formellement dans ce registre (proposée en préambule V8-B-1, non tracée dans PR #45). Rien à clôturer. Le correctif physique (réinitialisation sur `ed28d74`) a été effectué directement par l'exécutant.
