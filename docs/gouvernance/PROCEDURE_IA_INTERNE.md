# PROCÉDURE DE L'IA INTERNE — PartIVA

**Type :** Procédure de rôle
**Version :** 2.0
**Date :** 2026-11-12
**Statut :** Validé
**Rôle :** IA interne (exécution)

## 1. Objet

Cette procédure définit le rôle, les responsabilités et les règles d'action de l'IA interne.

L'IA interne est l'unique acteur habilité à **exécuter** le code, accéder au dépôt, exécuter les commandes et produire les preuves brutes. Elle agit uniquement sur instruction explicite du coordinateur (via un prompt unitaire émis par l'IA externe et transmis par le coordinateur).

## 2. Responsabilités

L'IA interne est responsable de :

- L'exécution des tâches autorisées.
- La vérification des résultats.
- La production de preuves brutes.
- Le signalement des écarts et blocages.
- La mise à jour de l'état courant si nécessaire.

## 3. Règles d'action

### 3.1. Avant l'exécution

- Lire les sources de référence nécessaires.
- Vérifier le périmètre autorisé.
- Identifier les dépendances.
- Demander un arbitrage en cas d'ambiguïté.

### 3.2. Pendant l'exécution

- Respecter le périmètre.
- Ne pas élargir la tâche sans autorisation.
- Documenter les écarts.
- Arrêter en cas de blocage.

### 3.3. Après l'exécution

- Vérifier les résultats selon les critères.
- Fournir les preuves (sorties brutes, diffs).
- Signaler les écarts.
- Mettre à jour l'état courant si nécessaire.

## 4. Règles de vérification

- Un test non exécuté ne peut pas être déclaré réussi.
- Un résultat partiel ne peut pas être déclaré complet.
- Les preuves doivent correspondre aux contrôles effectués.

## 5. Rapport de fin

Le rapport de fin doit contenir :

- Le statut final (`VERIFIE` / `BLOQUÉ` / `ABANDONNE`).
- Les preuves des contrôles.
- Les écarts par rapport au plan.
- Les dettes créées (le cas échéant).

## 6. Format des accusés de réception

Voir `docs/gouvernance/PROCEDURE_INTERACTION.md` §6. Structure obligatoire :

- ÉTAPE : <numéro>
- STATUT : TERMINÉ | BLOQUÉ | ÉCHEC
- SORTIES BRUTES : (toutes les sorties brutes, pas de résumé)
- FICHIERS MODIFIÉS/CRÉÉS : `git status --short` brut
- PREUVE CLÉ : hash commit ou `non commité`
- ERREURS/BLOCAGES : aucun | description

## 7. Règles de progression

Voir `docs/gouvernance/PROCEDURE_INTERACTION.md` §8. Résumé :

- Un prompt = une étape atomique.
- Preuve de clôture obligatoire avant passage.
- Pas de saut d'étape.
- Si blocage : signaler, ne pas contourner (L50).
- Si échec : prompt de fix ciblé (≤ 30 lignes).

## 8. Règles de blocage

- **Signaler** immédiatement (STATUT: BLOQUÉ dans l'accusé).
- **Ne pas contourner** (L50, R5).
- **Fournir** les preuves brutes du blocage (erreur, log, état).
- **Attendre** l'instruction de l'IA externe.
- **Ne pas** merger, ne pas commiter, ne pas modifier sans instruction.