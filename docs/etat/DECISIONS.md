# DÉCISIONS VALIDÉES — PartIVA

**Dernière mise à jour :** 2026-11-15
**Source :** Création E3-S3 (référencé par `ETAT_COURANT.md` §5) ; synchronisation 2026-11-10 (session DOC-SYNC) ; ouverture V7 (session V7-OUVERTURE) ; clôture V7-B (session V7B) ; clôture V7-C → V7-H (session V7H).
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

## 7. Leçons (L45 → L87)

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
- **L60** — Pas de backtick `` ` `` dans les chaînes à guillemets doubles ; utiliser `[char]96`. (Déjà appliquée, consignée ici pour cohérence de registre.)
- **L61** — En Mode R2, si le prompt unitaire et le READY sont reçus dans le même tour, l'IA interne signale l'écart dans l'accusé et poursuit.
- **L62** — Si un prompt unitaire référence un prompt antérieur (« cf. S1 »), l'IA externe doit le joindre à nouveau ou fournir le hash du tour. Un renvoi sans jointure ni hash est ambigu et peut conduire à une exécution partielle.
- **L63** — `webServer.timeout` (Playwright) plafonne le démarrage du serveur (`npm run build && npm run start`), pas la durée de la suite. Mesurer le bon poste (durée du build) avant de conclure sur un timeout.
- **L64** — `Get-Content -Tail` seul produit du mojibake en PS 5.1 (faux positif d'encodage). Pour l'intégrité accents : `ReadAllText(..., UTF8)`.
- **L65** — Un grep de mot-clé sans contexte sémantique est un faux positif (« abandon » l.77 = abandon du statique, pas du sidecar). Vérifier la phrase.
- **L66** — Une preuve d'existence n'est pas une preuve de contenu : ouvrir le fichier si son contenu est invoqué (`build-server.cjs`).
- **L67** — Une valeur qui semble fautive peut être un choix commité : `git show` du commit d'origine avant de qualifier de « régression » (`frontendDist`, 60af0f1).
- **L68** — Une correction factuelle dans un prompt doit elle-même être vérifiée contre le code : ne pas remplacer une erreur par une autre.
- **L69** — Une correction de qualification doit s'appliquer à toutes les occurrences du terme, pas seulement à celle citée dans le prompt.
- **L70** — `git show HEAD:<fichier> | Select-String` est inopérant en PS 5.1 pour un fichier nouveau (pipe + mojibake) ; utiliser `Out-File -Encoding utf8` puis `ReadAllText`.
- **L71** — `Get-Content "chemin/[projectId]/fichier"` échoue (crochets = wildcard) ; `-LiteralPath` obligatoire.
- **L72** — `git show <commit>` ne prouve pas l'exécution des tests ; les artefacts `test-results/` sont la seule preuve (succès OU échec).
- **L73** — `Select-String -SimpleMatch` ne matche pas les accents (`geometr` ≠ `géométrique`) ; doubler par lecture intégrale (L57 renforcée).
- **L74** — Un grep de mot-clé anglais sur du code ou des commentaires français produit des faux négatifs. Toujours doubler la requête par le terme français ET sa forme sans accent (réf. L73).
- **L75** — Ne jamais qualifier un mojibake de « bloquant » sur la seule sortie `Get-Content`. Trancher impérativement par `[System.IO.File]::ReadAllBytes` + `UTF8.GetString`. Citer une leçon ne suffit pas à l'appliquer.
- **L76** — Vérifier la surface réelle d'une applet PowerShell 5.1 par `Get-Command <applet> -Syntax` avant émission. `Format-Hex` n'a pas de paramètre `-Count` en 5.1.
- **L77** — Toujours préfixer `git diff` / `git log` / `git show` par `--no-pager` dans les blocs non interactifs, sinon la preuve est tronquée au premier écran (violation R9).
- **L78** — Un rapport d'agent intercalé dans une sortie brute n'est pas une preuve. S'il contredit les commandes réellement exécutées, il doit être écarté intégralement.
- **L79** — Ne jamais publier ou afficher une commande annulée ou erronée dans un prompt ; ne fournir que la version conforme (L60) pour éviter toute confusion d'exécution.
- **L80** — Vérifier la surface du crate installé (`~/.cargo/registry/src/<index>/<crate>-<version>/src/`) avant d'écrire du code : l'API core de Tauri 2.12.3 n'expose **aucun** sidecar (`process.rs` = `current_binary` + `restart` uniquement) ; le spawn passe par `tauri-plugin-shell` (`ShellExt::sidecar`).
- **L81** — Sur Windows, normaliser les chemins Tauri (`resource_dir()` renvoie un chemin verbatim `\\?\F:\…`) **avant** de les passer à un process enfant : Node échoue sinon en `EISDIR: lstat 'F:'`. Utiliser un helper de suppression du préfixe `\\?\`.
- **L82** — Pour une app GUI (windows subsystem), `log::info!` sur stdout est invisible : lancer l'exe via `Start-Process -RedirectStandardOutput/-RedirectStandardError` pour toute preuve de log ; `tauri-plugin-log` y écrit (niveau INFO inclus).
- **L83** — Un binaire de sidecar (`bundle.externalBin`) n'est résolu par Tauri qu'à **côté de l'exe** : en run non-bundlé, copier `binaries/node-<triple>.exe` dans `target/release/` (NSIS le fait en production).
- **L84** — Un hook de build qui injecte du **CJS** (`require(...)`) en tête d'un `server.js` **ESM** (Next.js 16 standalone) casse le démarrage : passer `PORT`/`HOSTNAME` par `.env()` plutôt que patcher le fichier.
- **L85** — Sur Windows, KiCad expose son API IPC via un **named pipe** `\\.\pipe\%TEMP%\kicad\api.sock` (nom = chemin complet ; ce **n'est pas un fichier**). La détection doit **énumérer `\\.\pipe\`**, pas utiliser `fs.existsSync`.
- **L86** — Build Next.js **standalone** : les chunks `.next/static` ne sont pas copiés automatiquement. Le script `build-server.cjs` doit **vérifier leur présence après copie** et échouer explicitement si absents (sinon `ChunkLoadError` / 404).
- **L87** — Fichiers **TOML créés sous PowerShell** : BOM UTF-8 (`EF BB BF`) possible. Le parsing Rust doit **retirer le BOM** (`U+FEFF`) avant de lire la première clé, sinon la 1re clé (`DATABASE_URL`) est invisible.

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
| (t) | Tests d'intégration réels hors CI : le script `npm run test:sources` exécute `scripts/test-real-sources.ts` pour valider les sources externes sans bloquer Playwright. |
| (u) | Réforme gouvernance 3 acteurs (IA externe, coordinateur, IA interne). Rôles clarifiés : IA externe (analyse/planification), coordinateur (décision/transport), IA interne (exécution). |
| (v) | Logs structurés `[RE:...]` dans le flux Reverse Engineering (upload, preview, export, statut, étape, projet). V8-B-6-e. |
| (w) | Logs complets sur tous les boutons du flux RE (18 logs `console.info('[RE:...]`) — V8-B-6-f. |
| (x) | Upload CAO robuste (AbortController 30s, cursor-pointer dropzone, logs complets) — V8-B-6-g. |
| (y) | Éditeur 3D CadEditor (TransformControls, redimensionnement) + sauvegarde dimensions partielle — V8-B-6-h. |
| (z) | Pipeline STEP/IGES via libcascade (importCadFile + tessellateShape + OcctViewer) — V8-C-2a. |
| (aa) | Layout Workspace : flex (w-1/4, w-2/4, w-1/4) au lieu de grid (grid-cols-[1fr_2fr_1fr]) — plus fiable avec Tailwind 4. |
| (ab) | Workspace : panneaux Collecte et Assistant rétractables (toggle PanelLeft/PanelRight) pour maximiser l'espace du viewport. À implémenter en V8-D-5. |
| (ac) | Assistant IA (V8-D-5 / TÂCHE 2) : mock `AI_MOCK` en variable d'environnement de **dev manuel** (non câblée dans `playwright.config.ts` — voir `D-AI-MOCK-NON-CABLÉ`) ; `page.route('**/api/ai/chat')` = **seul mock E2E effectif** (`e2e/workspace/assistant-chat.spec.ts`) ; textarea React non pilotable par `fill`/`pressSequentially` → setter natif `HTMLTextAreaElement.prototype` + `input` event + `waitForChatHydrated` (`__reactProps`) — voir `D-CHAT-TESTABILITY`. |
| (ad) | Automatisation E2E des panneaux rétractables (V8-D-5 / TÂCHE 3) : `e2e/workspace/collapsible-panels.spec.ts` — 3 tests (toggle Collecte, toggle Assistant, masquage simultané) avec seed `localStorage['partiva-workspace-state']` et vérification du viewport (`w-2/4` / `w-3/4` / `flex-1`). Résout `D-V8-D-5-COLLAPSIBLE-VISUAL-VALIDATION`. |
| (ae) | PCB Core = source de vérité ; KiCad = représentation synchronisée. L'IA propose des actions structurées, le Core valide. |
| (af) | V1 = mode guidé uniquement ; mode automatique en V8-D-9. |
| (ag) | Bibliothèque curatée (50 composants) + prix ajustables admin. |
| (ah) | Mode Tauri hybride (IPC + CLI) — contourne les limitations IPC 9/10. |
| (ai) | Approvisionnement intelligent (BOM → prix/stock/alternatives). |
| (aj) | Revue de conception automatisée (design review). |
| (ak) | Simulation first-pass (SI/PI/EMC/Thermique). |
| (al) | Autoroutage assisté (Freerouting). |
| (am) | Templates de circuits de référence. |
| (an) | BDD locale = catalogue + prix ajustables, injection web → local unidirectionnelle. |
| (ao) | Formulaire intelligent 7 blocs (questions conditionnelles, suggestions IA, détection incohérences). |

---

## 13. Décisions FIX-DOC (2026-11-17)

### `ap-1` — Écart L56 toléré pour un fix ciblé §8

- **Date :** 2026-11-17 (session FIX-DOC-REPRISE).
- **Décision :** L'écart L56 (édition par remplacements ciblés via l'outil `edit` natif, au lieu de `WriteAllText` du fichier complet) est **toléré** pour un fix ciblé §8 (≤ 30 lignes/fichier), sous réserve de preuve d'intégrité.
- **Justification :** §8 prime pour les correctifs ciblés ; l'objectif de L56 (pas de BOM, accents intacts) est atteint et prouvé (`ReadAllBytes` → BOM = `False` ; `Select-String` → accents intacts).
- **Conséquences :** méthode actée pour les fix ciblés. Toute réécriture > 100 lignes reste soumise à L56 (`WriteAllText`, fichier complet).

### `ap-2` — Dépassement §8 assumé sur `ETAT_COURANT.md` (+48/−6)

- **Date :** 2026-11-17 (session FIX-DOC-REPRISE).
- **Décision :** Le dépassement de la limite §8 (≤ 30 lignes/fichier) est **assumé** pour la section « Écarts détectés » d'`ETAT_COURANT.md` (+48/−6).
- **Justification :** le tableau des 19 merges (#110 → #128) est incompressible ; l'externaliser créerait un fichier non listé (interdit par le périmètre de la session).
- **Conséquences :** audit exhaustif conservé. Toute réduction ultérieure devra préserver les 19 lignes, ou externaliser avec autorisation explicite du coordinateur.

### `ap-3` — `D-V8-D-4-COMPARE-VISUAL-VALIDATION` maintenue OUVERTE (résolution partielle)

- **Date :** 2026-11-17 (session FIX-DOC-REPRISE).
- **Décision :** La dette `D-V8-D-4-COMPARE-VISUAL-VALIDATION` est **maintenue ouverte**, requalifiée « résolution partielle — PR #128 ».
- **Justification :** `git show 621e1a4` prouve la présence de l'overlay 4 modes (`Original` / `Après Revue` / `Après Sourcing` / `Prêt Export`) et du curseur d'opacité, mais la zone de visualisation reste un **placeholder** (aucun rendu géométrique), aucune capture d'écran n'est fournie, aucun log `[OCCT:compare]` n'est émis, et l'exécution de `e2e/pcb/visual-comparison.spec.ts` n'est pas prouvée.
- **Conséquences :** fermeture impossible sans preuve (charte §10). Condition de résolution inchangée : protocole manuel + capture + preuve de run E2E.

### `ap-4` — Leçon L61 (Mode R2, READY dans le même tour)

- **Date :** 2026-11-17 (session FIX-DOC-REPRISE).
- **Décision :** Consigner la leçon **L61** : « En Mode R2, si le prompt unitaire et le READY sont reçus dans le même tour, l'IA interne signale l'écart dans l'accusé et poursuit. »
- **Justification :** lors de FIX-DOC-REPRISE, le prompt unitaire et la demande de validation ont été reçus dans le même tour ; l'absence de tour READY séparé a été signalée en §ERREURS/BLOCAGES de l'accusé sans bloquer l'exécution.
- **Conséquences :** L60 reste attribuée (pas de backtick dans les guillemets doubles) ; L61 est ajoutée en §7, titre « L45 → L61 ».

### `ap-5` — Solde S1 : alignement §4 et traçabilité de la session S1 (rétroactif)

- **Date :** 2026-11-17 (session FIX-DOC-DECISIONS-AP, solde S1.1).
- **Décision :** Deux points sont actés rétroactivement : **(A1)** l'alignement de `PROMPT_DE_REPRISE.md` §4 « Prochaine action attendue » sur les 3 options de l'en-tête et du §2 est **validé** ; **(A2)** la session `FIX-DOC-DECISIONS-AP` est **ajoutée** au tableau « 5 dernières sessions » de `PROMPT_DE_REPRISE.md` v8.2.
- **Justification :** (A1) supprime la contradiction interne constatée en S1 (en-tête et §2 portaient les options S1, le §4 portait encore les options périmées V8-D-8 / V8-D-9) ; (A2) assure la traçabilité de la sous-étape S1 dans le point d'entrée de reprise (charte §6).
- **Conséquences :** `PROMPT_DE_REPRISE.md` v8.2 est cohérent de bout en bout (en-tête = §2 = §4) ; la session FIX-DOC-DECISIONS-AP est traçable dans le tableau des sessions.

### `(ar)` — Desktop Tauri = sidecar connecté (option h)

- **Date :** 2026-11-17 (sessions T3.1 / T3.1-ter / T3.1-quater).
- **Décision :** Le desktop Tauri utilise un **sidecar connecté** (Next.js racine + **Postgres/Neon**) pour les routes **PCB/IA** ; le **catalogue offline** reste assuré par le store **Rust/SQLite** (`desktop/src-tauri/src/db.rs`, 5 migrations). **Aucun portage de schéma Prisma vers SQLite.**
- **Justification :** T3.1-ter (mesuré) : sous-ensemble desktop utile = **42/69 routes (61 %)** mais **100 % du schéma** à porter — 10 `enum` (non portés par Prisma/SQLite), `Unsupported("tsvector")` (l.90), `Unsupported("vector")` pgvector (l.176, **absent de SQLite**), `@db.Decimal` (l.272), 21 champs `Json`. Options écartées : (a) `DATABASE_URL` par install (secret par poste + offline impossible) ; (b) portage ciblé/complet (10-15 / 18-25 j/h, casse `tsvector` et `vector`) ; (c) SQLite Tauri + PCB web-only (**contredit T2**).
- **Conséquences :** PCB/IA **indisponibles hors ligne** (dépendance réseau) ; catalogue, auth et recherche locale **offline** ; config DB du sidecar **hors bundle**, fournie à l'installation (dette `D-V8-D-14-DB-CONFIG-POST-INSTALL`).
- **Réf. :** T3.1-ter (2026-11-17) ; spec `docs/v8-d14-pcb-desktop-spec.md` §3.

### `(aq)` — Timeout webServer 600_000 (décision mesurée)

- **Date :** 2026-11-17 (P6.1a-i, requalification de P1).
- **Décision :** `playwright.config.ts` `webServer.timeout` = 600_000 ms.
- **Justification :** mesure #2 (P6.1a) : `npm run build` en cache froid (compile Turbopack 3,2 min + TypeScript) **dépasse 300 s** → `Timed out waiting 300000ms from config.webServer`. `600_000` couvre le chemin réel. Le revert P1.1 (300_000) était fondé sur une mesure en cache tiède (239,2 s) non représentative. Réserve L50 levée par mesure fraîche (cache froid 192 s compile + TypeScript ; cache chaud 58,4 s).
- **Conséquences :** run E2E `--project=pcb` débloqué ; `D-V8-D-8-E2E-NON-PROUVE` peut être rejouée. `300_000` n'est plus la valeur de référence.

### `(as)` — Desktop Tauri = sidecar connecté + auth réelle + KiCad IPC (V8-D-14 close)

- **Date :** 2026-11-18 (V8-D-14, T3.0 → T5.1).
- **Décision :** Desktop Tauri = **sidecar connecté** (Next.js + Postgres/Neon) pour l'**authentification réelle** ; **catalogue offline conservé en Rust/SQLite** ; PCB Studio avec **détection KiCad via named pipe** `\\.\pipe\%TEMP%\kicad\api.sock` ; installeurs **NSIS + MSI** (fr-FR, en-US).
- **Justification :** décision (ar) + sessions T3.x/T4.x/T5.x (preuves runtime : `/api/health` 200, `[proxy] session=OK(ADMIN)`, `POST /api/pcb/ipc {action:"detect"}` → `available:true`).
- **Conséquences :** V8-D-14 **close** le 2026-11-18.

### `(at)` — Desktop : auth Better Auth (session), pas le keyring

- **Date :** 2026-11-18 (T4.7).
- **Décision :** le desktop utilise l'**authentification Better Auth réelle** (cookie de session `better-auth.session_token`), **pas le keyring Windows**. Le keyring reste utilisé pour les commandes Tauri spécifiques (sync), mais l'accès admin est basé sur la **session**.
- **Justification :** `admin/layout.tsx` et `auth-guard.tsx` s'appuient désormais sur `useSession()` (cookie), plus sur `loadToken()` (keyring).
- **Conséquences :** la boucle `/login` est supprimée ; `[proxy] session=OK(ADMIN)` prouvé.

---

## 14. Décisions V8-D-8 → V8-D-13 (2026-11-17)

**Origine :** 19 merges `097d7e1..216ed3e` (#110 → #128). 18 merges non tracés (#111 → #128) · 11 sous-étapes livrées sans entrée documentaire. Cette section résorbe l'écart (session P5, 2026-11-17).

| ID | Date | Décision | Justification (commit / PR) | Conséquences |
|---|---|---|---|---|
| `V8-D-8-a` | 2026-11-16 | CLI Adapter `kicad-cli` (ERC, DRC, exports) | `ebf221c` · PR #112 | Base d'exécution KiCad CLI |
| `V8-D-8-b` | 2026-11-16 | IPC Adapter (détection KiCad GUI, stubs) | `08b9f4a` · PR #114 | Voie GUI ouverte ; dette `D-PCB-KICAD-IPC-GUI-DEPENDENCY` |
| `V8-D-8-c` | 2026-11-16 | IPC Adapter version (détection version + tests `getVersion`) | `6b9d8e5` · PR #115 | Dépendance version ; dette `D-PCB-KICAD-VERSION-DEPENDENCY` |
| `V8-D-8-d` | 2026-11-16 | Parsing ERC/DRC (lecture JSON `kicad-cli`) | `d50a384` · PR #116 | Résultats exploitables par l'UI |
| `V8-D-8-e` | 2026-11-16 | UI statut KiCad + tableau de bord PCB Studio | `04be188` · PR #117 | Surface admin PCB |
| `V8-D-8-f` | 2026-11-16 | Sourcing BOM (recherche, coût, alternatives) | `6e69bbc` · PR #118 | Précurseur de V8-D-10 |
| `V8-D-8-g/h/i` | 2026-11-16 | Design review, autoroute, GLB viewer (PCB Design Studio complet) | `781544c` · PR #119 | Studio unifié ; `D-PCB-AUTOROUTER-ABSENT` |
| `V8-D-9` | 2026-11-17 | Mode automatique PCB | `fac14df` · PR #120 | Livrée **dans le même commit que V8-D-10-a** |
| `V8-D-10-a` | 2026-11-17 | Sourcing engine (MPN matching + alternatives) | `fac14df` · PR #120 | Moteur de sourcing |
| `V8-D-10-b` | 2026-11-17 | Sourcing UI | `b3ee599` · PR #121 | Table de sourcing |
| `V8-D-11-a/b/c` | 2026-11-17 | Real state analysis (règles physiques) + compliance panel + intégration | `b3ee599` · `5a6bb46` · `5e07d6f` · PR #121→#123 | Violations réelles affichées |
| `V8-D-12-a/b` | 2026-11-17 | Design review engine (règles + sévérité) + UI | `a9255a8` · `220a93f` · PR #124→#125 | Revue de conception |
| `V8-D-13-a/b` | 2026-11-17 | Export engine (BOM XLSX/CSV + Gerber ZIP) + UI | `fa4c3eb` · `d6c6a25` · PR #126→#127 | Exports fabrication ; aucune dette |
| `D-V8-D-4` | 2026-11-17 | Correctif comparaison visuelle (overlay 4 couleurs + slider) | `621e1a4` · PR #128 | **Résolution partielle** — cf. §13 `ap-3` |

> **Note de traçabilité (P5, 2026-11-17)** : les 11 sous-étapes ci-dessus ont été livrées entre `097d7e1` et `216ed3e` sans entrée documentaire. Cette §14 résorbe l'écart. Aucune de ces sous-étapes n'a de spec V8-D-14 associée ; aucune n'a de preuve E2E de succès (cf. dette `D-E2E-PREEXISTANT-FAILURES`).

---

---

## 15. Décisions Fast-Track P7 (2026-11-20 -> 2026-11-22)

**Origine :** Fast-Track P7 a livre 44 etapes validees (V1-V44) + 32 questions repondues (Q1-Q32) sur la fonctionnalite PCB, entre le 2026-11-20 et le 2026-11-22, sur la branche `fast-track/p7-dashboard-pcb`. Aucune de ces decisions n'avait ete portee au registre `DECISIONS.md` (ecart E10, SYNC-1-bis). Cette section resorbe l'ecart (session SYNC-2-b, 2026-11-22). **Source :** `docs/sessions/SUIVI_DISCUSSION_PCB.md`.

### 15.1 - Decisions de cadrage (V1-V29)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| V1 | Admin concoit/implanete depuis l'app, KiCad en arriere-plan, rendu dans notre zone | Objectif fonctionnel | - |
| V2 | Gauche = carte, droite = cahier des charges | Repartition de l'ecran | Layout 2 colonnes |
| V3 | Double affichage (KiCad embarque + vue PartIVA), bascule par bouton, source unique | - | - |
| V4 | Mode par defaut = vue PartIVA, KiCad sur demande | - | - |
| V5 | Perimetre V1 = placement seul (pas de pistes, pas d'autoroutage) | - | - |
| V7 | 8 regles de placement (1 champ = 1 composant, terme inconnu = message, auto-ref R1/R2, position algo puis corrigeable, grille 2,54 mm, rotation 0 deg, KiCad ferme = en attente, annuler dernier) | - | - |
| V8 | Referentiel : origine + dimensions de la carte obligatoires | - | - |
| V9 | Placement au clic reporte ; position vient de l'algorithme (V23) | - | - |
| V10 | Projet neuf : notre app ecrit le fichier de carte minimal au format KiCad 10 (10.0.8), squelette minimal valide | - | - |
| V11 | Demarrage d'un cahier des charges : formulaire dimensions editable + creation fichier automatique | - | - |
| V12 | Emplacement du fichier = poste admin (stable), chemin enregistre | - | - |
| V13 | Panneau droit = cahier des charges client (fenetre defilante) en haut + liste technique des champs/formulaires en dessous | - | - |
| V14 | L'IA lit le CDC et propose dimensions, liste composants, structure d'implantation (zones). Admin valide ou corrige ; rien n'est applique automatiquement | - | - |
| V15 | CDC = texte obligatoire (client remplit des champs, ou admin colle du texte). Pas d'OCR | - | - |
| V16 | Formulaire client restructure en 6 blocs (usage/function/processing/mechanical/manufacturing/quality) | - | - |
| V17 | Bibliotheque de modeles de reference en BDD locale, consultee par l'IA | - | - |
| V18 | Corpus de reference = cartes open source uniquement, format lisible (KiCad), source + licence obligatoires. Cible 20-50 modeles | - | - |
| V19 | Chaine : formulaire client -> CDC -> analyse IA + corpus -> proposition -> validation admin -> formulaire dimensions -> creation fichier -> placement | - | - |
| V20 | Declenchement IA automatique une fois a la creation, puis relance manuelle apres modification | - | - |
| V21 | Apres validation/correction, admin relance IA : champs retractables par composant, admin selectionne modele par modele | - | - |
| V22 | Placement reel : algorithme calcule coordonnees et envoie a KiCad | - | - |
| V23 | Position proposee (repartition zones, grille 2,54 mm) puis corrigeable par saisie X/Y et glisser-deposer. Remplace V7.4 | - | - |
| V24 | Corpus + bibliotheque en SQLite sur le poste admin (coherent avec V12) | - | - |
| V25 | Architecture hybride : Tauri 2 + sidecar Next.js (127.0.0.1) + SQLite local + PostgreSQL serveur | - | - |
| V26 | PCB exige le reseau (IA indispensable). SQLite local = stockage, pas mode hors ligne | - | - |
| V27 | Modele LLM = Groq openai/gpt-oss-120b (via GROQ_MODEL), sortie JSON stricte (maj B.1) | - | - |
| V28 | Seuil de compatibilite : tout ce qui depasse un score (ex. 80%), min 3 max 8 modeles par champ + lien "voir tout" | - | - |
| V29 | Pont KiCad = Node/sidecar (reutilise /api/pcb/ipc et kicad-ipc-adapter.ts) | - | - |

### 15.2 - Decisions de fiabilite (V30-V35)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| V30 | Completude + contradictions avant envoi formulaire (score + blocage si contradiction) | - | Non bloquant, avertir seulement (V30.3) |
| V31 | Provenance obligatoire : chaque valeur proposee cite sa source (phrase client ou ID modele corpus). Sans source = rejetee | - | - |
| V32 | Double passe + detection divergence : IA interrogee 2 fois, seules les valeurs stables sont retenues | - | - |
| V33 | Verification deterministe des composants : regles (pas IA) sur tension/courant/broches/decouplage + empreinte validee | - | - |
| V34 | Envoi sur a KiCad : controle geometrique + transaction idempotente + dry-run + reconciliation | - | - |
| V35 | Jeu d'evaluation de reference : 10 CDC types -> proposition attendue, rejoues a chaque changement de prompt/modele, avec score | - | - |

### 15.3 - Decisions de capitalisation et catalogue (V36-V44)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| V36 | Capitalisation : chaque projet accompli sauvegarde en BDD locale (CDC, proposition validee, composants, positions, fichier). 2 regimes legaux : modeles de reference (open source, licence) et projets accomplis (internes) | - | - |
| V37 | Recherche dans la bibliotheque = hybride (filtres structures + similarite sur champs textuels). IA reordonne top-5 seulement | - | - |
| V38 | Catalogue/stock composants : structure BDD locale avec empreinte, params electriques, prix, stock, fournisseur, datasheet. Stock reel avec avertissement seulement. 1 seul fournisseur par composant (Q27) | - | - |
| V39 | Compteur de prix : a chaque composant place/valide, prix unitaire s'incremente, affichage cout total | - | - |
| V40 | BDD vectorielle locale (SQLite + sqlite-vec), synchronisee avec corpus et catalogue | - | Differé Fast-Track (A7.3) |
| V41 | Schema par defaut du catalogue : table components (1 ligne = 1 composant, 1 fournisseur par ligne) | - | - |
| V42 | Format de fichier de carte : KiCad 10 (10.0.8), squelette minimal valide, verifie par ouverture dans KiCad | - | - |
| V43 | Le client remplit les 6 blocs dans son profil, puis envoie a l'admin (cree/met a jour la Request) | - | - |
| V44 | Correction de position = saisie numerique (X/Y) + glisser-deposer sur la vue (les deux) | - | - |

### 15.4 - Decisions d'architecture d'execution (Phases A-E)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| V45 | Schema Prisma regularise : RequestType, PcbProject.requestId (derive Fast-Track regularisee via migrate diff + resolve --applied). Nouveau champ PcbProject.kicadFilePath String? | - | Mitigations R8/R9 |
| V46 | Corpus + recherche FTS5 : composants reels (ComponentCatalog web -> SQLite local), sync incluse, recherche BM25 + stemming | - | Vectoriel differe (V37) |
| V47 | Recherche FTS5 cote Rust : search_components (FTS5 + repli LIKE), escape_fts5_query. Index vide -> repli LIKE | - | - |
| V48 | Securisation des routes PCB : requireAdmin() sur les 17 routes /api/pcb/* non protegees | - | Dette D-FT-P7-PCB-AUTH-GAP soldee |
| V49 | Analyse CDC client (Phase B) : LLM unifie callGroq, responseFormat json_object, validation Zod. POST /api/pcb/analyze : texte CDC -> exigences structurees + bouton Analyser | - | - |

### 15.5 - Decisions Phase C, D, E (Post-Fast-Track)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| C.1 | Placement pur : pxToMm (calibration), snapToGrid 2,54 mm, generateReference, clampToBoard, computePlacement | - | 16 tests |
| C.2 | PlacementPanel (<details>, usePcbEditor(), dimensions via parseKicadPcb, repli 100x80 mm, edition inline) | - | - |
| C.3 | Envoi KiCad : POST /api/pcb/components (persistance), scripts/kicad/place_footprints.py (batch transactionnel), POST /api/pcb/place/batch (borne 200), bouton "Placer dans KiCad" (dry-run par defaut -> persistance -> batch -> recap) | - | - |
| V30.3 | Qualite CDC : avertir seulement, ne pas bloquer (faux positifs possibles sur rails multiples) | - | Blocage a reconsiderer apres mesure golden set |
| V33-bis | Verification deterministe : verify-placement.ts (pur, tolerances 0,01 mm / 0,5 deg) + POST /api/pcb/place/verify (relecture parseKicadPcb) + verdict "N/N conformes" | - | 29 tests |
| V34-bis | Envoi sur durci : scripts Python (verrou .lck, controle bbox Edge.Cuts, backup .bak, reconciliation avec restauration), flags --force / --allow-outside, parseResult du bridge corrige | - | 47 tests |
| V35-bis | Golden set : 10 CDC realistes, scorer 0.3/0.4/0.3, orchestrateur sequentiel avec isolation des echecs | - | 20 tests, 0 reseau |
| V31-bis | Provenance : colonne source String? sur PcbRequirement (migration 20261121093328), analyze-mapping.ts (pur, 10 tests), prompt exigeant une citation exacte | - | UI Source + badge a verifier |
| V30-bis | Completude + contradictions : cdc-quality.ts (pur, 14 tests), conflits d'unites, unsourced, toVerify. Panneau Qualite du CDC | - | - |
| V32-bis | Double passe : consensus.ts (pur, 12 tests) - mergePasses, valeurs stables, divergences, onlyInPass1/2. Double passe active par defaut (2 appels LLM sequentiels) | - | Cout/latence x2 |
| V37-bis | Reordonnancement : rank-candidates.ts (pur, 11 tests) + classement IA du top-10 -> top-5, conditionne a rankCandidates && doublePass && candidates.length > 5 | - | Fallback (jamais de 502) |
| A2.5 | Saisie kicadFilePath : PATCH /api/pcb/projects/[id] (auth admin, validation .kicad_pcb, exists informatif). Composant KicadFileInput monte dans la barre haute du workspace | - | Dette D-FT-P7-KICAD-PATH-UNRESTRICTED partiellement mitigee |
| C1 | Sourcing composants : ComponentSourcingPanel + /api/pcb/requirements/source-components. IA propose une BOM (13-17 composants) depuis le CDC valide. Positions offsetees par rapport au plateau reel. Resolution automatique des empreintes KiCad | - | - |
| C2 | Compilation IA optimisee : /api/pcb/requirements/compile. Prompt couvrant les 6 categories -> completude 100% (6/6) | - | - |
| C.4 | PCB/KiCad bout-en-bout reserve au mode hybride Tauri (desktop/web). Production web : plateau reel charge et pret (verifie apres PR #148), suffisant a ce stade ; "Valider et placer dans KiCad" exige le mode hybride desktop/web | Python KiCad/pcbnew indisponible sur Vercel ; pas de placement cloud a ce stade | - |

### 15.6 - Notes de tracabilite

- **Source primaire :** `docs/sessions/SUIVI_DISCUSSION_PCB.md` (39 781 octets, 2026-11-22).
- **Source secondaire :** `docs/sessions/FAST_TRACK_P7.md` (14 209 octets, 2026-11-19).
- **Dettes associees :** voir `docs/etat/DETTES.md` section "Dettes Fast-Track P7" (portage SYNC-2-a, 2026-11-22).
- **Branche :** `fast-track/p7-dashboard-pcb` (42 commits d'avance sur master, merge-base `d50f4c0`).
- **Ecart E10 (DECISIONS.md sans entree Fast-Track) :** resorbe par cette section.
- **Non couvert par cette section :** les decisions de la Phase D et E sont des sous-etapes d'implementation (V30-bis a V37-bis, C1, C2) ; elles sont tracees ici pour memoire mais leur specification detaillee reste dans `SUIVI_DISCUSSION_PCB.md`.

### 15.7 - Decisions P11 — quota LLM (2026-11-24, PR #153)

| ID | Decision | Justification | Consequences |
|---|---|---|---|
| P11.1 | `analyze` : double passe et classement IA **desactives par defaut** ; idempotence par `PcbProject.cdcHash` | 3 appels LLM par defaut, puis recalculs identiques | 1 appel par analyse, **0** si le CDC est inchange ; V32-bis/V37-bis restent activables explicitement |
| P11.2 | `/api/pcb/requirements/parse` : **aucun appel LLM** | L'enrichissement n'etait ni persiste ni renvoye (appel mort) | Validation CDC gratuite ; l'analyse reste concentree dans `/api/pcb/analyze` |
| P11.3 | Cooldown providers et cache LLM **L1 memoire + L2 Prisma**, timeout DB 800 ms, reprise quota au minuit UTC | Etat purement memoire perdu a chaque instance serverless froide ; retry sur provider epuise | Migration `20261124120000_add_llm_state` requise ; sans elle, repli automatique sur L1 |
| P11.4 | Fallback etendu (Together, DeepInfra, Mistral, SambaNova) + `hasLlmProvider()` ; plus de garde dure sur `GROQ_API_KEY` | Clefs deja configurees mais inutilisees ; 502 systematique si Groq seul epuise | 6 providers ; la presence d'au moins une cle suffit |
| P11.5 | `providers-meta.ts` : metadata fournisseurs cote client, separee de `providers.ts`/`groq-client` | Le client embarquait Prisma/`pg` via `AssistantZone`, cassant le build Turbopack (`dns`/`fs`/`net`/`tls`) | Aucun import de code serveur dans un composant client |
| P11.6 | Invalidation du cache sourcing par `sourcingCache.cdcHash` | Un CDC modifie devait generer une nouvelle BOM ; un CDC identique ne devait rien recalculer | **0** appel si CDC inchange, 1 sinon |
| P11.7 | Coupe-circuit journalier **dur** a 100 000 tokens (UTC), persistant (`LlmDailyUsage`), avec repli memoire | `LLM_DAILY_TOKEN_BUDGET` n'etait qu'un log : aucun arret d'appel | Tout appel LLM est refuse au-dela du plafond ; migration `20261124130000_add_llm_daily_usage` requise pour le partage entre instances |
| P11.8 | Cache L2 pour chat/fiche et idempotence `/api/engine` ; rate limit photo | 2 routes n'avaient aucun cache, le moteur pouvait rejouer le pipeline complet | 0 appel sur requete identique ; -1 a -3 appels par Analyse |