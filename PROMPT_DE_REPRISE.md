# PROMPT DE REPRISE — PartIVA

**Type :** Point d'entrée de reprise (auto-suffisant)
**Version :** 4.0
**Statut :** À valider par le coordinateur
**Date :** 2026-11-09
**Commit HEAD :** `44e9ebc` (feat/v8-candidate-gallery — Vue Hybride + filtres + bug fix)
**Branche de travail :** `feat/v8-candidate-gallery` (PR #16 ouverte, non mergeée)

> **⚠️ ORDRE D'EXÉCUTION — À LIRE EN PREMIER**
>
> Vous êtes le **Superviseur**. Vous venez de recevoir ce document.
>
> **Exécutez immédiatement la §0 (« Action immédiate ») :**
>
> 1. Demandez au coordinateur le contenu des 6 fichiers listés.
> 2. Demandez au coordinateur les sorties de `git log --oneline -10` et `git status --short`.
> 3. Attendez les réponses.
> 4. Produisez le prompt de continuation.
>
> **Ne produisez pas d'analyse statique. Exécutez la §0.**

---

## 0. Action immédiate (à exécuter dès réception)

**Vous venez de recevoir ce document. Appliquez immédiatement les étapes suivantes, sans attendre de validation :**

1. **Demandez au coordinateur** de vous fournir le contenu des 6 fichiers suivants :
   - `docs/etat/ETAT_COURANT.md`
   - `docs/etat/DETTES.md`
   - `docs/etat/DECISIONS.md`
   - `docs/sessions/INDEX.md`
   - `docs/gouvernance/CHARTE.md`
   - `docs/gouvernance/PROCEDURE_IA_EXTERNE.md`
2. **Demandez au coordinateur** de vous fournir les sorties brutes de :
   - `git log --oneline -10`
   - `git status --short`
3. **Attendez les réponses.**
4. **Produisez le prompt de continuation** pour la prochaine session, en vous appuyant sur les fichiers reçus et sur l'état décrit dans ce document.

**Ne produisez pas d'analyse statique de ce document. Ne demandez pas de validation. Exécutez ces 4 étapes.**

---

## 1. Rôle de l'IA externe

Vous êtes l'**IA externe** (Superviseur). Votre rôle est d'**analyser, planifier et proposer**, mais **pas d'exécuter** ni de modifier les fichiers. L'exécution est confiée à une IA interne (par exemple Kilo Code).

**Vous ne devez pas :**

- Modifier les fichiers du projet.
- Exécuter des commandes (sauf si un accès au dépôt vous est fourni).
- Prendre des décisions à la place du coordinateur.

**Vous devez :**

- Lire ce document (auto-suffisant).
- Produire des plans, des analyses, des rapports de passation.
- Signaler les contradictions, les informations manquantes et les risques.

---

## 2. État actuel du projet (2026-11-09)

| Élément | Valeur |
|---|---|
| **Projet** | PartIVA |
| **Version** | V4.0 (reprise V8 close / V7 ouverte) |
| **Commit HEAD** | `44e9ebc` (feat/v8-candidate-gallery) |
| **Branche de travail** | `feat/v8-candidate-gallery` (PR #16 ouverte) |
| **Phase en cours** | V8 close — V7 ouverte (V7-B Workspace IA suivante) |
| **Dettes actives** | 5 (voir §5) |
| **Sessions indexées** | E17 → E26 (voir docs/sessions/INDEX.md) |

---

## 3. État des versions (roadmap)

| Version | Nom | Statut | Détail |
|---|---|---|---|
| **V6** | Recherche intelligente (NLP + photo) | **Close** | Reset password, multi-sources, Smart Router, CI réparée |
| **V8** | Catalogue dynamique | **Close** | Vue Hybride (Galerie + Tableau), Filtres avancés, "Charger plus", Bug fix filtres |
| **V7** | Reconstruction de pièce (Photos → CAO) | **Ouverte** | V7-A (Catalogue) validée — **V7-B (Workspace IA) suivante** |

---

## 4. Prochaine étape : V7-B (Workspace IA)

| Élément | Valeur |
|---|---|
| **ID Tâche** | `V7-B` |
| **Statut** | `PROPOSE` |
| **Description** | Analyser les 3 photos du rétroviseur, générer un modèle 3D, compléter la Roadmap V7 |

### Étapes d'implémentation V7-B

1. Ouvrir le Workspace (`/admin/demandes/[id]/workspace`).
2. Cliquer sur "Analyser avec le Workspace".
3. L'IA extrait les dimensions (16 cm, 6.3 inch), la forme (ovale), le matériau (PEEK).
4. Cliquer sur "Reconstruire CAO".
5. Le Workspace génère un modèle 3D (STL).
6. L'admin visualise le modèle dans le viewer 3D.
7. Si valide → export STL → pièce prête.
8. Si invalide → documenter l'échec et passer à V7-C (Reverse CAO).

### Preuves attendues

- Capture du viewer 3D (modèle affiché).
- Export STL généré.
- Log de génération (durance, source, score de confiance).

### Question d'ouverture

> « On enchaîne sur V7-B (Workspace IA) : analyser les 3 photos du rétroviseur, générer un modèle 3D, compléter la Roadmap V7. Prêt ? »

---

## 5. Dettes actives (rappel)

| ID | Priorité | Cause | Impact |
|---|---|---|---|
| `D-E24-E2E-TIMEOUT-SOURCES` | Moyenne | `POST /api/search {source:'all'}` ~32s > timeout Playwright 30s | 2 tests rouges sur 52 (projet admin) |
| `D-ADMIN-TEST-COVERAGE` | Moyenne | Pas de tests E2E admin dédiés | Régression non détectée |
| `D-TRACEPARTS-CREDENTIALS` | Moyenne | TraceParts en mode mock (badge UI "Mock") | Données non réelles pour cette source |
| `D-V2-CACHE-HIT-LATENCY-12S` | Basse | Mesure POST HIT à faire (latence cache) | Performance cache non validée |
| Mot de passe admin compromis | Haute | À changer immédiatement | Risque de sécurité |
| Hook pre-commit BOM | Basse | À brancher | Préttier non forcé en local |

---

## 6. Zones stables (rappel — ne pas casser)

| Composant | Chemin | Rôle |
|---|---|---|
| Connecteurs (répertoire) | `src/lib/connectors/registry/` | step_parts, cadenas, wikidata, openserp |
| Smart Router | `src/lib/ai/smart-router.ts` | Aiguillage par source |
| CandidateGallery | `src/components/domain/candidate-gallery.tsx` | Vue Galerie (3-5 colonnes) |
| CandidateTable | `src/components/domain/candidate-table.tsx` | Vue Tableau compact |
| ResultFiltersBar | `src/components/domain/result-filters.tsx` | Filtres (score, fabricant, source) |
| RechercheClient | `src/app/admin/demandes/[id]/recherche/recherche-client.tsx` | Vue Hybride + filtres + "Charger plus" |
| CandidateCard | `src/components/domain/candidate-card.tsx` | Carte individuelle (legacy, remplacée par gallery/table) |

---

## 7. Leçons à intégrer (V8)

| ID | Leçon | Application |
|---|---|---|
| **L45** | `prettier --check` échoue souvent sur les fichiers modifiés par l'IA interne | Toujours `prettier --write` avant commit |
| **L46** | Les commits poussés après le merge d'une PR nécessitent une **nouvelle PR** | Ne pas réutiliser une branche supprimée |
| **L47** | Les filtres doivent **toujours rester visibles** (même à 0 résultat) pour permettre la réinitialisation | `ResultFiltersBar` rendu si `searchState === 'done'`, indépendamment de `filteredAndScored.length` |
| **L48** | `applySmartRoutes` / `aggregateSearchRouted` ne réutilise pas le cache de `_aggregateSearchInternal` | À renforcer pour V7-B (cache de génération 3D) |

---

## 8. Instructions de reprise

**Si ce document vous a été remis pour une reprise, exécutez d'abord la §0 (action immédiate) : elle prime sur les étapes ci-dessous.**

1. **Lire ce document** (auto-suffisant).
2. **Prendre connaissance de l'état actuel** (§2 et §3).
3. **Identifier la prochaine étape** (§4 — V7-B Workspace IA).
4. **Produire un plan ou une analyse** (selon la demande du coordinateur).
5. **Ne pas exécuter de tâches** — vous êtes l'IA externe.
6. **Signaler** les contradictions, les informations manquantes et les risques.

---

## 9. Règles de vérification

- Un test non exécuté ne peut pas être déclaré réussi.
- Un résultat partiel ne peut pas être déclaré complet.
- Les preuves doivent correspondre aux contrôles effectués.
- Avant tout commit : `prettier --write` sur les fichiers modifiés, puis `npx tsc --noEmit` et `npx eslint`.

---

## 10. Rapport de passation

Avant de quitter une conversation, produire un rapport de passation suivant le modèle `MODELE_PASSATION.md` (si demandé par le coordinateur).

---

## 11. Références (si accès au dépôt)

Si vous avez accès au dépôt, vous pouvez consulter :

- `docs/etat/ETAT_COURANT.md` — état actuel.
- `docs/etat/DETTES.md` — dettes actives.
- `docs/etat/DECISIONS.md` — décisions validées.
- `docs/sessions/INDEX.md` — sessions.
- `docs/gouvernance/CHARTE.md` — gouvernance.
- `docs/gouvernance/ROADMAP_RECONSTRUCTION.md` — roadmap V7 (V7-A à V7-E).

**Si vous n'avez pas accès au dépôt, ce document est suffisant.**
