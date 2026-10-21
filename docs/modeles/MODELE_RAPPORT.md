# MODÈLE DE RAPPORT DE SESSION — PartIVA

**Type :** Modèle normalisé
**Version :** 1.0
**Statut :** À valider par le coordinateur

## 1. Identification

| Champ | Valeur |
|---|---|
| **ID Session** | `E<numéro>` |
| **Date** | `AAAA-MM-JJ` |
| **Statut final** | `VERIFIE` / `BLOQUE` / `ABANDONNE` |
| **Durée** | (optionnel) |

## 2. Objectif

Rappel de l'objectif de la session.

## 3. Tâches exécutées

| ID Tâche | Statut | Preuves |
|---|---|---|
| `E<numéro>-S1` | `VERIFIE` | (sortie brute, diff, etc.) |
| `E<numéro>-S2` | `BLOQUE` | (raison) |

## 4. Résultats vérifiés

- **Ce qui a été testé** : ...
- **Ce qui a été vérifié** : ...
- **Ce qui reste incertain** : ...

## 5. Écarts par rapport au plan

| # | Écart | Justification | Correction |
|---|---|---|---|
| 1 | ... | ... | ... |

## 6. Fichiers modifiés

| Fichier | Action | Lignes |
|---|---|---|
| `chemin/fichier.ts` | Modifié | +X / -Y |
| `chemin/nouveau.ts` | Créé | +Z |

## 7. Dettes créées

| ID Dette | Priorité | Cause |
|---|---|---|
| `D-E<numéro>-<nom>` | Moyenne | ... |

## 8. Dettes clôturées

| ID Dette | Cause de clôture | Preuve |
|---|---|---|
| `D-E<numéro>-<nom>` | ... | ... |

## 9. Prochaines étapes

- ...
- ...
