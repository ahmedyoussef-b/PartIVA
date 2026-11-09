# DÉCISIONS VALIDÉES — PartIVA

**Dernière mise à jour :** 2026-11-10
**Source :** Création E3-S3 (référencé par `ETAT_COURANT.md` §5) ; synchronisation 2026-11-10 (session DOC-SYNC).
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
| **C3** | V7-A réellement commitée ? | **(b)** Preuve git exigée avant ouverture V7 | L'IA interne doit fournir le hash du commit V7-A. Sans preuve, Étape 2 suspendue (L50). |

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
- **Décision :** Dans `Select-String`, les métacaractères regex (`?`, `*`, `+`, `[`, `]`, `(`, `)`, `{`, `}`, `|`, `\`) doivent être échappés (`\?`) ou placés entre crochets (`[?]`), ou utiliser `-SimpleMatch` quand pertinent. Ne jamais coller de contenu Markdown/texte contenant `[ ] :: \` ? * \`` dans le terminal PowerShell — passer par un fichier temporaire ou une commande dédiée.
- **Justification :** En 1-C, un `?` non échappé a provoqué `Quantificateur {x,y} ne suivant rien` ; un collage accidentel de la leçon L55 a provoqué des erreurs de parsing. Les deux étaient des erreurs de commande, pas du fichier.
- **Conséquences :** L57 actée. Les patterns `Select-String` des prompts suivants sont corrigés.

---

## 7. Leçons (L45 → L57)

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
- **L57** — Dans `Select-String`, les métacaractères regex (`?`, `*`, `+`, `[`, `]`, `(`, `)`, `{`, `}`, `|`, `\`) doivent être **échappés** (`\?`) ou placés entre crochets (`[?]`), ou utiliser `-SimpleMatch` quand pertinent. Un `?` non échappé provoque une erreur `Quantificateur {x,y} ne suivant rien`. Ne jamais coller de contenu Markdown/texte contenant `[ ] :: \` ? * \`` directement dans le terminal PowerShell.

---

## 8. Notes

- **Mise à jour :** Les nouvelles décisions sont ajoutées ici après validation par le coordinateur.
- **Référence :** `ETAT_COURANT.md` §5 renvoie à ce fichier pour les décisions opérationnelles.
- **Archivage :** Les décisions obsolètes sont conservées ici (pas d'archivage séparé).
- **Traçabilité :** Les décisions E16 → E26 sont conservées intégralement (charte §9). Les décisions V3–V8, Q1–Q6, C1–C3, et les leçons L51–L57 sont ajoutées le 2026-11-10.
