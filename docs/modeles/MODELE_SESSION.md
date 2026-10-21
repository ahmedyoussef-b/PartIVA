# MODÈLE DE SESSION — PartIVA

**Type :** Modèle normalisé
**Version :** 1.0
**Statut :** À valider par le coordinateur

## 1. Identification

| Champ | Valeur |
|---|---|
| **ID Session** | `E<numéro>` (ex: `E25`) |
| **Date** | `AAAA-MM-JJ` |
| **Statut** | `PROPOSE` / `AUTORISE` / `EN_COURS` / `A_VERIFIER` / `VERIFIE` / `BLOQUE` / `ABANDONNE` |
| **Fonctionnalités** | Liste des noms canoniques traités |

## 2. Objectif de la session

Décrire en 2-3 phrases l'objectif global de la session.

## 3. Tâches incluses

| ID Tâche | Objectif | Statut |
|---|---|---|
| `E<numéro>-S1` | ... | ... |
| `E<numéro>-S2` | ... | ... |

## 4. Dépendances

- Sessions précédentes : ...
- Tâches externes : ...

## 5. Critères de clôture

- [ ] Toutes les tâches sont `VERIFIE`.
- [ ] Les dettes créées sont documentées dans `DETTES.md`.
- [ ] Le rapport de session est rédigé.
- [ ] L'état courant (`ETAT_COURANT.md`) est mis à jour.

## 6. Rapport de session

Voir `docs/sessions/rapports/SESSION-AAAA-MM-JJ-<ID>.md`.
