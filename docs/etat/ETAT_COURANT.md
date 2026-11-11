# État courant du projet

**Date de mise à jour :** 2026-11-11
**HEAD actuel :** `f9eb675` (Merge PR #48 — V8-B-1-d close)
**Branche courante :** `master`
**Statut :** V7 close (V7-A → V7-H validées). V8 en cours (V8-B-1 (a→d) close).

---

## État des versions

| Version | Statut |
|---------|--------|
| V3 | CLOS |
| V4-A | CLOS |
| V4-B | CLOS |
| V5 | CLOS |
| V6 | CLOS |
| V8 | CLOS |
| V7 | **CLOSE** — V7-A → V7-H validées (2026-11-10 → 2026-11-11) |
| V8 | **EN COURS** — V8-B-1 (a→d) close (PRs #46, #47, #48). Prochaine étape : V8-B-2 (à préciser). |

---

## Actions critiques

- **Mot de passe admin** : `$env:ADMIN_PASSWORD` doit être défini dans l'environnement avant tout démarrage E2E admin. Les tests admin sont bloqués sans cela.
- **Hook BOM** : les fichiers doivent être encodés UTF-8 sans BOM. Vérifier avec `Get-Content -Encoding Byte` avant commit.
- **Nettoyage branches** : `refactor/v7-clean-ui` est obsolète (mergée dans `master` et `origin/master`, aucun commit en avance). Suppression candidate dans la session d'hygiène (`D-GIT-BRANCH-HYGIENE`).

---

## Dernière session

- **SESSION-2026-11-11-V8-B-1** (clôturée) : CRUD templates de pièces (UI + API + E2E).
  - **V8-B-1-a** : lecture + diagnostic, décision périmètre `/admin/part-templates` (Option 1), HEAD `ed28d74`, working tree propre. Pas de modification.
  - **V8-B-1-b** : API CRUD `/api/part-templates` (GET) + `/api/part-templates/[id]` (GET/PUT/DELETE) avec `requireAdmin`, réutilisation Server Actions, champs JSON exclus. PR #46 mergée, 3 checks CI verts.
  - **V8-B-1-c** : UI création (`/new`) + édition (`/[id]`) via Server Actions `createPartTemplate`/`updatePartTemplate`/`deletePartTemplate`, non-régression liste V8-B-0. PR #47 mergée, 3 checks CI verts. Bug `action={inline}` détecté (form cassé au rendu) — corrigé en V8-B-1-d.
  - **V8-B-1-d** : 4 tests E2E CRUD (créer, lire, mettre à jour, supprimer) dans `e2e/admin/admin-part-templates.spec.ts`, nettoyage après chaque test (noms préfixés `e2e-`). PR #48 mergée, 4 tests passent, 3 checks CI verts.
  - **Total** : 3 PR mergées (#46, #47, #48), 3 checks CI verts à chaque PR.

---

## Session V8-P0 (2026-11-11)

- **V8-P0** : Fiabilisation inter-sessions.
  - **V8-P0-1** : `PROCEDURE_INTERACTION.md` (source unique) + `PROMPT_DE_REPRISE.md` v5.0 (point de reprise).
  - **V8-P0-2** : `PROCEDURE_IA_INTERNE.md` (sections §6-8) + `DETTES.md` (suppression `## Résolues`).
  - **V8-P0-3** : `ETAT_COURANT.md` (purge) + `docs/archive/ETAT_HISTORIQUE_E61_E92.md` (archive).
  - **V8-P0-4** : Preuves finales + commit + PR.

---

## Prochaine étape

**V8-B-2** : à préciser par le coordinateur (périmètre, objectif, livrables).

Après merge de V8-B-1 : **V8-B-2** peut démarrer (photogrammétrie réelle, UI reconstruction, tests E2E admin supplémentaires, hygiène branches).
