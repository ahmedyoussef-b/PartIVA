# MODÈLE DE PLAN — PartIVA

**Type :** Modèle normalisé
**Version :** 1.0
**Statut :** À valider par le coordinateur

## 1. Identification

| Champ | Valeur |
|---|---|
| **ID Plan** | `PLAN-E<numéro>` |
| **Date** | `AAAA-MM-JJ` |
| **Statut** | `PROPOSE` / `AUTORISE` / `EN_COURS` / `VERIFIE` / `ABANDONNE` |
| **Objectif global** | ... |

## 2. Sessions prévues

| ID Session | Objectif | Tâches | Dépendances |
|---|---|---|---|
| `E<numéro>` | ... | `E<numéro>-S1`, `E<numéro>-S2` | ... |

## 3. Tâches par session

### Session `E<numéro>`

| ID Tâche | Objectif | Critères d'acceptation | Effort |
|---|---|---|---|
| `E<numéro>-S1` | ... | ... | Faible/Moyen/Élevé |

## 4. Dépendances entre sessions

- `E<numéro>` dépend de `E<numéro-1>` pour ...
- ...

## 5. Risques identifiés

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| ... | ... | ... | ... |

## 6. Critères de validation du plan

- [ ] Toutes les sessions ont un objectif clair.
- [ ] Les dépendances sont documentées.
- [ ] Les risques sont identifiés.
- [ ] Le plan est approuvé par le coordinateur.

## 7. Autorisations requises

- Validation du coordinateur pour démarrer la session `E<numéro>`.
- Autorisation des modifications de fichiers hors périmètre.
