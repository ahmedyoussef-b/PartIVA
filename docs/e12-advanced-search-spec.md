# Spécification — Recherche avancée (E12-R1a)

**Date :** 2026-10-18
**Session :** E12-R1a
**Statut :** Spécification (aucun code)
**Phase :** E12 — Recherche avancée

---

## 1. Contexte

PartIVA dispose déjà de **6 modes de recherche** (`text`, `reference`, `specs`, `dimensions`, `multi`, `photo`) avec **agrégation multi-signaux** (`multi-search.ts`) et **scoring pondéré** (`scoring.ts`). Ces modes couvrent l'identification d'une pièce.

**Ce qui manque :**
- **Filtres** : restreindre les résultats par matériau, machine, statut, date.
- **Tri** : ordonner les résultats par pertinence, date, nom, statut.
- **Facettes** : agréger les résultats (nombre par matériau, machine, statut).
- **Pagination** : naviguer dans les résultats (limit/offset).

**Objectif E12 :** ajouter ces 4 fonctionnalités **sans modifier** les 6 modes existants, l'agrégation, ni le scoring.

---

## 2. Périmètre

### 2.1 — Inclus

| Fonctionnalité | Backend | Frontend |
|---|---|---|
| Filtres (matériau, machine, statut, date) | `/api/search` étendu | Panneau de filtres |
| Tri (pertinence, date, nom, statut) | `/api/search` étendu | Sélecteur de tri |
| Facettes (matériau, machine, statut) | `/api/search/facets` (nouveau) | Facettes cliquables |
| Pagination (limit/offset) | `/api/search` étendu | Pagination |

### 2.2 — Exclus

- Modification des **6 modes** (`text`, `reference`, `specs`, `dimensions`, `multi`, `photo`).
- Modification de **`multi-search.ts`** (agrégation).
- Modification de **`scoring.ts`** (scoring).
- **Refonte** de `SearchBar` (ajout uniquement).
- **Sauvegarde** de requêtes (optionnel, post-E12).
- **Recherche vocale** (hors périmètre).

---

## 3. Filtres (backend)

### 3.1 — Paramètres additionnels pour `/api/search`

| Paramètre | Type | Exemple | Défaut |
|---|---|---|---|
| `material` | `string` | `ABS`, `PP`, `PA` | aucun (pas de filtre) |
| `machineId` | `string` (cuid) | `clx...` | aucun |
| `status` | `PartStatus` | `DRAFT`, `SUBMITTED`, `VALIDATED` | aucun |
| `createdAfter` | `ISO date` | `2026-01-01` | aucun |
| `createdBefore` | `ISO date` | `2026-12-31` | aucun |
| `minScore` | `number` (0-1) | `0.5` | aucun |

### 3.2 — Comportement

- Les filtres s'appliquent **après** l'agrégation multi-signaux.
- Les filtres sont **cumulatifs** (ET logique).
- Si un filtre est absent, il n'est **pas appliqué**.
- `minScore` filtre les résultats dont le score est **inférieur** au seuil.

### 3.3 — Exemple

```
GET /api/search?q=plastique&material=ABS&status=VALIDATED&minScore=0.5&limit=20&offset=0
```

Retourne les pièces contenant « plastique », en ABS, validées, avec un score ≥ 0.5, paginées (20 par page).

---

## 4. Tri (backend)

### 4.1 — Paramètre additionnel

| Paramètre | Valeurs | Défaut |
|---|---|---|
| `sort` | `relevance`, `date`, `name`, `status` | `relevance` |

### 4.2 — Comportement

| Valeur | Tri |
|---|---|
| `relevance` | Score décroissant (défaut) |
| `date` | `createdAt` décroissant (plus récent d'abord) |
| `name` | `name` alphabétique (A→Z) |
| `status` | Ordre métier (`DRAFT` → `SUBMITTED` → `VALIDATED` → `ARCHIVED`) |

### 4.3 — Exemple

```
GET /api/search?q=plastique&sort=date&limit=20
```

Retourne les pièces contenant « plastique », triées par date (plus récentes d'abord).

---

## 5. Facettes (backend)

### 5.1 — Nouveau endpoint

```
GET /api/search/facets?q=plastique&material=ABS
```

**Réponse :**
```json
{
  "total": 20,
  "materials": [
    { "value": "ABS", "count": 12 },
    { "value": "PP", "count": 8 }
  ],
  "machines": [
    { "id": "clx...", "name": "Presse 1", "count": 5 }
  ],
  "statuses": [
    { "value": "DRAFT", "count": 3 },
    { "value": "VALIDATED", "count": 17 }
  ]
}
```

### 5.2 — Comportement

- Les facettes sont calculées sur les **résultats filtrés** (pas sur toute la base).
- Les facettes sont **cliquables** dans l'UI (ajout de filtre).
- Les facettes sont **limitées** à 10 valeurs par catégorie (les plus fréquentes).

### 5.3 — Performance

- Requêtes SQL `GROUP BY` optimisées.
- Cache 30s (les facettes changent rarement).

---

## 6. Pagination (backend)

### 6.1 — Paramètres additionnels

| Paramètre | Type | Défaut | Max |
|---|---|---|---|
| `limit` | `number` | `20` | `100` |
| `offset` | `number` | `0` | — |

### 6.2 — Réponse

```json
{
  "results": [...],
  "total": 120,
  "limit": 20,
  "offset": 0,
  "hasMore": true
}
```

### 6.3 — Comportement

- `total` = nombre total de résultats (avant pagination).
- `hasMore` = `true` si `offset + limit < total`.
- `limit` plafonné à 100 (protection).

---

## 7. UI (frontend)

### 7.1 — Panneau de filtres

**Emplacement :** sous la `SearchBar`, dans un accordéon repliable.

**Contenu :**
- **Matériau** : sélecteur multi-valeurs (`ABS`, `PP`, `PA`, etc.)
- **Machine** : sélecteur (liste des machines)
- **Statut** : sélecteur multi-valeurs (`DRAFT`, `SUBMITTED`, `VALIDATED`, `ARCHIVED`)
- **Date** : plage (après / avant)
- **Score minimum** : slider (0-1)

**Comportement :**
- Les filtres s'appliquent **automatiquement** (debounce 300ms).
- Un badge indique le **nombre de filtres actifs**.
- Bouton « Réinitialiser » pour tout effacer.

### 7.2 — Sélecteur de tri

**Emplacement :** à droite de la `SearchBar`.

**Options :** Pertinence (défaut), Date, Nom, Statut.

### 7.3 — Facettes cliquables

**Emplacement :** panneau latéral (ou sous les filtres).

**Comportement :**
- Chaque facette est **cliquable** (ajoute le filtre correspondant).
- Les facettes actives sont **surlignées**.
- Les facettes sans résultat sont **grisées**.

### 7.4 — Pagination

**Emplacement :** sous les résultats.

**Comportement :**
- Boutons « Précédent » / « Suivant ».
- Indicateur « Page X / Y ».
- **Scroll to top** après changement de page.

---

## 8. Risques et mitigations

| # | Risque | Mitigation |
|---|---|---|
| **1** | **Régression** des 284 tests E2E existants | Ajout uniquement (pas de refonte `multi-search.ts`, `scoring.ts`, `SearchBar`) |
| **2** | **Performance** des facettes (agrégations) | Requêtes SQL `GROUP BY` + cache 30s |
| **3** | **Complexité UI** (panneau de filtres) | Accordéon repliable + valeurs par défaut |
| **4** | **Compatibilité desktop** | `data-client.ts` étendu (nouvelles fonctions `invoke` ?) |
| **5** | **Compatibilité export** (`output: 'export'`) | Routes API `api.disabled/` (desktop) — vérifier que les filtres fonctionnent en export |

---

## 9. Critères de succès

| # | Critère | Mesure |
|---|---|---|
| **1** | Filtres fonctionnels | 6 tests E2E (un par filtre) |
| **2** | Tri fonctionnel | 4 tests E2E (un par tri) |
| **3** | Facettes fonctionnelles | 3 tests E2E (matériau, machine, statut) |
| **4** | Pagination fonctionnelle | 3 tests E2E (limit, offset, hasMore) |
| **5** | Pas de régression | 284 tests E2E existants passent |
| **6** | Performance | `/api/search` < 500ms (P95) |
| **7** | Compatibilité desktop | `data-client.ts` étendu (4 fonctions `invoke`) |

---

## 10. Découpage

| Sous-session | Objet | Effort |
|---|---|---|
| **E12-R1a** | Spécification (ce document) | Faible |
| **E12-R1b** | Backend : filtres + tri + pagination (`/api/search`) | Moyen |
| **E12-R1c** | Backend : facettes (`/api/search/facets`) | Moyen |
| **E12-R1d** | UI : panneau de filtres + tri + facettes + pagination | Élevé |
| **E12-R1e** | Tests E2E + clôture | Moyen |

---

## 11. Décisions verrouillées

| # | Décision | Valeur |
|---|---|---|
| **D-E12-4** | Périmètre | Filtres + tri + facettes + pagination (pas de refonte) |
| **D-E12-5** | Filtres | 6 (matériau, machine, statut, date après, date avant, score min) |
| **D-E12-6** | Tri | 4 (pertinence, date, nom, statut) |
| **D-E12-7** | Facettes | 3 (matériau, machine, statut) |
| **D-E12-8** | Pagination | `limit`/`offset` (pas cursor) |
| **D-E12-9** | UI | Accordéon repliable + badge filtres actifs |
