# État courant du projet

**Date de mise à jour :** 2026-11-11
**HEAD actuel :** `ce8665b` (V7-H clôture — PR #37)
**Branche courante :** `master`
**Statut :** V7 close (V7-A → V7-H validées). V8 en cours (fiabilisation inter-sessions).

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
| V8 | **EN COURS** — Fiabilisation inter-sessions (V8-P0) |

## Actions critiques

- **Mot de passe admin** : `$env:ADMIN_PASSWORD` doit être défini dans l'environnement avant tout démarrage E2E admin. Les tests admin sont bloqués sans cela.
- **Hook BOM** : les fichiers doivent être encodés UTF-8 sans BOM. Vérifier avec `Get-Content -Encoding Byte` avant commit.
- **Nettoyage branches** : `refactor/v7-clean-ui` est obsolète (mergée dans `master` et `origin/master`, aucun commit en avance). Suppression candidate dans la session d'hygiène (`D-GIT-BRANCH-HYGIENE`).

## Dernière session

- **SESSION-2026-11-10-V7B** (clôturée) : Workspace IA (V7B-1 → V7B-6).
  - **V7B-1** : bouton « Ouvrir le Workspace » depuis une demande + pré-chargement photos/description/matériau. Commit `9241a91`, PR #22 mergée `5e4ba47`.
  - **V7B-2** : libellé « Analyser avec le Workspace » + affichage dimensions/forme/matériau. Commit `680eaa0`, PR #23 mergée `aefd372`.
  - **V7B-3** : libellé « Reconstruire CAO » + export STL. Commit `5b9d7db`, PR #24 mergée `b2c7b93`.
  - **V7B-4** : viewer 3D pour modèles générés (data URL STL). Commit `2388d61`, PR #25 mergée `61f2dd5`.
  - **V7B-5** : validation + persistance (`Part` + `ReconstructionAttempt`). Commit `c01a2f5`, PR #26 mergée `0f8600b`.
  - **V7B-6** : tests unitaires (route validate) + correction tests connectors. Commit `daaa957`, PR #28 mergée `eb798c0`.
  - **Total** : 6 commits, 6 PR mergées, 3 checks CI verts à chaque PR.

## Session V7-C → V7-H (2026-11-10 → 2026-11-11)

- **V7-C** : Reverse CAO déjà fonctionnel (aucun code).
- **V7-D** : Import CAO — PR #32 (migration, route /api/upload/cad, page, bouton).
- **V7-E** : Orchestrateur séquentiel non-intrusif — PR #34 (bouton + bandeaux Étape N/4).
- **V7-F** : Capitalisation BDD — PR #35 (PartTemplate + Solution + Server Actions CRUD).
- **V7-G** : Reconstruction CAO assistée — PR #36 (reconstructFromCad + 7 tests).
- **V7-H** : Clôture documentaire — PR #37 (ETAT_COURANT, DETTES, DECISIONS, INDEX, ROADMAP).
- **Total** : 5 PR mergées (#32, #34, #35, #36, #37), 3 checks CI verts à chaque PR.

## Session V8-P0 (2026-11-11)

- **V8-P0** : Fiabilisation inter-sessions.
  - **V8-P0-1** : `PROCEDURE_INTERACTION.md` (source unique) + `PROMPT_DE_REPRISE.md` v5.0 (point de reprise).
  - **V8-P0-2** : `PROCEDURE_IA_INTERNE.md` (sections §6-8) + `DETTES.md` (suppression `## Résolues`).
  - **V8-P0-3** : `ETAT_COURANT.md` (purge) + `docs/archive/ETAT_HISTORIQUE_E61_E92.md` (archive).
  - **V8-P0-4** : Preuves + commit + PR.

## Prochaine étape

**V8-P0-4** : Preuves finales + commit + PR (clôture V8-P0).

Après merge de PR : **V8 peut démarrer** (photogrammétrie réelle, UI templates, UI reconstruction, tests E2E admin, hygiène branches).
