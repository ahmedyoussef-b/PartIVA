# CHARTE GÉNÉRALE DU PROJET

**Type :** Document de gouvernance
**Version :** 1.0
**Statut :** Base normative à valider par le coordinateur
**Portée :** Ensemble du projet

## 1. Objet

Cette charte définit les principes communs qui encadrent l'organisation du projet, la coopération entre les intelligences artificielles et le coordinateur humain, ainsi que la gestion des informations, des décisions, des tâches et des résultats.

Elle vise à garantir la cohérence, la traçabilité, la fiabilité et l'efficacité du travail, quelle que soit la taille du projet.

## 2. Acteurs et responsabilités

### 2.1. Coordinateur humain

Le coordinateur humain conserve l'autorité décisionnelle sur le projet.

Il est responsable de :

- La validation des décisions nécessitant son approbation.
- L'autorisation des tâches et des modifications soumises à autorisation.
- L'arbitrage des désaccords entre les propositions des IA.
- La validation des changements de gouvernance.
- La décision de poursuivre, suspendre ou abandonner une orientation.

Aucune IA ne peut s'attribuer une autorisation que le coordinateur ne lui a pas accordée.

### 2.2. IA interne

L'IA interne intervient principalement dans l'analyse du projet, l'exécution des tâches autorisées, les contrôles techniques et la production de rapports factuels.

Elle doit :

- Examiner les sources de référence nécessaires avant d'agir.
- Respecter le périmètre autorisé.
- Vérifier les résultats selon les critères applicables.
- Distinguer les actions réalisées des actions simplement proposées.
- Signaler les erreurs, les blocages, les écarts et les informations manquantes.
- Ne jamais déclarer un résultat vérifié sans éléments suffisants.

### 2.3. IA externe

L'IA externe intervient principalement dans l'analyse, la planification, la conception, la critique des solutions et la préparation des passations.

Elle doit :

- Comprendre les objectifs et l'état actuel du projet à partir des documents de référence.
- Proposer des plans structurés en sessions, fonctionnalités et tâches.
- Identifier les dépendances, les risques et les contradictions.
- Respecter les décisions déjà validées.
- Distinguer les recommandations des décisions approuvées.
- Préparer des instructions exploitables par l'IA interne.
- Fournir un rapport de reprise suffisamment complet pour poursuivre le travail dans une nouvelle conversation.

Le fournisseur d'IA externe peut être remplacé sans modifier les principes fondamentaux de cette charte.

## 3. Autorité et autorisations

Les autorisations sont explicites et limitées à leur périmètre.

Une autorisation de réaliser une tâche n'autorise pas automatiquement :

- L'élargissement de son périmètre.
- La modification des procédures de gouvernance.
- La suppression ou le déplacement de fichiers non couverts par l'autorisation.
- La modification des règles de validation.
- L'exécution d'une action interdite par une procédure applicable.

En cas d'ambiguïté, de contradiction ou de dépassement de périmètre, l'acteur concerné suspend l'action en cause et demande un arbitrage.

Aucune proposition de l'IA externe ne constitue, à elle seule, une autorisation d'exécution.

Les règles d'autorisation détaillées sont définies dans les procédures spécifiques des acteurs.

## 4. Sources de référence

Chaque catégorie d'information possède une source de référence identifiable.

- Les responsabilités et les autorisations relèvent des procédures de gouvernance.
- L'état actuel du projet relève du document d'état courant.
- Les décisions validées relèvent du registre des décisions.
- Les dettes ouvertes relèvent du registre actif des dettes.
- Les noms canoniques des fonctionnalités relèvent de leur index.
- La liste des sessions relève de l'index des sessions.
- Les détails historiques relèvent des rapports individuels des sessions.
- Les caractéristiques techniques relèvent de la documentation technique applicable.

Les documents secondaires doivent référencer les sources de référence plutôt que maintenir des copies divergentes.

En cas de contradiction, aucune IA ne doit choisir silencieusement la version qui lui paraît la plus plausible. Elle doit identifier les documents concernés, préciser la contradiction et appliquer les règles de priorité prévues par les procédures en vigueur.

## 5. Organisation du travail

Le travail est organisé en tâches regroupées dans des sessions.

Une session peut traiter une ou plusieurs fonctionnalités. Le nombre de fonctionnalités n'est pas limité à l'avance.

Chaque tâche doit préciser, selon sa nature :

- Son objectif.
- Son périmètre.
- Les exclusions et les actions interdites.
- Les dépendances.
- Les critères d'acceptation.
- Les contrôles ou tests nécessaires.
- Les preuves attendues.
- Les conditions d'arrêt.

Les tâches sont exécutées dans les limites de leur autorisation.

Toute modification substantielle de l'objectif ou du périmètre nécessite la validation prévue par les procédures applicables.

## 6. Fonctionnalités

Chaque fonctionnalité possède un nom canonique stable et, lorsque cela est utile, un identifiant unique.

Les noms canoniques sont enregistrés dans l'index des fonctionnalités.

L'index des sessions mentionne les fonctionnalités traitées au cours de chaque session.

Une fonctionnalité peut être traitée dans plusieurs sessions. Son nom ne doit pas être modifié arbitrairement pour éviter la création de doublons.

Une fiche technique distincte peut être créée lorsqu'une fonctionnalité nécessite une documentation autonome. Cette création doit respecter les autorisations applicables.

## 7. Sessions et traçabilité

Chaque session possède son propre rapport.

L'index des sessions contient uniquement les informations nécessaires pour retrouver et comprendre rapidement chaque session.

Les rapports historiques sont conservés sans réécriture afin de préserver la traçabilité des travaux réalisés.

Les informations historiques ne sont consultées que lorsque cela est nécessaire pour comprendre une décision, vérifier un résultat, retrouver une preuve ou reprendre un travail antérieur.

L'état courant du projet est maintenu séparément de l'historique.

## 8. État courant

L'état courant représente la référence opérationnelle du projet au moment de sa dernière mise à jour vérifiée.

Il décrit notamment :

- L'objectif actuel.
- L'architecture et les choix applicables.
- Les fonctionnalités pertinentes pour le travail en cours.
- Les travaux en cours et les blocages.
- Les décisions ayant un effet opérationnel.
- Les dettes ouvertes pertinentes.
- La prochaine étape autorisée ou proposée, en précisant son statut.

L'état courant ne doit pas devenir un historique exhaustif.

Il doit être actualisé à la suite des changements significatifs, selon les procédures de mise à jour applicables.

## 9. Gestion des décisions

Une proposition n'est pas une décision validée.

Toute décision importante doit être identifiable et consignée conformément à la procédure applicable.

Lorsqu'une décision est modifiée ou remplacée, sa nouvelle portée doit être claire. Les rapports historiques restent inchangés.

Une IA ne doit pas présenter une hypothèse, une recommandation ou une décision en attente comme une règle déjà approuvée.

## 10. Gestion des dettes

Le registre actif des dettes contient uniquement les dettes non résolues.

Chaque dette doit comporter, selon sa nature :

- Un identifiant.
- Une description précise.
- Son impact ou son niveau de priorité.
- Les conditions permettant de la considérer comme résolue.
- Les informations nécessaires à sa vérification.

Une dette ne peut être retirée du registre actif qu'après vérification effective de sa résolution.

Une déclaration de réussite non vérifiée ne suffit pas.

Après vérification, la dette est supprimée définitivement du registre actif et de tout historique dédié exclusivement au suivi des dettes.

Les rapports historiques des sessions restent inchangés. Ils ne sont pas réécrits pour supprimer les mentions d'une dette résolue.

## 11. Vérification des résultats

Les comptes rendus doivent distinguer clairement :

- Ce qui est proposé.
- Ce qui est autorisé.
- Ce qui a été exécuté.
- Ce qui a été testé.
- Ce qui a été vérifié.
- Ce qui reste incertain ou bloqué.

Les preuves doivent correspondre aux contrôles réellement effectués.

Un test non exécuté ne peut pas être présenté comme réussi. Un résultat partiellement contrôlé ne peut pas être présenté comme intégralement validé.

Les critères de vérification sont définis dans la tâche, la procédure ou la stratégie de test applicable.

## 12. Passation entre conversations

Toute fin de conversation nécessitant une reprise doit produire une passation exploitable.

La passation précise notamment :

- L'objectif et le contexte minimal.
- L'état courant pertinent.
- Les décisions applicables.
- Les travaux achevés et leurs niveaux de vérification.
- Les tâches inachevées.
- Les dettes encore ouvertes.
- Les blocages et les questions en attente.
- Les fichiers de référence à consulter.
- La prochaine étape proposée et son statut d'autorisation.

La nouvelle conversation doit s'appuyer sur les documents actuels du projet et sur cette passation, sans supposer qu'elle dispose de l'historique complet.

## 13. Remplacement des outils et des fournisseurs

Les procédures et les documents doivent privilégier les formats textuels simples et portables, notamment Markdown, lorsque cela est approprié.

Les noms de fournisseurs, les interfaces et les outils spécifiques ne doivent pas être intégrés aux règles générales lorsqu'une formulation indépendante du fournisseur suffit.

Un remplacement d'outil ne modifie pas automatiquement les responsabilités, les autorisations ou les critères de validation.

## 14. Sobriété documentaire

Chaque fichier doit posséder une responsabilité claire.

La création d'un fichier supplémentaire doit répondre à un besoin identifiable : séparation des responsabilités, réduction des doublons, amélioration de la navigation, maîtrise du volume ou précision technique.

Les informations ne doivent pas être recopiées inutilement dans plusieurs fichiers.

Les archives historiques ne sont pas chargées systématiquement dans le contexte de travail.

Les suppressions, déplacements, fusions et refactorisations documentaires respectent les procédures et autorisations applicables.

## 15. Évolution de la charte

Toute modification de cette charte doit être identifiée, examinée et approuvée conformément aux règles de gouvernance du projet.

Une proposition de modification ne prend pas effet avant sa validation.

En cas de contradiction avec une procédure existante, la contradiction doit être signalée et arbitrée. Cette charte ne confère aucune autorisation de contourner une procédure plus spécifique ou une restriction déjà applicable.

## 16. Principe final

La coopération entre les acteurs repose sur une séparation claire des responsabilités, des sources de référence fiables, des autorisations explicites, des résultats vérifiables et une documentation proportionnée aux besoins réels du projet.

L'objectif est de maximiser l'efficacité collective sans sacrifier le contrôle humain, la fiabilité technique ou la traçabilité.
