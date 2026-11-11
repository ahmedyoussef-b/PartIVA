# PROCÉDURE DU COORDINATEUR — PartIVA

**Type :** Procédure de rôle
**Version :** 1.0
**Statut :** À valider par le coordinateur
**Rôle :** Coordinateur humain

## 1. Objet

Cette procédure définit le rôle, les responsabilités et les règles d'action du coordinateur humain.

## 2. Responsabilités

Le coordinateur est responsable de :

- La validation des décisions importantes.
- L'autorisation des tâches et des modifications.
- L'arbitrage des désaccords entre les IA.
- La validation des changements de gouvernance.
- Le suivi de l'état du projet.

## 3. Règles d'action

### 3.1. Autorisation des tâches

- Toute tâche doit être explicitement autorisée avant exécution.
- Une autorisation est limitée à son périmètre.
- Le coordinateur peut déléguer l'exécution, mais pas la validation finale.

### 3.2. Gestion des désaccords

- En cas de désaccord entre l'IA interne et l'IA externe, le coordinateur arbitre.
- L'arbitrage doit être documenté dans `DECISIONS.md`.

### 3.3. Validation des résultats

- Le coordinateur valide les résultats sur la base des preuves fournies.
- Un résultat non vérifié ne peut pas être validé.

## 4. Interactions avec les IA

### 4.1. Avec l'IA interne

- L'IA interne exécute les tâches autorisées.
- Le coordinateur vérifie les preuves et valide.
- En cas de blocage, l'IA interne signale et le coordinateur arbitre.

### 4.2. Avec l'IA externe

- L'IA externe propose des plans et des analyses.
- Le coordinateur valide les plans avant exécution.
- Le coordinateur peut demander des analyses supplémentaires.

## 5. Mise à jour de l'état courant

- Le coordinateur veille à ce que `ETAT_COURANT.md` soit à jour.
- Il valide les mises à jour proposées par les IA.

## 6. Mode d'exécution R2 (Coordinateur-exécutant)

### 6.1. Absence d'IA interne séparée
Dans l'environnement actuel, il n'y a pas d'IA interne distincte. Le coordinateur humain assume le rôle d'**exécutant technique**.

### 6.2. Utilisation des blocs de commandes
Le coordinateur ne doit pas interpréter les instructions conceptuelles pour en déduire des commandes. Il doit exécuter les **blocs de commandes PowerShell** fournis explicitement par l'IA externe dans chaque sous-étape, et coller les sorties brutes telles que demandées.

### 6.3. Boucle de validation
Le coordinateur exécute la sous-étape, fournit les preuves brutes à l'IA externe, et attend la validation explicite de l'IA externe avant de passer à la sous-étape suivante. Aucune sous-étape ne peut être sautée.
