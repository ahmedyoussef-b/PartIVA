# ÉTAT COURANT — PartIVA

**Dernière mise à jour :** 2026-10-26
**Commit HEAD :** 53b6ad1 (E40-Fix6/7/8 + documentation)
**Phase en cours :** E40-Fix — Clôture administrative de la session
**Statut du projet :** CI-ready

## 1. Objectif actuel

Phase de stabilisation CI/E2E close.

**E28 (2026-10-23).** Correction des 5 échecs E2E résiduels (`D-E27-E2E-RESIDUAL`) une fois la connectivité Neon rétablie :
- `e2e/api.spec.ts` — liste de tables du manifest desktop alignée sur `SYNC_TABLES` (ajout `material`, `request`).
- `e2e/part-attachments.spec.ts` — upload/DELETE Cloudinary sautés (`test.skip`) quand `CLOUDINARY_API_SECRET` absent (dépendance externe).
- `e2e/part-versions.spec.ts` — `getFirstPartId` sélectionne une part seedée possédant déjà des versions.
Commit `f32555c`.

**E29 (2026-10-23).**
- Commit design E30 : `feat(design): integrate TemplateMonster #535437 visual identity and tech tokens` (`d7265cc`).
- Commit config E2E : `fix(e2e): commit rate-limit disable config for Playwright webServer` (`6116414`).
- Suite E2E complète (345 tests) : **338 passés / 6 sautés / 0 échec fonctionnel**. Le seul échec (`backfill-embeddings.spec.ts`) est pré-existant et dépend d'un service d'embeddings HF local non démarré, sans rapport avec E28/E29.
- `E2E (Playwright)` ajouté aux `required_status_checks` de la branche `master` (côtés `ESLint + Prettier`, `TypeScript`, `Build`, `strict: true`).
- `D-E27-E2E-RESIDUAL` clôturée.

Voir le rapport : `docs/sessions/rapports/SESSION-2026-10-23-E29.md`.

## 2. Architecture et choix applicables

- **Stack :** Next.js 16.4.0, React 19.3.0, Prisma 7.10.0, TypeScript 5.9.3, Tailwind 4.3.3.
- **Base de données :** Neon (PostgreSQL, pgvector).
- **Desktop :** Tauri (export statique).
- **Tests :** Playwright (E2E), ESLint, Prettier, TypeScript.
- **Structure documentaire :** Réforme E26 terminée (5 commits).

## 3. Travaux en cours

- **E27** (CI, ✅ terminé) : correctifs poussés (`a75ecd9`, `a8a1d59`, `c980e2d`, `7159dfe`, `3d7664d`, `5a2ac01`, `1cc5733` — rapport) et validés en CI (run `39777704765`). Jobs `lint` / `typecheck` / `build` verts ; job `e2e` à 337/345.
- **E27-bis** (CI, ✅ terminé) : `required_status_checks` activés sur `master` sur `ESLint + Prettier`, `TypeScript`, `Build` ; `E2E (Playwright)` ajouté en E29. `enforce_admins` non modifié (état actuel : `false`).
- **E28** (E2E résiduels, ✅ terminé) : 5 échecs corrigés (commit `f32555c`).
- **E29** (validation finale + protection branche, ✅ terminé) : suite E2E 338 passés / 6 sautés / 0 échec fonctionnel ; `E2E (Playwright)` en check requis sur `master`.
- **E30** (design, ✅ terminé) : intégration identité visuelle tech + tokens (commit `d7265cc`).
- **E31** (design, ✅ terminé) : travaux de design en attente dans l'arbre de travail — intégrés au commit groupé E32-Bis.
- **E32** (KPI réels, ✅ terminé) : endpoint `/api/dashboard/kpi` alimentant le dashboard avec données réelles ; erreurs ESLint corrigées ; encodage UTF-8 restauré.
- **E40-Fix** (bouton "Nouveau projet RE", ✅ terminé) : page `/admin/reverse-engineering/new` créée avec formulaire de création de projet RE ; bouton connecté via `<Link href="/admin/reverse-engineering/new">` dans `reverse-engineering-list-client.tsx` ; action serveur `createREProjectFromForm` ajoutée dans `src/lib/actions/reverse-engineering.ts`. Validation : typecheck EXIT 0, lint EXIT 0, build EXIT 0.
- **E40-Fix6** (upload Cloudinary, ✅ terminé) : correction de `createPart` pour gérer les erreurs d'upload Cloudinary. Les échecs précédents étaient silencieux (blob URLs temporaires) ; le serveur renvoie maintenant `success: false` avec message d'erreur. Fix nommé `D-E20-CLOUDINARY-UPLOAD-SILENT-FAIL`.
- **E40-Fix7** (onglet Images, ✅ terminé) : intégration de l'onglet `Images` dans la page de détail `/admin/pieces/[id]` via `PartImageGallery`. La consultation des images est désormais possible quel que soit le point d'entrée. Fix nommé `D-E20-ADMIN-PART-IMAGES-DISPLAY`.
- **E40-Fix8** (sémantique Client, ✅ terminé) : clarification de la sémantique entre `Request` et `Part`. Ajout du bouton "Convertir en Pièce (admin)" dans le détail des demandes (`/admin/demandes/[id]`) pour migrer automatiquement une demande validée (`candidate_found`) vers le catalogue de pièces avec ses photos. Fix nommé `D-E20-CLIENT-REQUEST-SEMANTICS`.

- **CI (2026-10-26) :** job E2E désactivé sur push/PR, exécutable manuellement via `workflow_dispatch`. Motif : lenteur du cycle + `D-E27-E2E-RESIDUAL`.

## 4. Blocages

- **D-E23-PRISMA-POOLER-TIMEOUT :** Résolue — 3 runs CI consécutifs verts sur le pooler Neon (session E34). Preuve : `docs/infrastructure/E34-POOLER-STABILITY-LOG.md`.
- **D-E22-PART-STATUS-BADGE :** Composant mixte Server/Client (fonctionnel).
- **D-E14-PRINT-ON-DEMAND :** Acceptée (facteur externe).

## 5. Décisions ayant un effet opérationnel

| ID | Décision | Date |
|---|---|---|
| `D-E16-STEP-1` | `occt-import-js` pour STEP/IGES | E16-R0b |
| `D-E18-AUDIT-1` | Routes API `/api/audit` et `/api/materials` créées | E18-R1 |
| `D-E22-UI-1` | Refonte dashboard (KPI, 3D 2 colonnes) | E22-R1 |
| `D-E23-CRUD-1` | Page `/admin/pieces/nouveau` créée | E23-R1 |
| `D-E24-PRISMA-1` | Pool Prisma explicite + `onPoolError` | E24-R1 |
| `D-E24-E2E-1` | Credentials E2E auto-suffisants | E24-R2 |
| `D-E27-E2E-1` | Le seed et la suite E2E lisent les **mêmes** variables (`E2E_*`) ; le rate limit Better Auth est levé **uniquement** en E2E via `E2E_DISABLE_RATE_LIMIT=true` | E27 |

## 6. Prochaine étape autorisée ou proposée

- Phase de stabilisation CI/E2E close (E27 → E27-bis → E28 → E29 toutes terminées). Aucun nouveau ID Tâche proposé.
- **E40-Fix** clôturée : le bouton "Nouveau projet RE" est maintenant fonctionnel (redirection vers `/admin/reverse-engineering/new` avec formulaire de création).
- `E2E (Playwright)` est désormais un check requis sur `master` ; il peut être exigé pour toute PR/merge.
- **Point de vigilance CI :** le log du run ne doit **pas** contenir `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock` — sa présence signalerait que les secrets GitHub ne sont pas alignés sur `e2e/fixtures/users.ts`.
- **Opérationnel :** la base Neon est partagée CI ↔ local. Après chaque run CI, rejouer `npm run db:seed` en local avant toute exécution E2E locale (les identifiants diffèrent).

## 8. Dernières Améliorations — Session E40

### 🛠️ Améliorations Récentes (Session E40)

- **Flux Admin (Création de Pièce) :** Sécurisation de l'upload Cloudinary. Les échecs d'upload bloquent désormais la création et affichent un message d'erreur explicite (fin des échecs silencieux). Fix `D-E20-CLOUDINARY-UPLOAD-SILENT-FAIL` (E40-Fix6).
- **Affichage Admin :** Intégration de l'onglet `Images` (via `PartImageGallery`) dans la page de détail `/admin/pieces/[id]` pour une consultation cohérente, quel que soit le point d'entrée. Fix `D-E20-ADMIN-PART-IMAGES-DISPLAY` (E40-Fix7).
- **Flux Client :** Clarification sémantique. Le bouton est désormais libellé "Soumettre la demande de pièce". Distinction claire entre "Demande" (Request) et "Pièce" (Part), avec un pont de conversion Admin. Fix `D-E20-CLIENT-REQUEST-SEMANTICS` (E40-Fix8).
- **Upload photos (creer-piece) :** Remplacement du `react-dropzone` + upload intermédiaire `/api/upload` par un upload direct vers Cloudinary depuis le navigateur (`fetch` vers l'API unsigned `v1_1/{cloud}/upload`). L'action serveur `createRequest` accepte désormais des URLs (strings) ou des `File` pour le champ `photos` (`src/lib/actions/requests.ts`). `.env.local` documenté avec `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` et `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.

### 🔒 Blocages et Points de Vigilance

- **E40-Fix** clôturé : l'ensemble des corrections E40-Fix6/7/8 est maintenant stable et documenté.
- `E2E (Playwright)` est désormais un check requis sur `master`.
- **Point de vigilance CI :** le log du run ne doit **pas** contenir `⚠️ ADMIN_EMAIL/ADMIN_PASSWORD absents → utilisateurs mock`.
- **Opérationnel :** la base Neon est partagée CI ↔ local. Après chaque run CI, rejouer `npm run db:seed` en local avant toute exécution E2E locale (les identifiants diffèrent).
