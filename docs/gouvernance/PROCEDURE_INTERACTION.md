# PROCÉDURE D'INTERACTION — PartIVA

**Type :** Procédure de coopération (source unique)
**Version :** 1.0
**Date :** 2026-11-11
**Statut :** À valider par le coordinateur

## 1. Objet

Cette procédure est la **source unique** des règles d'interaction entre l'IA externe, le coordinateur et l'IA interne. Elle centralise les règles v4 (R1-R10) et les leçons (L45-L59) pour éviter la dispersion documentaire.

En cas de contradiction avec une autre procédure, **cette procédure prévaut**.

## 2. Rôles

### 2.1. IA externe

- **Rôle** : analyser, planifier, proposer.
- **Ne fait pas** : exécuter, modifier, merger.
- **Exige** : preuves brutes (L50, R9).
- **Émet** : prompts unitaires.
- **Valide** : les accusés de réception.

### 2.2. Coordinateur

- **Rôle** : décider, valider, merger.
- **Ne fait pas** : exécuter les tâches techniques.
- **Tranche** : les décisions (a), (b), (c), etc.
- **Merge** : les PR (R4, §10).

### 2.3. IA interne

- **Rôle** : exécuter, fournir preuves brutes.
- **Ne fait pas** : décider, merger, contourner.
- **Signale** : blocages, écarts, dettes.
- **Produit** : accusés de réception.

## 3. Règles v4 (R1-R10)

| # | Règle |
|---|---|
| **R1** | Pas de modification de code sans `Get-Content` / `git show`. |
| **R2** | Pas de commit sans preuve (sorties brutes). |
| **R3** | Pas de PR sans 3 checks verts (`ESLint + Prettier`, `TypeScript`, `Build`). |
| **R4** | Pas de merge sans `gh pr checks` verts. |
| **R5** | Pas de `--admin` pour bypasser les checks. |
| **R6** | Pas de `git push master` direct (`enforce_admins:true`). |
| **R7** | Toujours `prettier --write` avant commit (L45). |
| **R8** | Toujours vérifier `git status` avant et après les modifications. |
| **R9** | Toujours coller les sorties brutes (pas de résumés). |
| **R10** | Pas de `<N>` dans PowerShell (utiliser `17` au lieu de `<17>`). |

## 4. Leçons (L45-L59)

Les leçons L45-L59 sont documentées en détail dans `docs/etat/DECISIONS.md` §7. Résumé :

- **L45** : `prettier --write` avant commit.
- **L46** : nouvelle PR après merge (ne pas réutiliser une branche supprimée).
- **L47** : filtres toujours visibles (même à 0 résultat).
- **L48** : cache non réutilisé par `applySmartRoutes`.
- **L49** : `prisma db execute --file` si P1000.
- **L50** : un rapport n'est pas une preuve.
- **L51** : `git show --name-only` après commit.
- **L52** : `git checkout -b` pour créer + basculer.
- **L53** : preuve de lecture avant modification.
- **L54** : `git diff` vide = pas de modification.
- **L55** : `WriteAllText` + `UTF8Encoding($false)`.
- **L56** : fichiers > 100 lignes = WriteAllText complet.
- **L57** : `-SimpleMatch` pour littéraux.
- **L58** : `git diff --name-only <merge>^1 <merge>` pour merge commit.
- **L59** : `Get-ChildItem -Recurse` (pas de globstar).

## 5. Format des prompts unitaires

Structure obligatoire :

```
=== PROMPT UNITAIRE — <étape> ===
RÔLE : IA interne. Aucun commit. Aucun push.
PRÉREQUIS : <étape précédente close>.
CONTRAINTE : <périmètre>.

TÂCHE 1 — LECTURE (UTF8, L55)
<Get-Content ciblés>

TÂCHE 2 — ÉDITION
<actions ciblées, L55>

TÂCHE 3 — PREUVES
<tsc, eslint, prettier, git diff, git status>

PREUVE DE CLÔTURE : ACCUSÉ V8-<étape>.
INTERDIT : <interdictions>
FIN DU PROMPT.
```

**Règle de contenu** : un prompt unitaire doit contenir le **contenu exact** des fichiers à créer/modifier (ou diff cible), pas seulement une structure.

## 6. Format des accusés de réception

Structure obligatoire :

```
=== ACCUSÉ DE RÉCEPTION — <étape> ===
ÉTAPE : <étape>
STATUT : TERMINÉ | BLOQUÉ | ÉCHEC
SORTIES BRUTES :
  [cmd 1] <brut>
  [cmd 2] <brut>
  ...
FICHIERS MODIFIÉS/CRÉÉS : <git status --short brut>
PREUVE CLÉ : <hash commit OU "non commité">
ERREURS/BLOCAGES : <aucun | description>
=== FIN ACCUSÉ ===
```

## 7. Cycle de travail

0. **IA interne** lit les 4 fichiers de procédure (cf. `PROMPT_DE_REPRISE.md` §Ordre strict) et envoie le message `READY — <fichiers lus> — prêt`. L'IA externe attend ce message avant d'émettre le prompt de la première tâche.
1. **IA externe** émet un prompt unitaire.
2. **IA interne** exécute et fournit l'accusé.
3. **IA externe** valide ou signale un fix.
4. **Coordinateur** merge la PR.
5. **IA externe** émet l'étape suivante.
6. **Régénérer** `PROMPT_DE_REPRISE.md` (à chaque fin d'étape).

**Règle de régénération** : après chaque merge ou clôture d'étape documentée, régénérer `PROMPT_DE_REPRISE.md` (avec le nouveau HEAD et la nouvelle prochaine étape).

## 8. Règles de progression

- **Un prompt = une étape atomique.**
- **Preuve de clôture obligatoire** avant passage à l'étape suivante.
- **Pas de saut** d'étape.
- **Si blocage** : signaler, ne pas contourner (L50).
- **Si échec** : émettre un prompt de fix ciblé (≤ 30 lignes).

## 9. Règles de décision

- **IA externe propose**, **coordinateur tranche**.
- Aucune décision non validée n'est appliquée.
- Les décisions validées sont documentées dans `docs/etat/DECISIONS.md`.
- Les dettes ouvertes sont documentées dans `docs/etat/DETTES.md`.

## 10. Sources de référence

- **Règles** : ce document (source unique).
- **État** : `docs/etat/ETAT_COURANT.md`.
- **Dettes** : `docs/etat/DETTES.md`.
- **Décisions** : `docs/etat/DECISIONS.md`.
- **Sessions** : `docs/sessions/INDEX.md`.
- **Reprise** : `PROMPT_DE_REPRISE.md`.

## 11. Évolution de cette procédure

Toute modification doit être :
1. Proposée par l'IA externe.
2. Validée par le coordinateur.
3. Documentée dans `DECISIONS.md`.

En cas de contradiction avec une procédure existante, **cette procédure prévaut**.

## 12. Révisions actées 2026-11-11 (session V8-B-0)

### 12.1. Mode d'exécution R2 (2 acteurs)
La procédure à 3 acteurs est **réduite à 2 acteurs** : **coordinateur-exécutant + IA externe**. Le coordinateur exécute et produit les preuves brutes ; l'IA externe rédige les prompts et valide les accusés. Dette `D-PROCEDURE-3-ACTEURS-INAPPLICABLE`.

### 12.2. Wrapper Kilo autorisé
L'outil `bash` de Kilo invoque PowerShell (`Out-File`, `Add-Content`, `Get-Content`, `WriteAllText`). Autorisé en lecture et écriture. Ce n'est pas du bash Unix. Dette `D-PROCEDURE-WRAPPER-KILO`.

### 12.3. Contrainte de longueur des prompts
Un prompt unitaire doit être **subdivisé en sous-étapes** si sa taille dépasse la limite d'acceptation de l'outil d'exécution. Chaque sous-étape produit son propre accusé §6. Méthodes d'écriture : `WriteAllText` (écrasement complet), `Add-Content`/`AppendAllText` (morceaux successifs), `Get-Content -Raw` (preuve intégrale). Dette `D-PROCEDURE-LONGUEUR-PROMPTS`.

## 13. Réforme de l'exécution et du découpage (Mode R2)

### 13.1. Découpage obligatoire (Prompt → Étapes → Sous-étapes)
Pour éviter les échecs liés à la longueur des prompts, tout prompt complexe doit être structuré de la manière suivante :
- **Le Prompt global** définit l'objectif de l'étape.
- **L'étape** est divisée en **Sous-étapes atomiques**.
- **Une sous-étape = un seul prompt émis**.
- **Règle d'attente** : L'IA externe émet la Sous-étape N. L'IA interne (ou le coordinateur-exécutant) produit l'accusé de réception et les preuves brutes. L'IA externe valide la Sous-étape N avant d'émettre la Sous-étape N+1.

### 13.2. Séparation des blocs "Instruction" et "Commandes"
Chaque sous-étape doit comporter deux parties distinctes :
1. **Le bloc "Instruction"** (conceptuel, règles, objectifs).
2. **Le bloc "Commandes PowerShell"** (spécifique au coordinateur, avec les commandes exactes à copier-coller et la preuve brute attendue).
Si l'exécution nécessite des preuves brutes, l'IA externe fournit impérativement le bloc "Commandes PowerShell" prêt à l'emploi pour le coordinateur.
