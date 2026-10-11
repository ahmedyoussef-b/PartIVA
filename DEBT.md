# DEBT.md — Registre des dettes résiduelles PartIVA

> Registre vivant. Mis à jour à chaque clôture de session.
> Format : ID / Description / Sévérité / Phase cible / Bloquant / Décision

---

## Dettes résiduelles E0 (post E0-S11-B)

| ID | Description | Sévérité | Phase cible | Bloquant | Décision |
|---|---|---|---|---|---|
| `D-format-E0` | `format:check` — 83 fichiers non conformes (origine : E0-S10-B) | Moyenne | E0-S11-B | Non | Résorbé en E0-S11-B (commit dédié) |
| `D-audit-mysql2` | `npm audit` — 4 high prod / 9 high total via `mysql2` transitif de `prisma` | Haute | Attente Prisma 8 | Non | Accepté et tracé. `mysql2` non utilisé (PostgreSQL). Fix = downgrade Prisma 6.19.3 (breaking) → refusé. Attente Prisma 8 (D116) |
| `D-part-user` | Relation `Part` ↔ `User` absente — filtrage client impossible | Haute | E1-S01 | Oui (E1) | Prérequis E1-S01. Ajout `clientId` sur `Part` + migration |
| `D-enums-non-utilises` | Enums Prisma non appliqués sur `AuditLog.action`, `AuditLog.entityType`, `SearchCandidate.source` (champs techniques, valeurs ouvertes) | Faible | Session ultérieure | Non | `Machine.type` + `Material.category` convertis en enum en E1-S01 (D3). `AuditLog.*` + `SearchCandidate.source` reportés (champs techniques, valeurs ouvertes) |
| `D-ui-orphelins` | `alert.tsx`, `select.tsx`, `skeleton.tsx` non consommés | Faible | E1-S01 | Non | Décision usage ou suppression en E1-S01 |
| `D-docs-template` | `PCT.md` en template non rempli | Faible | Session doc dédiée | Non | Accepté si intentionnel (document générique). À confirmer par le Coordinateur |
| `D-roadmap-retard` | `ROADMAP.md` — table E0 incomplète, libellés inexacts, sessions E0-S07b-1/2/3 + E0-S10 manquantes | Faible | Session doc dédiée | Non | Reporté session doc dédiée (groupée avec D-44) |
| `D-27-bis` | `GET /api/reverse-engineering` absente | Faible | E1 ou E7 | Non | Reporté. Aucun consommateur externe identifié (D49) |
| `D-44` | Coquille Markdown `ROADMAP.md` l.139 (4 cellules / 3 colonnes) | Faible | Session doc dédiée | Non | Reporté session doc dédiée |
| `D116` | Prisma 8 — attente GA | Faible | Session dédiée | Non | Condition : GA Prisma 8 + adapter-pg 8.x stable + validation auth adapter |
| `D117` | pg v9 — sans objet | — | — | — | Annulée. pg v9 n'existe pas sur npm (E404) |
| `D-cloudinary` | Cloudinary mentionné ROADMAP E1-S05 mais non implémenté | Faible | E1-S05 | Non | Décision d'usage en E1-S05 |
| `D-ptv-race` | Race condition génération PTV — deux POST simultanés sur `/api/parts` peuvent produire la même `ptvReference` (conflit `@unique`) | Moyenne | E1-S02-A | Non | Résolu en E1-S02-A : retry applicatif (3 tentatives, backoff 50/100/200ms) dans `createPartWithPtvReference()` |
| `D-ux-enum-labels` | Affichage UI des codes bruts d'enum (`PRINTER_3D`, `THERMOSTABLE_TECHNIQUE`) sans mapping libellé lisible | Faible | E1-S02-B | Non | Résolu en E1-S02-B : mapping FR dans `src/lib/enum-labels.ts` appliqué aux 5 composants d'affichage |
| `D-e2e-auth-dual` | Deux mécanismes d'auth E2E coexistent : `authRequest` (chromium) et `storageState` (admin/user/viewer). Unification à envisager si les storageStates produisent des 401 stales. | Faible | Session E2E dédiée | Non | Vérifier la stabilité des storageStates sur plusieurs runs consécutifs |
| `D-s03-t3-ecart` | Interprétation de l'écart `SUBMITTED`/`IDENTIFYING` (E1-S03-F T3) non prouvée par un SELECT avant/après. Plausible, non vérifié. | Faible | Session E2E dédiée | Non | Ajouter un SELECT avant/après tests E2E pour confirmer |
| `D-e2e-isolation` | **Faible, contrainte environnementale.** Filesystem `F:\` lent + dev server Windows → 1-2 échecs intermittents par run E2E (jamais les mêmes, jamais en isolation). Correctif : déplacer le repo hors `F:\` (hors périmètre projet). **Pas de cible de session** — contrainte acceptée tant que le repo reste sur `F:\`. | Faible | — (contrainte acceptée) | Non | Contrainte environnementale acceptée. Toute migration vers un disque plus rapide fermerait automatiquement cette contrainte. |
| `D-e2e-skip-conditional` | Skip conditionnel `part-versions.spec.ts:68` (test transition crée version) — skip si aucune pièce SUBMITTED en seed (consommée par un test antérieur). | Faible | Session E2E dédiée | Non | Rendre le test déterministe (fixture dédiée ou reset DB) |
| `D-e2e-residues` | Tests CRUD `e2e/part-specifications.spec.ts` (POST `e2e-spec-*`, `e2e-dup-*`, `e2e-patch-*`) créent des specs sans `afterEach`/`afterAll` de cleanup — seul `e2e-del-*` est nettoyé (DELETE explicite). Résidus persistants en DB (6 specs après 2 runs) — interfèrent avec les recherches numériques (`value="après"` non numérique). | Faible | Session E2E dédiée | Non | Nettoyage PR E2-S04 (`DELETE WHERE key LIKE 'e2e-%'` → 0, 25 specs seed intactes). Prévention : ajouter cleanup aux tests CRUD (session E2E dédiée). |
| `D-e2e-parts-residues` | Tests E2E créant des parts sans cleanup : fixture `ensureSubmittedPart` (`E2E-RESET-*`, E2-S10) + tests `POST /api/parts` (`E2E-*`, E2-S11). Pas de `DELETE /api/parts/[id]` (route `[id]` = GET uniquement). Croissance cumulative : ~4 parts par run (3/run E2-S11 : 2 transitions + 1 versions ; +3/run E2-S11 : 2 créations + 1 no-auth rejetée). Fusion de `D-e2e-submitted-residues` + résidus E2-S11. | Faible | Session E2E dédiée | Non | Ajouter `DELETE /api/parts/[id]` (audit cascade suppression — impact `ReverseEngineeringProject`, `PartImage`, `PartSpecification`, `PartSupplier`, `Attachment`, `PartVersion`) + cleanup `afterEach`/`afterAll` ciblé. Alternative : reseed périodique (`npx tsx prisma/seed.ts` — destructif). |
| `D-photo-embedding-backfill` | Backfill réel des 5 images seed en `part_images.embedding` — bloqué par `HF_API_TOKEN` absent en environnement (R3 E2-S05). `SELECT COUNT(*) FROM part_images WHERE embedding IS NULL` = 5. **Outil prêt** : `scripts/backfill-embeddings.ts` (idempotent, `npm run db:backfill-embeddings`, exit 0 sans token — testé E2E `e2e/backfill-embeddings.spec.ts`), documentation `scripts/README.md`, `HF_API_TOKEN` documenté dans `.env.example`. | Moyenne | Session dédiée (HF_API_TOKEN) | Non | Exécuter `npm run db:backfill-embeddings` quand le token HF est provisionné (ajouter `HF_API_TOKEN` dans `.env`). Le backend (`POST /api/search/photo`) retourne 503 tant que les embeddings sont NULL. |
| `D-hnsw-drift` | Drift index HNSW `part_images_embedding_hnsw` (R.4.1-bis) — Prisma ne modélise pas les index HNSW sur colonnes `Unsupported("vector(768)")`. `migrate dev` tente de le dropper (générait une 2ᵉ migration `DROP INDEX`). Même classe que le drift GIN R.4.1. | Faible | — (drift attendu) | Non | Documenté. La migration SQL `20261010133855_add_part_image_embedding` + recréation manuelle est la source de vérité. Critère de baseline : **0 drift hors `part_images_embedding_hnsw`**. |
| `D-embedding-model-catalog` | Modèle embeddings unique (`clip-ViT-B-32`, D125-bis) — aucun catalogue de modèles alternatifs (SigLIP, OpenVision, Franca) ni UI admin de sélection. | Faible | Session dédiée | Non | Documenter les modèles alternatifs + prévoir UI admin de sélection dans une session dédiée (E2-S06, D125-bis). |
| `D-scoring-weights-ui` | UI admin d'ajustement des poids (`scoring_weights`) reste absente. La partie « photo branchée en UI » est résolue par E2-S09 (5ᵉ onglet Photo dans `SearchBar`). | Faible | Session UI dédiée | Non | Ajouter une UI admin de configuration des poids. |
| `D-completeness-category-keys` | `REQUIRED_SPEC_KEYS` est une **liste globale fixe** (8 clés, E2-S07). Une liste **par catégorie** de pièce (`PartCategory`) nécessiterait un modèle `CategoryRequiredSpec` + migration + UI de configuration. **Partiellement atténué en E2-S08** : auto-complétion des clés requises (`GET /api/parts/[id]/specifications/suggestions` + dropdown UI) — l'admin voit les clés absentes avec unité par défaut. La liste reste globale (pas par catégorie). | Faible | Session dédiée | Non | Modèle `CategoryRequiredSpec` + UI admin de configuration des clés requises par catégorie. |
| `D-completeness-material` | `material` **exclu** de `REQUIRED_SPEC_KEYS` (textuel, pas dimensionnel — décision 2-i E2-S07). ROADMAP ne le cite pas, seed non garanti. | Faible | Session dédiée | Non | À envisager si la complétude matière devient un signal métier (ajout à `REQUIRED_SPEC_KEYS` ou liste distincte). |
| `D-completeness-blocking` | Complétude = **suggestion passive** uniquement (4a E2-S07) — aucun blocage de transition workflow si complétude < seuil. | Faible | E6 (qualité) | Non | Arbitrage E6 : blocage workflow (ex. interdire SUBMITTED→IDENTIFYING si complétude < 100 %). |
| `D-completeness-client-ui` | UI client **avancée** à la complétude — le badge simple apparaît déjà via `PartDossier` (partagé admin+client), mais aucune UI client dédiée (liste des manques avec actions, mise en évidence). | Faible | Session UI dédiée | Non | Ajouter une vue client dédiée (actions sur les manques, suggestions). |
| `D-newpart-schema-prisma-mismatch` | `NewPartSchema` (dérivé de `PartSchema` via `omit`) exige 7 champs fantômes absents du modèle Prisma `Part` (`reference`, `material`, `dimensions`, `tolerances`, `version`, `files`, `machineId`) — `POST /api/parts` retournait systématiquement 400 pour tout payload valide. `UpdatePartSchema` héritait des mêmes fantômes. | Haute | E2-S11 | Oui | Résolu en E2-S11 : `NewPartSchema` réécrit sur les 6 champs réels (`partNumber`, `ptvReference?`, `name`, `description?`, `status`, `categoryId?`), `UpdatePartSchema` aligné (`partial().omit({ partNumber: true })`). Auth déplacée en tête de `POST /api/parts` (création anonyme possible avant — faille sécurité). 4 tests E2E ajoutés (`e2e/api.spec.ts` : 401 sans auth, 201 minimal, 201 complet, 400 invalide). |
| `D-traceparts-credentials` | Connecteur TraceParts (E3-S02) codé en mode mock. Branchement réel nécessite `TRACEPARTS_TENANT_UID` + `TRACEPARTS_API_KEY` (EasyLink). Flux d'auth D-E3-11 : `RequestToken` → Bearer JWT (24h, cache mémoire). Endpoint `RequestToken` = hypothèse à confirmer. | Moyenne | Session dédiée (credentials TraceParts) | Non | Exécuter le mode réel quand les credentials sont provisionnés (ajouter les 2 variables dans `.env`). Contournement : mode mock activé automatiquement si l'une des deux variables est absente. |
| `D-openserp-instance` | OpenSERP OSS nécessite une instance Docker locale (`karust/openserp serve`). Docker/Podman absents de l'environnement de développement (constat Bloc 0 E3-S03 v0). | Moyenne | E3-S03-bis (Docker à provisionner) | Non | Provisionner Docker/Podman puis exécuter E3-S03-bis. Contournement : Wikidata (E3-S03) fournit une source externe réelle en attendant. |
| `D-wikidata-search-semantics` | Wikidata SPARQL indexe uniquement les labels exacts (`rdfs:label "X"@en`). Recherche partielle (regex/préfixe) = full scan → 504 timeout. | Faible | E3-S05 (agrégation) | Non | Contournement E3-S05 : `wikibase:mwapi` ou API `wbsearchentities` pour recherche partielle. Agrégation = sémantiques hétérogènes (Wikidata exact, TraceParts full-text, OpenSERP SERP). |
| `D-powershell-utf8-bom` | PowerShell 5.1 `Set-Content -Encoding UTF8` ajoute un BOM `﻿` (`\uFEFF`) → `JSON.parse` échoue sur les fixtures JSON. | Faible | Documentation | Non | R.5.3 : écrire les fixtures via `[System.IO.File]::WriteAllText(path, content, New-Object System.Text.UTF8Encoding($false))` (UTF8 sans BOM). |
| `D-searchsource-i18n-sync` | Toute valeur ajoutée à `SearchSourceSchema` doit être synchronisée dans `src/i18n/fr.ts` (`satisfies Record<SearchSource, string>`) — sinon TS1360. | Faible | Documentation / refactor | Non | R.5.2 : vérifier au `tsc --noEmit`. Alternative : refactor en `z.record` tolérant. |
| `D-wikidata-timeout` | Wikidata SPARQL peut dépasser le timeout Playwright par défaut (30s) — timeout connecteur 15s × 3 tentatives + backoff ≈ 48s. | Faible | Documentation | Non | R.5.4 : `test.setTimeout(90_000)` pour les tests E2E appelant des sources externes lentes. |
| `D-cadenas-access` | CADENAS / 3Dfindit n'a **aucune API publique self-service** (reconnaissance E3-S04). Voies rejetées : API partenaire (contrat commercial PARTsolutions), AppServer (pas de licence), 3Dfindit API (403 accès restreint), scraping (**CGU CADENAS interdisent la collecte systématique + l'usage ML/IA — pénalités 20 000 €/cas + 500 €/téléchargement**). Accès réel uniquement via PARTsolutions Application Server (licence commerciale, Http GET/POST JSON — sous contrat). | Moyenne | Session dédiée (contrat CADENAS) | Non | CADENAS abandonné du MVP E3 (D-E3-19). Pipeline E3 fonctionnel sans CADENAS : Wikidata (réel) + TraceParts (mock) + OpenSERP (E3-S03-bis). Réintégrer si un contrat PARTsolutions est obtenu. R.5.5 : ne jamais tenter de scraper CADENAS (pénalités chiffrées). |

---

## Dettes résiduelles E1 (post E1-S07)

| ID | Description | Sévérité | Phase cible | Bloquant | Décision |
|---|---|---|---|---|---|
| `D-e2e-isolation` | **Faible, contrainte environnementale.** Filesystem `F:\` lent + dev server Windows → 1-2 échecs intermittents par run E2E (jamais les mêmes, jamais en isolation). Correctif : déplacer le repo hors `F:\` (hors périmètre projet). **Pas de cible de session** — contrainte acceptée tant que le repo reste sur `F:\`. | Faible | — (contrainte acceptée) | Non | Contrainte environnementale acceptée. Toute migration vers un disque plus rapide fermerait automatiquement cette contrainte. Correctif reset DB testé en E2-S01-A2 : abandonné (33 échecs). |
| `D-e2e-parts-residues` | Tests E2E créant des parts sans cleanup (fixture `ensureSubmittedPart` + tests `POST /api/parts`). Pas de `DELETE /api/parts/[id]`. ~4 parts/run. | Faible | Session E2E dédiée | Non | Ajouter `DELETE /api/parts/[id]` + cleanup ciblé, ou reseed périodique. |
| `D-e2e-auth-dual` | Deux mécanismes d'auth E2E coexistent : `authRequest` (chromium) et `storageState` (admin/user/viewer). | Faible | Session E2E dédiée | Non | Vérifier la stabilité des storageStates sur plusieurs runs consécutifs |
| `D-s03-t3-ecart` | Interprétation de l'écart `SUBMITTED`/`IDENTIFYING` (E1-S03-F T3) non prouvée par un SELECT avant/après. | Faible | Session E2E dédiée | Non | Ajouter un SELECT avant/après tests E2E pour confirmer |
| `D-enums-non-utilises` | Enums Prisma non appliqués sur `AuditLog.action`, `AuditLog.entityType`, `SearchCandidate.source` (champs techniques, valeurs ouvertes). | Faible | Session ultérieure | Non | `Machine.type` + `Material.category` convertis en enum en E1-S01 (D3). `AuditLog.*` + `SearchCandidate.source` reportés |
| `D-ui-orphelins` | `alert.tsx`, `select.tsx`, `skeleton.tsx` non consommés. | Faible | Session ultérieure | Non | Décision usage ou suppression |
| `D-docs-template` | `PCT.md` en template non rempli. | Faible | Session doc dédiée | Non | Accepté si intentionnel (document générique) |
| `D-roadmap-retard` | `ROADMAP.md` — table E0 incomplète, libellés inexacts, sessions manquantes. | Faible | Session doc dédiée | Non | Reporté session doc dédiée (groupé avec D-44) |
| `D-27-bis` | `GET /api/reverse-engineering` absente. | Faible | E1 ou E7 | Non | Reporté. Aucun consommateur externe identifié (D49) |
| `D-44` | Coquille Markdown `ROADMAP.md` l.139 (4 cellules / 3 colonnes). | Faible | Session doc dédiée | Non | Reporté session doc dédiée |
| `D116` | Prisma 8 — attente GA. | Faible | Session dédiée | Non | Condition : GA Prisma 8 + adapter-pg 8.x stable + validation auth adapter |
| `D-audit-mysql2` | `npm audit` — 4 high prod / 9 high total via `mysql2` transitif de `prisma`. | Haute | Attente Prisma 8 | Non | Accepté et tracé. `mysql2` non utilisé (PostgreSQL). Fix = downgrade Prisma 6.19.3 (breaking) → refusé |

---

## Dettes résolues (historique)

| ID | Description | Résolu en |
|---|---|---|
| `D-cloudinary-validation` | Chemin succès `uploadToCloudinary()` non testé en E1-S05 | E1-S06-A (`scripts/test-cloudinary.mjs`, upload réel OK) |
| `D-cloudinary-cleanup` | Suppression fichier Cloudinary à la suppression PartImage/Attachment | E1-S06-C (`cloudinary.uploader.destroy(publicId)` dans les DELETE) |
| `D-cloudinary-attachment-upload` | UI d'upload d'`Attachment` absente | E1-S06-C (`PartAttachmentList` + API `POST /api/parts/[id]/attachments`) |
| `D-part-user` | Relation `Part` ↔ `User` absente | E1-S01-A |
| `D-ptv-race` | Race condition génération PTV | E1-S02-A (retry applicatif) |
| `D-ux-enum-labels` | Affichage UI codes bruts d'enum | E1-S02-B (mapping FR) |
| `D-forwardRef` | Migration `forwardRef` → `ref` comme prop (React 19) | E0-S10 |
| `D25-bis` | Warning Decimal persistant (sérialisation RSC→Client) | E0-S09 |
| `D25-ter` | Hydration mismatch `pieces-pretes-client.tsx:315` | E0-S09 |
| `D-zod3` | Zod 3 → 4 | E0-S08 |
| `D-eslint8` | ESLint 8 → 9 (flat config) | E0-S08 |
| `D-next15` | Next 15 → 16 | E0-S08 |
| `D-tailwind3` | Tailwind 3 → 4 | E0-S09 |
| `D-react18` | React 18 → 19 | E0-S09 |
| `D-mocks` | Mocks `MOCK_SEARCH_CANDIDATES`, `mock-data.ts` | E0-S07 |
| `D-format-E0` | `format:check` — 83 fichiers non conformes | E0-S11-B |
| `D-dotenv-transitive` | `dotenv` dépendance transitive (prisma→@prisma/config→c12) — `scripts/backfill-embeddings.ts` importe `dotenv/config` | E2-S07-B1-C (`npm install -D dotenv@^17.4.2`, devDep directe, dédupliquée) |
| `D-search-post-public` | `POST /api/search` public (aucune auth) | E2-S07-C2 (auth VIEWER+ ajoutée au POST, identique au GET) |
| `D-e2e-multitenant` | Test E2E multi-tenant (USER sur pièce d'un autre client → 403) skippé — seed mono-client | E2-S07-D (2ᵉ client `client2@partiva.dev` Marie Lefèvre + 1 part SUBMITTED `PTV-2026-000006` dans le seed, 2 tests conditionnels activés + 1 test diff créé) |
| `D-parts-list-public` | `GET /api/parts` et `GET /api/parts/[id]` publics sans auth, non filtrés par `clientId` (fuite multi-tenant) | E2-S07-E (auth VIEWER+ ajoutée aux 2 routes GET, filtre `clientId` pour USER sur `/api/parts`, ownership 403 pour USER sur `/api/parts/[id]`, 5 tests E2E ajoutés dans `api.spec.ts`, 14 tests E2E mis à jour via `getFirstPartId(playwright)` contexte isolé + `listPartsAsAdmin(playwright)`, E2E 195 passed) |
| `D-completeness-suggestions` | Auto-complétion des clés requises absentes (E2-S08) — `GET /api/parts/[id]/specifications/suggestions` + dropdown UI « Mesures manquantes » | E2-S08 (route suggestions + dropdown `part-specification-table.tsx` + 3 tests E2E) |
| `D-photo-ui` | UI 5ᵉ mode « Photo » dans `SearchBar` absente — `type SearchMode` sans `'photo'`, backend `POST /api/search/photo` non branché en UI | E2-S09 (5ᵉ onglet « Photo » dans `SearchBar` : upload `<input type="file">` JPEG/PNG/WebP 5 Mo max, lecture FileReader → base64, appel `POST /api/search/photo` `{ mimeType, data, limit }`, gestion 503 « Recherche par photo indisponible (HF_API_TOKEN absent) », 4 tests E2E : 401, 400 mime invalide, 503 token absent, 200 conditionnel si token HF) |
| `D-e2e-submitted-consumption` | Tests `part-transitions.spec.ts` consomment le stock SUBMITTED du seed sans reset (transition SUBMITTED→IDENTIFYING irréversible) — 2 échecs intermittents | E2-S10 (fixture `ensureSubmittedPart` : création part SUBMITTED via Prisma/tsx en `beforeEach` ciblé dans `test.describe` — `part-transitions.spec.ts` 2 tests + `part-versions.spec.ts` 1 test ; 2 runs consécutives sans reseed = 11/11 verts, suite complète 200/0/2) |
| `D-newpart-schema-prisma-mismatch` | `NewPartSchema`/`UpdatePartSchema` exigeaient 7 champs fantômes absents du modèle `Part` — `POST /api/parts` cassé (400 systématique) + création anonyme possible (auth après parse) | E2-S11 (schéma aligné sur 6 champs réels, auth en tête de route, 4 tests E2E ajoutés, 13/13 `api.spec.ts` verts) |
| `D-e2e-skip-conditional` | Skip conditionnel `part-versions.spec.ts` (test transition crée version) — skip silencieux masquait la consommation SUBMITTED | E2-S10 (même fixture `ensureSubmittedPart` — le test versions ne skip plus, exécution déterministe) |

---

## Dettes annulées (sans objet)

| ID | Description | Raison |
|---|---|---|
| `D117` | pg v9 | N'existe pas sur npm (E404) |
