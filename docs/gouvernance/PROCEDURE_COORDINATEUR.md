# PROCÉDURE DU COORDINATEUR — PartIVA

**Type :** Procédure de rôle
**Version :** 2.0
**Date :** 2026-11-12
**Statut :** Validé
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
- **Le transport** : transmettre les prompts de l'IA externe vers l'IA interne, et les rapports de l'IA interne vers l'IA externe.

## 3. Règles d'action

### 3.1. Autorisation des tâches

- Toute tâche doit être explicitement autorisée avant exécution.
- Une autorisation est limitée à son périmètre.
- Le coordinateur peut déléguer l'exécution, mais pas la validation finale.
- **Le coordinateur transporte les prompts de l'IA externe vers l'IA interne, et les rapports de l'IA interne vers l'IA externe.** Il n'exécute pas lui-même les tâches techniques.

### 3.2. Gestion des désaccords

- En cas de désaccord entre l'IA interne et l'IA externe, le coordinateur arbitre.
- L'arbitrage doit être documenté dans `DECISIONS.md`.

### 3.3. Validation des résultats

- Le coordinateur valide les résultats sur la base des preuves fournies.
- Un résultat non vérifié ne peut pas être validé.

### 4. Interactions avec les IA

#### 4.1. Avec l'IA interne

- L'IA interne exécute les tâches autorisées.
- Le coordinateur vérifie les preuves et valide.
- En cas de blocage, l'IA interne signale et le coordinateur arbitre.
- **Le coordinateur transporte les prompts de l'IA externe vers l'IA interne.**

#### 4.2. Avec l'IA externe

- L'IA externe propose des plans et des analyses.
- Le coordinateur valide les plans avant exécution.
- Le coordinateur peut demander des analyses supplémentaires.
- **Le coordinateur transporte les rapports de l'IA interne vers l'IA externe.**

### 5. Mise à jour de l'état courant

- Le coordinateur veille à ce que `ETAT_COURANT.md` soit à jour.
- Il valide les mises à jour proposées par les IA.

### 6. Mode d'exécution R2 (Coordinateur-exécutant)

#### 6.1. Rôle du coordinateur : transporteur

Le coordinateur **ne joue pas le rôle d'exécutant technique**. Son rôle est de **transporter** :

- Les prompts de l'IA externe vers l'IA interne.
- Les rapports de l'IA interne vers l'IA externe.

Le coordinateur ne doit pas interpréter les instructions conceptuelles pour en déduire des commandes. Il doit exécuter les **blocs de commandes PowerShell** fournis explicitement par l'IA externe dans chaque sous-étape, et coller les sorties brutes telles que demandées.

#### 6.2. Boucle de validation

Le coordinateur exécute la sous-étape, fournit les preuves brutes à l'IA externe, et attend la validation explicite de l'IA externe avant de passer à la sous-étape suivante. Aucune sous-étape ne peut être sautée.