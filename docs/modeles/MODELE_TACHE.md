# MODÈLE DE TÂCHE — PartIVA

**Type :** Modèle normalisé
**Version :** 1.0
**Statut :** À valider par le coordinateur

## 1. Identification

| Champ | Valeur |
|---|---|
| **ID** | `E<numéro>-<sous-étape>` (ex: `E25-S1`) |
| **Session** | Numéro de session |
| **Fonctionnalité** | Nom canonique de la fonctionnalité concernée |
| **Statut** | `PROPOSE` / `AUTORISE` / `EN_COURS` / `A_VERIFIER` / `VERIFIE` / `BLOQUE` / `ABANDONNE` |

## 2. Objectif

Décrire en 2-3 phrases ce que la tâche doit accomplir.

## 3. Périmètre autorisé

**Fichiers modifiables :**

- `chemin/vers/fichier1.ts`
- `chemin/vers/fichier2.ts`

**Fichiers à créer :**

- `chemin/vers/nouveau-fichier.ts`

**Actions autorisées :**

- Lire, créer, modifier les fichiers listés ci-dessus.
- Exécuter les commandes de test listées dans la section « Contrôles ».

**Actions interdites :**

- Modifier les fichiers hors périmètre.
- Supprimer des fichiers.
- Effectuer un commit.
- Modifier les procédures de gouvernance.

## 4. Dépendances

- Tâches précédentes nécessaires : `E<numéro>-<sous-étape>` (le cas échéant).
- Variables d'environnement requises : (le cas échéant).

## 5. Critères d'acceptation

- [ ] Le fichier X contient la fonction Y.
- [ ] Le test Z passe.
- [ ] Aucune erreur de lint/typecheck/format.

## 6. Contrôles

| Contrôle | Commande | Résultat attendu |
|---|---|---|
| Lint | `npm run lint` | `0` |
| Typecheck | `npm run typecheck` | `0` |
| Format | `npm run format:check` | `0` |
| Test E2E | `npm run test:e2e` | `X passed` |

## 7. Preuves attendues

- Sortie brute des commandes de contrôle.
- Diff des fichiers modifiés (ou `git status`).
- Description des écarts par rapport au plan (le cas échéant).

## 8. Conditions d'arrêt

- Si un contrôle échoue → arrêter, signaler l'erreur, ne pas commit.
- Si le périmètre est ambigu → demander un arbitrage, ne pas élargir.
- Si une dépendance est manquante → signaler, ne pas contourner.

## 9. Rapport de fin

Le rapport de fin doit contenir :

- Le statut final (`VERIFIE` / `BLOQUE` / `ABANDONNE`).
- Les preuves des contrôles.
- Les écarts par rapport au plan.
- Les dettes créées (le cas échéant).
