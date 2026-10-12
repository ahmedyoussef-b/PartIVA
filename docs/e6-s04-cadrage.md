# CADRAGE — E6-S04 `D-completeness-*` (3 dettes)

**Session :** E6-S04 — `D-completeness-*` (3 dettes Faibles)
**Type :** Technique (autonome — aucune dépendance externe)
**Date :** 2026-10-13
**Statut :** 🟢 À cadrer (prochaine session E6 active)
**Baseline HEAD :** `c0c889d` (E6-S01)

---

## 0. Bloc 0 — Reconnaissance (déjà réalisée)

### 0.1 Fichiers lus

- `src/lib/part-required-specs.ts` — `REQUIRED_SPEC_KEYS` (8 clés globales fixes)
- `src/lib/scoring.ts` — `DEFAULT_WEIGHTS`, `computeScore`, `loadScoringWeights`
- `src/lib/data/part-completeness.ts` — `getPartCompleteness()` (score = présent/total sur `REQUIRED_SPEC_KEYS`)
- `src/app/api/parts/[id]/completeness/route.ts` — API GET (auth + ownership USER)
- `src/lib/part-status.ts` — `PART_STATUS_TRANSITIONS`, `PART_TRANSITION_ROLES`
- `src/app/api/parts/[id]/transition/route.ts` — POST transition
- `prisma/schema.prisma` — `Part`, `PartCategory`, `PartSpecification`, `PartStatus`
- `e2e/part-completeness.spec.ts` — 5 tests API complétude
- `e2e/admin/completeness.spec.ts` — 2 tests UI (badge + barre)

### 0.2 État actuel de la complétude

```
REQUIRED_SPEC_KEYS = ['diameter_ext', 'diameter_int', 'width', 'weight',
                      'module', 'teeth', 'bore', 'contact_angle']  // 8 clés, globales, fixes

getPartCompleteness(partId):
  presentKeys = Set(specifications.key)
  missing = REQUIRED_SPEC_KEYS.filter(k => !presentKeys.has(k))
  score = present / REQUIRED_SPEC_KEYS.length   // 8 dénominateur
```

**Complétude = suggestion passive** (badge + « Il manque : X, Y, Z »). Aucun blocage workflow.

### 0.3 Analyse des 3 dettes

#### `D-completeness-category-keys` (Faible)

**État :** `REQUIRED_SPEC_KEYS` est une **liste globale fixe** (8 clés). Une liste **par catégorie** nécessiterait :
- Nouveau modèle Prisma `CategoryRequiredSpec` (categoryId + key)
- **Migration Prisma**
- UI admin de configuration des clés par catégorie
- Refonte de `getPartCompleteness()` (résolution par catégorie)

**Faisabilité E6-S04 (Q5 = Non migration) :** ❌ **Bloquée** — nécessite une migration Prisma. **STOP** (arbitrage Coordinateur requis).

**Alternative sans migration :** aucune — la personnalisation par catégorie est intrinsèquement un modèle de données.

#### `D-completeness-material` (Faible)

**État :** `material` est **exclu** de `REQUIRED_SPEC_KEYS` (textuel, pas dimensionnel — décision 2-i E2-S07).

**Faisabilité E6-S04 :** ⚠️ **Arbitrage métier** — ajouter `material` aux clés requises :
- Change le dénominateur de complétude (8 → 9) pour **toutes les pièces**
- Casse les tests E2E existants (`expect(body.total).toBe(8)` → 9)
- Nécessite que le seed contienne `material` pour toutes les pièces (sinon score < 1 partout)
- Décision : est-ce un signal métier suffisant pour justifier le changement ?

**Recommandation :** garder `material` exclu (dimensionnel ≠ textuel) — **clôturer par décision** (documenter, comme E5-S06) OU ajouter une **liste distincte** `REQUIRED_TEXT_KEYS` (non bloquante, informative).

#### `D-completeness-blocking` (Faible)

**État :** complétude = suggestion passive. Aucun blocage de transition.

**Faisabilité E6-S04 :** ⚠️ **Changement de comportement workflow** — bloquer SUBMITTED→IDENTIFYING si complétude < seuil :
- Modifie `transitionPartStatus()` (logique métier critique)
- Risque de régression sur les transitions existantes (tests `part-transitions.spec.ts`)
- Nécessite un seuil arbitré (100 % ? 80 % ?)
- Impact : les pièces incomplètes ne peuvent plus avancer (changement de processus)

**Recommandation :** ⚠️ **hors périmètre E6-S04** — changement de workflow à arbitrer par le Coordinateur (impact processus). Si validé : session dédiée avec tests de régression complets.

---

## 1. Réponses aux questions Q1-Q7

| # | Question | Réponse | Justification |
|---|---|---|---|
| **Q1** | Périmètre : 3 dettes ou priorisation ? | **Priorisé** | Les 3 dettes ne sont pas toutes actionnables sans migration/arbitrage (voir §0.3) |
| **Q2** | `D-completeness-category-keys` : que manque-t-il ? | **Migration Prisma** (`CategoryRequiredSpec`) | Liste par catégorie = modèle de données |
| **Q3** | `D-completeness-material` : que manque-t-il ? | **Arbitrage métier** | Ajout change le score de toutes les pièces |
| **Q4** | `D-completeness-blocking` : que manque-t-il ? | **Arbitrage workflow** | Blocage = changement de processus |
| **Q5** | Migration Prisma autorisée ? | **NON** (par défaut) | Si nécessaire → STOP + rapport |
| **Q6** | Tests E2E ? | **OUI** | Pour toute modification actionnable |
| **Q7** | UI impact ? | **Vérifier** | Badge + barre déjà en place (E4-S04) |

---

## 2. Périmètre E6-S04 révisé (faisable sans migration)

**⚠️ Constat Bloc 0 :** les 3 dettes `D-completeness-*` ne sont **pas actionnables en l'état** sans migration Prisma (category-keys) ou arbitrage métier/workflow (material, blocking).

### 2.1 Actions faisables E6-S04 (sans migration)

| Dette | Action E6-S04 | Type |
|---|---|---|
| `D-completeness-category-keys` | **Documenter** (liste globale justifiée, personnalisation par catégorie = E7+ avec migration) | Documentaire |
| `D-completeness-material` | **Clôturer par décision** (Option C — documenter, comme E5-S06) OU ajouter `REQUIRED_TEXT_KEYS` distincte (informative, non bloquante) | Décision ou code léger |
| `D-completeness-blocking` | **Documenter** (suggestion passive justifiée, blocage = arbitrage workflow E7+) | Documentaire |

### 2.2 Plan E6-S04 révisé

```
Bloc 0 — Reconnaissance (✅ déjà réalisée — §0)
Bloc A — D-completeness-category-keys : documenter (liste globale, migration reportée E7+)
Bloc B — D-completeness-material : décision (documenter OU REQUIRED_TEXT_KEYS)
Bloc C — D-completeness-blocking : documenter (suggestion passive, blocage arbitré E7+)
Bloc D — Tests E2E (si code léger Bloc B)
Bloc E — Validation globale
Bloc F — DEBT.md + SESSION.md + ROADMAP.md
```

### 2.3 Critères de succès

- Les 3 dettes **clôturées** (par décision documentaire, comme E5-S06) OU requalifiées en dettes E7+ (avec migration/arbitrage)
- Aucune migration Prisma
- Baseline tenue

### 2.4 Critères de STOP

- Si le Coordinateur valide une migration Prisma (`CategoryRequiredSpec`) → STOP + rapport (session dédiée E7)
- Si le Coordinateur valide un blocage workflow → STOP + rapport (session dédiée avec régression)
- Si `material` doit être ajouté aux clés requises → STOP + rapport (impact score global)

---

## 3. Baseline cible E6-S04

| Métrique | Avant (E6-S01) | Après (E6-S04) |
|---|---|---|
| ESLint | 0/0 | 0/0 |
| TypeScript | 0 err | 0 err |
| Prettier | 0 | 0 |
| Build | 57 routes | 57 routes |
| E2E | 243/2/4 | 243/2/4 (inchangé — documentaire) ou +1-2 (si REQUIRED_TEXT_KEYS) |
| Prisma | 14 migrations | 14 migrations (aucune migration) |
| Dettes | 5 (4 M + 1 F) | **2-5** (selon clôtures) |

---

## 4. Décisions à prendre par le Coordinateur

| # | Décision | Options | Recommandation |
|---|---|---|---|
| **D1** | Requalifier les 4 sessions en dettes ? | Oui / Non | **Oui** (déjà appliquée ROADMAP) |
| **D2** | E6-S04 = prochaine session ? | Oui / Non | **Oui** |
| **D3** | Q1 — Périmètre E6-S04 : 3 dettes ou priorisé ? | 3 / Priorisé | **Priorisé** (Bloc 0 révèle des blocages) |
| **D4** | Q2-Q4 — Découvrir au Bloc 0 ? | Oui / Non | **Oui** (fait — §0.3) |
| **D5** | Q5 — Migration Prisma : non ? | Oui / Non | **Non** (sauf STOP) |
| **D6** | Q6 — Tests E2E : oui ? | Oui / Non | **Oui** (si code léger) |
| **D7** | Q7 — UI impact : vérifier ? | Oui / Non | **Oui** (déjà vérifié — badge en place) |
| **D8** | R.5.17 : coche explicite ? | Oui / Non | **Oui** (recommandé) |
| **D9** | `D-completeness-category-keys` : documenter (migration E7+) ? | Documenter / Migrer | **Documenter** (Q5 = Non) |
| **D10** | `D-completeness-material` : documenter OU `REQUIRED_TEXT_KEYS` ? | Documenter / Code | **Documenter** (Option C, comme E5-S06) |
| **D11** | `D-completeness-blocking` : documenter (arbitrage E7+) ? | Documenter / Bloquer | **Documenter** (changement workflow = arbitrage) |

**STOP-D :** Sans validation D1-D11, l'Exécutant reste en attente.

---

## 5. Recommandation Superviseur

**E6-S04 doit être une session documentaire** (pattern E5-S06) :

1. **`D-completeness-category-keys`** → documenter : la liste globale est justifiée (8 clés dimensionnelles). La personnalisation par catégorie nécessite `CategoryRequiredSpec` + migration → **reportée E7+** (dette requalifiée).
2. **`D-completeness-material`** → clôturer par décision (Option C) : `material` est textuel, exclu des clés dimensionnelles. Documenter dans `docs/debts-documentation.md`. Alternative : `REQUIRED_TEXT_KEYS` distincte (informative) — au choix du Coordinateur.
3. **`D-completeness-blocking`** → documenter : la suggestion passive est le comportement actuel. Le blocage workflow est un **changement de processus** à arbitrer (impact sur les transitions) → **reporté E7+** (dette requalifiée).

**Résultat :** 3 dettes Faibles traitées (2 clôturées par décision, 1 requalifiée E7+), aucune migration, baseline tenue.

---

## 6. Ce que je produis sur validation D1-D11

- Rapport d'exécution E6-S04 complet (bloc par bloc)
- `docs/debts-documentation.md` mis à jour (§ complétude)
- `DEBT.md` mis à jour (3 dettes clôturées/requalifiées)
- `SESSION.md` + `ROADMAP.md` mis à jour
- Tests E2E (si code léger Bloc B)

---

**FIN DU CADRAGE E6-S04 — En attente validation D1-D11.**

**Note :** le Bloc 0 (reconnaissance) est **déjà réalisé** (§0). Les 3 dettes ne sont pas actionnables en code sans migration ou arbitrage. La recommandation est une session documentaire (clôture par décision), cohérente avec E5-S06. Si le Coordinateur souhaite une implémentation (migration `CategoryRequiredSpec`, blocage workflow, ajout `material`), c'est une **session dédiée E7** avec STOP + rapport.
