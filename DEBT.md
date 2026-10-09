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
| `D-e2e-multitenant` | Test E2E « USER sur pièce d'un autre client → 403 » skippé — seed mono-client. Sécurité multi-tenant (`NOT_OWNER`) non couverte par test E2E. | Haute | E1-S03-G | Oui | Enrichir le seed avec un 2ᵉ client (Sophie Martin + un autre user) pour activer le test |
| `D-e2e-auth-dual` | Deux mécanismes d'auth E2E coexistent : `authRequest` (chromium) et `storageState` (admin/user/viewer). Unification à envisager si les storageStates produisent des 401 stales. | Faible | Session E2E dédiée | Non | Vérifier la stabilité des storageStates sur plusieurs runs consécutifs |
| `D-s03-t3-ecart` | Interprétation de l'écart `SUBMITTED`/`IDENTIFYING` (E1-S03-F T3) non prouvée par un SELECT avant/après. Plausible, non vérifié. | Faible | Session E2E dédiée | Non | Ajouter un SELECT avant/après tests E2E pour confirmer |
| `D-e2e-isolation` | Effets d'ordre entre specs E2E (DB partagée) + instabilité dev server Windows. Les specs passent seules, échouent en run complet. | Moyenne | Session E2E dédiée | Non | Ajouter reset DB entre specs ou isoler les données par spec |
| `D-e2e-skip-conditional` | Skip conditionnel `part-versions.spec.ts:68` (test transition crée version) — skip si aucune pièce SUBMITTED en seed (consommée par un test antérieur). | Faible | Session E2E dédiée | Non | Rendre le test déterministe (fixture dédiée ou reset DB) |
| `D-cloudinary-cleanup` | Suppression du fichier Cloudinary à la suppression d'un `PartImage`/`Attachment` (D5 E1-S05) — non implémenté. | Moyenne | E1-S06-C | Oui | `cloudinary.uploader.destroy(publicId)` dans DELETE `PartImage` (`images/[imageId]`) et `Attachment` (`attachments/[attachmentId]`) — non bloquant si échec |
| `D-cloudinary-attachment-upload` | UI d'upload d'`Attachment` absente — modèle `Attachment.publicId` prêt mais aucun endpoint d'upload d'attachment. | Faible | E1-S06-C | Oui | UI `PartAttachmentList` + API `POST /api/parts/[id]/attachments` (upload Cloudinary `raw`) + onglet « Documents » |
| `D-cloudinary-validation` | Chemin succès `uploadToCloudinary()` non testé en E1-S05 (caveat) — E2E ne couvrait que les chemins d'erreur. | Haute | E1-S06-A | Oui | Test d'intégration `scripts/test-cloudinary.mjs` avec vrais credentials |

---

## Dettes résolues (historique)

| ID | Description | Résolu en |
|---|---|---|
| `D-forwardRef` | Migration `forwardRef` → `ref` comme prop (React 19) | E0-S10 |
| `D25-bis` | Warning Decimal persistant (sérialisation RSC→Client) | E0-S09 |
| `D25-ter` | Hydration mismatch `pieces-pretes-client.tsx:315` | E0-S09 |
| `D-zod3` | Zod 3 → 4 | E0-S08 |
| `D-eslint8` | ESLint 8 → 9 (flat config) | E0-S08 |
| `D-next15` | Next 15 → 16 | E0-S08 |
| `D-tailwind3` | Tailwind 3 → 4 | E0-S09 |
| `D-react18` | React 18 → 19 | E0-S09 |
| `D-mocks` | Mocks `MOCK_SEARCH_CANDIDATES`, `mock-data.ts` | E0-S07 |

---

## Dettes annulées (sans objet)

| ID | Description | Raison |
|---|---|---|
| `D117` | pg v9 | N'existe pas sur npm (E404) |
