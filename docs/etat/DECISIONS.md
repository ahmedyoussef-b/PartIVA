# DÉCISIONS VALIDÉES — PartIVA

**Dernière mise à jour :** 2026-11-11
**Source :** Création E3-S3 (référencé par `ETAT_COURANT.md` §5) ; synchronisation 2026-11-10 (session DOC-SYNC) ; ouverture V7 (session V7-OUVERTURE) ; clôture V7-B (session V7B) ; clôture V8-B-1 (session V8-B-1, PRs #46, #47, #48).
**Statut :** Registre des décisions validées.

---

## 1. Décisions techniques (E16 → E26 — historique conservé)

### `D-E16-STEP-1` — Viewer STEP/IGES via occt-import-js

- **Date :** E16-R0b (cadrage) → E16-R1 (2026-10-19)
- **Décision :** Utiliser `occt-import-js` pour le support STEP/IGES dans le visualiseur 3D.
- **Justification :** Seule bibliothèque documentée pour STEP/IGES navigateur, sortie compatible Three.js.
- **Conséquences :** `CadViewer` créé, `ModelViewer` auto-détection, fixtures STEP/IGES, tests E2E.

### `D-E18-AUDIT-1` — Routes API `/api/audit` et `/api/materials`

- **Date :** E18-R1 (2026-10-20)
- **Décision :** Créer les routes API manquantes pour les pages admin audit et matériaux.
- **Justification :** Les getters `getAuditLogs()` et `getMaterials()` appelaient des routes inexistantes.
- **Conséquences :** Routes créées, fallbacks ajoutés dans `data-client.ts`.

### `D-E22-UI-1` — Refonte dashboard (KPI, 3D 2 colonnes)

- **Date :** E22-R1 (2026-10-21)
- **Décision :** Refondre le dashboard avec des KPI modernes et intégrer la 3D dans une disposition 2 colonnes.
- **Justification :** UI/UX inacceptable, 3D cachée derrière un onglet.
- **Conséquences :** `KpiCard` corrigé, layout 2 colonnes, `viewer-shell.tsx` créé.

### `D-E23-CRUD-1` — Page `/admin/pieces/nouveau`

- **Date :** E23-R1 (2026-10-21)
- **Décision :** Créer la page de création de pièce avec formulaire minimal (partNumber, name, description).
- **Justification :** Le bouton "Nouvelle pièce" redirigeait vers une route inexistante.
- **Conséquences :** Page créée, formulaire fonctionnel, API sécurisée (`requireAdmin`).

### `D-E24-PRISMA-1` — Pool Prisma explicite + `onPoolError`

- **Date :** E24-R1 (2026-10-21)
- **Décision :** Configurer explicitement le pool Prisma avec `connectionTimeoutMillis: 10_000` et `onPoolError`.
- **Justification :** Timeout sporadique sur le pooler Neon.
- **Conséquences :** Trace des erreurs pool, fail-fast à 10s.

### `D-E24-E2E-1` — Credentials E2E auto-suffisants

- **Date :** E24-R2 (2026-10-21)
- **Décision :** Aligner le seed sur `ADMIN_PASSWORD` pour les comptes E2E, et charger `dotenv` dans `playwright.config.ts`.
- **Justification :** Les tests USER/VIEWER échouaient en 401.
- **Conséquences :** 4 setups passent, fixture auto-suffisant.

---

## 2. Décisions de gouvernance (E26 — historique conservé)

### `D-E26-REFORME-1` — Réforme de la procédure de coopération

- **Date :** E26 (2026-10-21)
- **Décision :** Réformer l'infrastructure documentaire pour accélérer la coopération.
- **Justification :** Procédure actuelle trop lente (frictions de preuve, granularité trop fine, redondance documentaire).
- **Conséquences :** Création de `docs/gouvernance/`, `docs/modeles/`, `docs/etat/`, `docs/sessions/`.

### `D-E26-DETTES-1` — Scission `DEBT.md` en `DETTES.md` + archive

- **Date :** E3-S2 (2026-10-21) — *référence historique : scission `DEBT.md` → `DETTES.md` effectuée en E3-S2 ; conservée telle quelle par la réforme E26.*
- **Décision :** Séparer les dettes actives (dans `DETTES.md`) de l'historique des dettes clôturées (dans `DEBT_HISTORIQUE.md`).
- **Justification :** `DEBT.md` mélangeait actif et historique, contredisant la charte §10.
- **Conséquences :** `DETTES.md` (6 actives à l'époque), `DEBT_HISTORIQUE.md` (30 clôturées), `DEBT.md` archivé dans `docs/archive/DEBT.md` (E6).

---

## 3. Décisions V3, V4, V5, V6, V8 (synchronisation 2026-11-10)

### `V3` — OpenSERP (CLI puis HTTP)

- **Date :** 2026-11-07 (clôture).
- **Décision :** Connecteur OpenSERP (Bing) livré en HTTP pur, CLI abandonné.
- **Justification :** HTTP pur plus simple, plus testable.
- **Conséquences :** 3 dettes fermées (`D-V2-OPENSERP-NOT-IMPLEMENTED`, `D-V3-OPENSERP-CLI-ONLY`, `D-V13A-NAVIGATION-NOT-CLICKABLE`). `D-V3-OPENSERP-GOOGLE-CAPTCHA` reste ouverte (Google/Yandex/Ecosia/DDG bloqués, seul Bing fonctionne).

### `V4-A` — Auth validity + deep mode Playwright

- **Date :** 2026-11-07 (clôture).
- **Décision :** Validation runtime de l'auth (`get-session`), correction du deep mode Playwright (`waitForTimeout(500)`).
- **Justification :** `D-CAMPAIGN-CHECK-AUTH-VALIDITY` faux-positif/faux-négatif ; `D-E57-DEEP-MODE-PLAYWRIGHT` 2 tests fixme.
- **Conséquences :** 2 dettes fermées. `D-V14-ADMIN-DOWNLOAD-AUTH-BLOCKED` reclassée (bloquée V1.5).

### `V4-B` — Cache web (collision, GET aggregate, enabled option)

- **Date :** 2026-11-07 (clôture).
- **Décision :** Correctifs cache : hash `source+limit`, GET routé vers `aggregateSearch`, option `SEARCH_CACHE_ENABLED`.
- **Justification :** `D-V2-CACHE-KEY-COLLISION`, `D-V2-SEARCH-GET-NO-AGGREGATE`, `D-V2-CACHE-ENABLED-OPTION`.
- **Conséquences :** 3 dettes fermées.

### `V5` — Recherche multi-sources

- **Date :** 2026-11-07 (clôture).
- **Décision :** Multi-sources complet : UI `aggregateSearch` (V5-A), connecteur `geometric` (V5-B), TraceParts mock documenté (V5-C), E2E (V5-D), step.parts dynamique (V5-C-bis), CADENAS dynamique (V5-C-ter).
- **Justification :** Achèvement data réelle.
- **Conséquences :** `D-TRACEPARTS-CREDENTIALS` reste ouverte (mock documenté, badge UI).

### `V6` — Reset password (web + SMTP)

- **Date :** 2026-11-07 (clôture).
- **Décision :** Flux "mot de passe oublié" réel : SMTP via `nodemailer`, tokens 1 h, pages forgot/reset, anti-énumération.
- **Justification :** `D-AUTH-PASSWORD-RESET` — le lien pointait vers un mock.
- **Conséquences :** Dette fermée, testée runtime. Risque tracé : si `SMTP_HOST` absent en prod, le lien est loggé en clair.

### `V8` — Smart Router + Vue Hybride + Filtres + Bug fix

- **Date :** 2026-11-09 (clôture, PR #18 `c0c86a2`).
- **Décision :** Smart Router (aiguillage par source + fallback), validation formulaire client (toast + bordures rouges), Vue Hybride (Galerie + Tableau), Filtres avancés + "Charger plus", Bug fix filtres toujours visibles (L47).
- **Justification :** Catalogue dynamique.
- **Conséquences :** V8 close (PR #18 mergée). Leçon L47 actée.

---

## 4. Décisions Q1–Q6 (arbitrage du 2026-11-09)

| # | Question | Décision validée | Conséquence |
|---|---|---|---|
| **Q1** | Base de reprise | **(a)** Reprise sur `master` @ `c0c86a2` | Le prompt v4.0 est requalifié : état antérieur au merge PR #18. |
| **Q2** | Branche V8 / branche V7-B | **(a)** Supprimer `feat/v8-candidate-gallery` (local + origin) ; créer `feat/v7b-workspace-ia` depuis `master` | Respecte L46. Exécuté en 0-B/0-C/0-D. |
| **Q3** | Statut V7 | **(b)** Ouvrir V7 par un commit/PR dédié **avant** V7-B | Voir C3 : preuve git exigée. |
| **Q4** | Divergence documentaire | **(a)** Mettre à jour les 4 docs avant V7-B | Session documentaire préalable obligatoire. Exécutée en 1-A/1-B/1-C/1-D. |
| **Q5** | `PROMPT_DE_REPRISE.md` en `M` | **(a)** Commiter le fichier avant reprise | Exécuté en 0-A (`823103a`). |
| **Q6** | Mot de passe admin compromis | **(b)** — **requalifié par C1(a)** | Voir C1 : action critique non-dette. |

---

## 5. Décisions C1–C3 (arbitrage du 2026-11-10)

| # | Question | Décision validée | Conséquence |
|---|---|---|---|
| **C1** | Statut du mot de passe admin | **(a)** La v10 prime : action critique non-dette | **Q6(b) est requalifié en Q6(a')**. Le mot de passe admin figure dans `ETAT_COURANT.md` §« Actions critiques », **pas** dans `DETTES.md`. |
| **C2** | Date de référence | **(a)** Date = 2026-11-10 | Le prompt v11 est daté 2026-11-10. |
| **C3** | V7-A réellement commitée ? | **(b)** Preuve git exigée avant ouverture V7 | L'IA interne doit fournir le hash du commit V7-A. Sans preuve, Étape 2 suspendue (L50). **Prouvée en 2-A/2-A-bis : `530a0f3` + `recherche-client.tsx`.** |

**Note de requalification :** Q6(b) (dette suivie dans `DETTES.md`) est **remplacé** par C1(a) (action critique dans `ETAT_COURANT.md`). Les deux décisions sont conservées ici pour traçabilité (charte §9).

---

## 6. Décisions de méthode (Bloc 0 et Bloc 1, 2026-11-09 → 2026-11-10)

### `D-OBS1-GIT-BRANCH-HYGIENE` — Tracer `D-GIT-BRANCH-HYGIENE`

- **Date :** 2026-11-09.
- **Décision :** Tracer la dette `D-GIT-BRANCH-HYGIENE` (Basse) pour les 14 branches locales résiduelles, incluant `refactor/v7-clean-ui` (obsolète, mergée, aucun commit en avance — vérifié en 0-C-bis).
- **Justification :** Hygiène git, éviter la réutilisation accidentelle (L46).
- **Conséquences :** Dette ajoutée dans `DETTES.md` (1-B).

### `D-OBS3-REFACTOR-V7-CLEAN-UI` — Vérifier `refactor/v7-clean-ui` avant 0-D

- **Date :** 2026-11-09.
- **Décision :** Vérifier `refactor/v7-clean-ui` avant 0-D (fait en 0-C-bis), l'inclure dans `D-GIT-BRANCH-HYGIENE`, ne pas créer de dette séparée (sobriété §14).
- **Justification :** Éviter la sur-granularité.
- **Conséquences :** Branche vérifiée obsolète, incluse dans la dette globale.

### `D-L56-METHODE` — Méthode d'édition des fichiers Markdown volumineux

- **Date :** 2026-11-10.
- **Décision :** Pour les fichiers Markdown > 100 lignes, fournir le **fichier complet** et l'écrire via `[System.IO.File]::WriteAllText` (UTF-8 sans BOM), plutôt que des `.Replace()` ciblés.
- **Justification :** 1-A, 1-A-fix, 1-A-redo ont échoué (mojibake, `.Replace()` silencieusement ignorés). 1-A-redo-bis et 1-B ont réussi avec cette méthode.
- **Conséquences :** L56 actée. Appliquée à 1-B, 1-C, 1-D.

### `D-L57-SELECTSTRING` — Échappement des métacaractères regex dans `Select-String`

- **Date :** 2026-11-10.
- **Décision :** Dans `Select-String`, les métacaractères regex (`?`, `*`, `+`, `[`, `]`, `(`, `)`, `{`, `}`, `|`, `\`) doivent être échappés (`\?`) ou placés entre crochets (`[?]`), ou utiliser `-SimpleMatch` quand pertinent. Ne jamais coller de contenu Markdown/texte contenant `` [ ] :: ` `` `?` `*` `\` dans le terminal PowerShell — passer par un fichier temporaire ou une commande dédiée.
- **Justification :** En 1-C, un `?` non échappé a provoqué `Quantificateur {x,y} ne suivant rien` ; un collage accidentel de la leçon L55 a provoqué des erreurs de parsing.
- **Conséquences :** L57 actée. Les patterns `Select-String` des prompts suivants sont corrigés.

### `D-L58-MERGE-COMMITS` — `git show --name-only` sur merge commit

- **Date :** 2026-11-10.
- **Décision :** `git show --name-only` sur un **merge commit** ne liste **aucun fichier**. Pour vérifier le contenu d'un merge, utiliser `git diff --name-only <merge>^1 <merge>` (diff par rapport au premier parent).
- **Justification :** En 1-F, `git show --name-only` sur `11cc1f8` (merge PR #19) n'a listé aucun fichier ; `git diff --name-only HEAD^1 HEAD` a listé les 5 fichiers.
- **Conséquences :** L58 actée. L51 ne s'applique qu'aux commits **non-merge**.

### `D-L59-POWERSHELL-GLOBSTAR` — `Select-String` et `**` en PowerShell 5.1

- **Date :** 2026-11-10.
- **Décision :** En PowerShell 5.1, `Select-String -Path "**/*.tsx"` ne fonctionne pas (pas de globstar). Utiliser `Get-ChildItem -Path <dir> -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "..." -SimpleMatch`. Ne jamais laisser de placeholder `<hash>` dans une commande — le remplacer par le hash réel avant exécution.
- **Justification :** En 2-A-bis, `Select-String` avec `**` n'a trouvé qu'une occurrence sur cinq ; le fallback `Get-ChildItem` a trouvé les cinq. `git show <hash>` a échoué (placeholder non substitué).
- **Conséquences :** L59 actée. Les prompts suivants utilisent le fallback `Get-ChildItem`.

---

## 7. Leçons (L45 → L59)

- **L45** — `prettier --check` échoue souvent sur les fichiers modifiés par l'IA interne → toujours `prettier --write` avant commit.
- **L46** — Les commits poussés après le merge d'une PR nécessitent une **nouvelle PR** (ne pas réutiliser la branche supprimée).
- **L47** — Les filtres doivent **toujours rester visibles** (même à 0 résultat) pour permettre la réinitialisation.
- **L48** — `applySmartRoutes` / `aggregateSearchRouted` ne réutilise pas le cache de `_aggregateSearchInternal` → à renforcer.
- **L49** — `prisma migrate dev` échoue si le pooler est down (P1000) → utiliser `prisma db execute --file` pour appliquer la migration SQL manuellement.
- **L50** — Un rapport d'IA interne **n'est pas une preuve**. Toujours exiger les sorties brutes (`git log`, `TSC EXIT`, `ESLINT EXIT`, `curl`).
- **L51** — Un `git add` malformé (chemin inexistant, faute de frappe) est rejeté silencieusement par git, mais le commit peut réussir si le fichier était déjà indexé. Seul `git show --name-only <hash>` prouve le contenu réel d'un commit. **Toujours vérifier `git show --name-only` après chaque commit.**
- **L52** — `git branch <nom>` **crée** une branche sans y basculer. `git checkout -b <nom>` **crée et bascule**. Un prompt qui dit « créer la branche depuis `master` » doit préciser **explicitement** le basculement, et la preuve doit inclure `git branch --show-current` = nom de la branche.
- **L53** — Une preuve de lecture (`Get-Content`) doit être fournie **avant** la modification, pas après. Si le `git status --short` initial montre déjà le fichier modifié, la preuve R1 est invalide : restaurer et recommencer.
- **L54** — Un `git diff` **vide** après édition signifie que **rien n'a été modifié**. Avant de déclarer une étape close, vérifier que `git diff <fichier>` est **non vide** et que `git status --short` montre bien ` M <fichier>`. Ne jamais utiliser `git checkout --` / `git restore` pour « repartir de zéro » sans sauvegarde.
- **L55** — `Set-Content -Encoding UTF8` sur PowerShell 5.1 réencode le fichier et corrompt les accents (`é` → `�`). Utiliser `[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))`. `.Replace()` de .NET échoue **silencieusement** si la chaîne recherchée diffère d'un seul caractère.
- **L56** — Pour les fichiers Markdown > 100 lignes, **fournir le fichier complet** et l'écrire en une seule fois via `WriteAllText` (UTF-8 sans BOM), plutôt que des `.Replace()` ciblés. Vérifier avec `Format-Hex` (pas de BOM) et `Select-String` (contenu attendu).
- **L57** — Dans `Select-String`, les métacaractères regex (`?`, `*`, `+`, `[`, `]`, `(`, `)`, `{`, `}`, `|`, `\`) doivent être **échappés** (`\?`) ou placés entre crochets (`[?]`), ou utiliser `-SimpleMatch` quand pertinent. Un `?` non échappé provoque une erreur `Quantificateur {x,y} ne suivant rien`. Ne jamais coller de contenu Markdown/texte contenant `` [ ] :: ` `` `?` `*` `\` directement dans le terminal PowerShell.
- **L58** — `git show --name-only` sur un **merge commit** ne liste **aucun fichier** (le merge n'a pas de diff propre). Pour vérifier le contenu d'un merge, utiliser `git diff --name-only <merge>^1 <merge>` (diff par rapport au premier parent). L51 ne s'applique qu'aux commits **non-merge**.
- **L59** — En PowerShell 5.1, `Select-String -Path "**/*.tsx"` ne fonctionne pas (pas de globstar). Utiliser `Get-ChildItem -Path <dir> -Recurse -Include "*.tsx","*.ts" | Select-String -Pattern "..." -SimpleMatch`. Ne jamais laisser de placeholder `<hash>` dans une commande — le remplacer par le hash réel avant exécution.

---

## 8. Notes

- **Mise à jour :** Les nouvelles décisions sont ajoutées ici après validation par le coordinateur.
- **Référence :** `ETAT_COURANT.md` §5 renvoie à ce fichier pour les décisions opérationnelles.
- **Archivage :** Les décisions obsolètes sont conservées ici (pas d'archivage séparé).
- **Traçabilité :** Les décisions E16 → E26 sont conservées intégralement (charte §9). Les décisions V3–V8, Q1–Q6, C1–C3, et les leçons L51–L59 sont ajoutées le 2026-11-10.

---

## 9. V7 — Ouverture formelle (2026-11-10)

### `D-V7-A-PROUVEE` — V7-A (Catalogue) fonctionnellement réalisée

- **Date :** 2026-11-10 (session V7-OUVERTURE).
- **Décision :** V7-A (Catalogue) est **fonctionnellement réalisée**. Preuves : `src/app/admin/demandes/[id]/recherche/recherche-client.tsx` (libellé « Recherche Multi-Sources » l. 340, `SearchState` l. 93, `setSearchState('running')` l. 183/232, `fetch('/api/search')` l. 245, `fetch('/api/search/photo')` l. 191) + commit `530a0f3` (`feat(V5-A): brancher l'UI Recherche Multi-Sources sur aggregateSearch`).
- **Justification :** C3(b) exigeait une preuve git de V7-A. La vérification UI/code (2-A-bis) a prouvé que le parcours existe fonctionnellement. Pas de commit dédié `V7-A` — couverture V5-A/V8.
- **Conséquences :** V7 est **ouverte formellement**. V7-B (Workspace IA) est la **prochaine étape**. Aucune requalification de V7-A en « à faire ».

### `D-V7-OUVERTURE` — Ouverture formelle de V7

- **Date :** 2026-11-10 (session V7-OUVERTURE).
- **Décision :** V7 (Reconstruction de pièce) est **ouverte formellement**. V7-A est prouvée, V7-B est la prochaine étape, V7-C/V7-D/V7-E restent à faire.
- **Justification :** Q3(b) exigeait une ouverture formelle de V7 avant V7-B. C3(b) exigeait une preuve V7-A. Les deux sont satisfaites.
- **Conséquences :** `ETAT_COURANT.md` reflète V7 ouverte. `INDEX.md` sera mis à jour en 2-C. V7-B peut démarrer après validation du coordinateur et production du plan détaillé.

---

## 10. V7-B — Clôture (2026-11-10)

### `D-V7B-CLOSED` — V7-B (Workspace IA) close

- **Date :** 2026-11-10 (session V7B).
- **Décision :** V7-B (Workspace IA) est **close**. Les 6 sous-tâches (V7B-1 → V7B-6) sont **validées** par le coordinateur, avec preuves brutes et 3 checks CI verts à chaque PR.
- **Justification :** V7B-1 (bouton Workspace + pré-chargement), V7B-2 (libellé Analyser + affichage dimensions), V7B-3 (libellé Reconstruire + export STL), V7B-4 (viewer 3D data URL STL), V7B-5 (validation + persistance), V7B-6 (tests). 6 commits, 6 PR mergées.
- **Conséquences :** V7-C (Reverse CAO) devient la **prochaine étape** de V7. V7-B est **close**, aucune réouverture sans arbitrage.
- **Preuves :**
  - V7B-1 : commit `9241a91`, PR #22 mergée `5e4ba47`.
  - V7B-2 : commit `680eaa0`, PR #23 mergée `aefd372`.
  - V7B-3 : commit `5b9d7db`, PR #24 mergée `b2c7b93`.
  - V7B-4 : commit `2388d61`, PR #25 mergée `61f2dd5`.
  - V7B-5 : commit `c01a2f5`, PR #26 mergée `0f8600b`.
  - V7B-6 : commit `daaa957`, PR #28 mergée `eb798c0`.

### `D-V7B-METHODE` — Méthode V7-B (par sous-tâches)

- **Date :** 2026-11-10.
- **Décision :** V7-B a été exécutée en **6 sous-tâches atomiques** (V7B-1 → V7B-6), chacune avec son prompt unitaire, ses preuves brutes, son commit et sa PR. **Aucune sous-tâche n'a été validée sans preuves brutes.**
- **Justification :** La granularité a permis d'isoler les erreurs (V7B-4 : TSC manquant ; V7B-6 : travail non fait sur la bonne branche) et de corriger sans casser le reste.
- **Conséquences :** Méthode à réutiliser pour V7-C, V7-D, V7-E.

---

## 11. V7-C → V7-H — Clôture (2026-11-10 → 2026-11-11)

### `D-V7C-CLOSED` — V7-C (Reverse CAO) close

- **Date :** 2026-11-10
- **Décision :** V7-C est **close**. Reverse CAO déjà fonctionnel (aucun code V7-C à ajouter).

### `D-V7D-CLOSED` — V7-D (Import CAO) close

- **Date :** 2026-11-10
- **Décision :** V7-D est **close**. PR #32 mergée (`73fedcf`). Migration `20261110215229_v7d_cadfile_request_link`. Route `/api/upload/cad`. Page `/admin/demandes/[id]/import-cad`. Bouton activé (ligne 212).

### `D-V7E-CLOSED` — V7-E (Orchestrateur) close

- **Date :** 2026-11-11
- **Décision :** V7-E est **close**. PR #34 mergée (`2627203`). Bouton « Lancer séquentiel » + bandeaux « Étape N/4 » dans les 4 méthodes. Non-intrusif (accès direct conservé).

### `D-V7F-CLOSED` — V7-F (Capitalisation BDD) close

- **Date :** 2026-11-11
- **Décision :** V7-F est **close**. PR #35 mergée (`a0ba816`). Tables `part_templates` + `solutions` (migration `20261111103515`). Server Actions CRUD (part-templates.ts + solutions.ts). Backend-only (pas d'UI).

### `D-V7G-CLOSED` — V7-G (Reconstruction CAO) close

- **Date :** 2026-11-11
- **Décision :** V7-G est **close**. PR #36 mergée (`580b87c`). Server Action `reconstructFromCad` (transaction atomique, confidence 85). 7 tests unitaires. Backend-only.

### `D-V7H-EN-COURS` — V7-H (Clôture doc) en cours

- **Date :** 2026-11-11
- **Décision :** V7-H est **en cours**. Décisions (l)=A (doc minimale), (m)=A (pas de tag).

### Décisions clés V7

| ID | Valeur |
| --- | --- |
| (d) | Orchestrateur = bouton + redirect + flag `?sequential=1` (non-intrusif) |
| (e) | Régénérer `migration.sql` avec `ON UPDATE CASCADE` (fait V7-D-2.9-fix) |
| (f) | `PartTemplate` + `Solution` séparés, `method/sourceMethod` String (enum Zod) |
| (g) | Backend-only (pas d'UI en V7-F/G) |
| (i) | Reconstruction backend-only (`reconstructFromCad`) |
| (j) | Zéro photogrammétrie (reportée V8) |
| (k) | `Solution.confidence = 85` par défaut |
| (l) | V7-H = doc minimale (5 fichiers) |
| (m) | Pas de tag (V7 est un incrément) |

---

## 12. Décisions clés V8

| ID | Valeur |
| --- | --- |
| (p) | Specs E2E admin → emplacement `e2e/admin/` (seul projet Playwright injecte `storageState`). Toute nouvelle spec admin DOIT y être placée. |
| (q) | PROPOSITION (non actée) : 3 checks R3 nécessaires mais non suffisants pour UI interactives — proposer un smoke test Playwright minimal pour les sous-étapes UI futures. À arbitrer en V8-B-2 ou ultérieur. |
| (r) | Schémas Zod Reverse Engineering : utiliser `z.string().cuid()` (et non `uuid()`) pour tous les ID Prisma. |
| (s) | Accessibilité label : tout `<Label>` doit avoir `htmlFor` et l'`<Input>` associé un `id` (pour `getByLabel` et l'accessibilité). |
