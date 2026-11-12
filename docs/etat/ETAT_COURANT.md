# État courant du projet

**Date de mise à jour :** 2026-11-12
**HEAD actuel :** `6e1e792` (Merge PR #57 — V8-B-3-c close)
**Branche courante :** `master`
**Statut :** V7 close (V7-A → V7-H validées). V8 en cours (V8-B-3 (a→c) close).

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
| V8 | **EN COURS** — V8-B-4-a close (PRs #59-#61). Prochaine étape : V8-B-5 (à préciser). |

---

## Actions critiques

- **Mot de passe admin** : `$env:ADMIN_PASSWORD` doit être défini dans l'environnement avant tout démarrage E2E admin. Les tests admin sont bloqués sans cela.
- **Hook BOM** : les fichiers doivent être encodés UTF-8 sans BOM. Vérifier avec `Get-Content -Encoding Byte` avant commit.
- **Nettoyage branches** : `refactor/v7-clean-ui` est obsolète (mergée dans `master` et `origin/master`, aucun commit en avance). Suppression candidate dans la session d'hygiène (`D-GIT-BRANCH-HYGIENE`).

---

## Dernière session

- **SESSION-2026-11-12-V8-B-2** (clôturée) : Reverse Engineering — liaison Demande → Projet RE, ajout d'étape.
  - **V8-B-2-a** : lecture + diagnostic du bug "Projet introuvable" (bouton Méthode 3 passait l'ID Request à la page Projet RE). HEAD `16e178e`, working tree propre.
  - **V8-B-2-b** : correction backend `createREProjectFromRequest` (liaison Prisma `RequestToReverseEngineeringProject`) + modification bouton `demande-detail-client.tsx` (redirige vers le vrai `projectId`). PR #50 mergée, 3 checks CI verts.
  - **V8-B-2-c** : correction `AddREStepSchema` (`uuid` → `cuid`) dans `src/lib/actions/reverse-engineering.ts` (bug "Erreur lors de l'ajout de l'étape"). PR #52 mergée, 3 checks CI verts.
  - **V8-B-2-d** : 1 test E2E ajout étape dans `e2e/admin/reverse-engineering.spec.ts` (10 passed au total), correction du label "Nom de l'étape" (typo). PR #53 mergée, 3 checks CI verts.
  - **Total** : 4 PR mergées (#50, #51, #52, #53), 3 checks CI verts à chaque PR.

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
