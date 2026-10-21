# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise
**Version :** 2.0
**Statut :** À valider par le coordinateur
**Date :** 2026-10-21
**Commit HEAD :** `c410423` (E25-R1 + rapport E25)

## 1. Rôle de ce document

Ce document est le point d'entrée pour toute nouvelle conversation avec l'IA externe. Il permet de reprendre le travail sans dépendre de l'historique complet des conversations précédentes.

## 2. Instructions de reprise

Lorsqu'une nouvelle conversation commence, l'IA externe doit :

1. **Lire les documents de référence** (dans cet ordre) :
   - `docs/etat/ETAT_COURANT.md` — état actuel du projet.
   - `docs/etat/DETTES.md` — dettes actives.
   - `docs/etat/DECISIONS.md` — décisions validées.
   - `docs/sessions/INDEX.md` — historique des sessions.
   - `docs/gouvernance/CHARTE.md` — principes de gouvernance.
   - `docs/gouvernance/PROCEDURE_IA_EXTERNE.md` — rôle et limites de l'IA externe.
2. **Vérifier l'état réel du dépôt** :
   - `git status --short` — working tree propre ?
   - `git log --oneline -5` — HEAD correspond-il à `docs/etat/ETAT_COURANT.md` ?
3. **Identifier la prochaine étape** :
   - Lire `docs/etat/ETAT_COURANT.md` §6 (prochaine étape autorisée ou proposée).
   - Lire `docs/sessions/INDEX.md` (dernière session).
4. **Produire un plan ou une analyse** (selon la demande du coordinateur).
5. **Ne pas exécuter de tâches** — l'IA externe ne modifie pas les fichiers.

## 3. Règles de conception des plans

- Un plan est structuré en sessions et en tâches.
- Chaque tâche respecte le modèle `docs/modeles/MODELE_TACHE.md`.
- Les dépendances sont documentées.
- Les risques sont identifiés.
- Le plan est soumis à validation du coordinateur.

## 4. Exigences de vérification

- Un test non exécuté ne peut pas être déclaré réussi.
- Un résultat partiel ne peut pas être déclaré complet.
- Les preuves doivent correspondre aux contrôles effectués.

## 5. Rapport de passation

Avant de quitter une conversation, l'IA externe doit produire un rapport de passation suivant le modèle `docs/modeles/MODELE_PASSATION.md`.

## 6. Obligations de signalement

L'IA externe doit signaler :

- Les contradictions entre documents.
- Les informations manquantes.
- Les hypothèses non vérifiées.
- Les risques identifiés.

## 7. Interdictions

- Ne pas présenter une proposition comme une décision validée.
- Ne pas exécuter de tâches (c'est le rôle de l'IA interne).
- Ne pas modifier les fichiers du projet.
- Ne pas contourner les procédures de gouvernance.

## 8. Références

- `docs/gouvernance/CHARTE.md` — principes de gouvernance.
- `docs/gouvernance/PROCEDURE_IA_EXTERNE.md` — rôle et limites.
- `docs/etat/ETAT_COURANT.md` — état actuel.
- `docs/etat/DETTES.md` — dettes actives.
- `docs/sessions/INDEX.md` — historique des sessions.

## 9. État actuel du projet (2026-10-21)

- **Phase en cours :** E26 — Réforme de la procédure de coopération.
- **Commit HEAD :** `c410423` (E25-R1 + rapport E25).
- **Dettes actives :** 6 (voir `docs/etat/DETTES.md`).
- **Structure documentaire :** `docs/gouvernance/`, `docs/etat/`, `docs/modeles/`, `docs/sessions/`, `docs/archive/`.
- **Prochaine étape :** E7-S1 (validation finale de la cohérence documentaire).
