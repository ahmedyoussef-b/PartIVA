# Positionnement de PartIVA

**Date :** 2026-10-13
**Statut :** Validé (D3 amendements E6-S07)
**Auteur :** Superviseur IA

---

## 1. Ce que PartIVA est

PartIVA est un **SaaS/marketplace industriel B2B** qui combine 4 fonctionnalités qu'aucun projet open-source ne réunit :

1. **Recherche fédérée multi-sources** — agrégation de sources locales et externes (local_db, wikidata, traceparts, tecdoc, industrial_catalog)
2. **Reverse engineering / refabrication** — à partir d'une pièce existante, reconstruire sa spécification
3. **Scoring multi-critères** — évaluation de la pertinence et de la qualité des candidats
4. **Workflow de fabrication** — de la demande à la pièce produite

---

## 2. Ce que PartIVA n'est pas

- ❌ Un simple moteur de recherche de pièces
- ❌ Un catalogue statique
- ❌ Un clone de CADENAS, TraceParts ou TecDoc
- ❌ Un outil de CAO

---

## 3. Pattern d'inspiration : Rebrickable

**Rebrickable** (LEGO) permet, à partir d'un inventaire de pièces, d'identifier **ce qu'on peut construire**.

**PartIVA** applique ce pattern au monde industriel :

> À partir d'un **inventaire de pièces** (ou d'un besoin), identifier **ce qu'on peut fabriquer**, **avec quelles alternatives**, et **à quel coût**.

### Différences avec Rebrickable

| Rebrickable | PartIVA |
|---|---|
| Pièces LEGO | Pièces industrielles |
| Constructions LEGO | Refabrications industrielles |
| Inventaire utilisateur | Inventaire + sources externes |
| Suggestions de builds | Scoring multi-critères + workflow |
| Communauté | B2B |

---

## 4. Innovation : auto-parts (fitment)

PartIVA intègre 7 innovations aftermarket :

| # | Innovation | Session E6 |
|---|---|---|
| 1 | VIN2OE (VIN → références OE) | E6-S08 |
| 2 | VIN + plaque + IA (multi-entrées) | E7 |
| 3 | KType+ (standard véhicule) | E6-S07 ✅ |
| 4 | Identification photo + fitment | E6-S08 |
| 5 | Langage naturel (LLM) | E7 |
| 6 | Base véhicule propriétaire | E6-S07 ✅ |
| 7 | OCR carte grise | E7 |

---

## 5. Positionnement unique

**PartIVA est le seul projet à réunir :**

- Recherche fédérée multi-sources
- Reverse engineering
- Scoring multi-critères
- Workflow de fabrication
- Fitment auto-parts (vehicle → part)

**Aucun concurrent open-source ne couvre ces 5 dimensions simultanément.**

---

## 6. Cibles

- **B2B industriel** — ateliers, PME, bureaux d'études
- **Aftermarket auto** — garages, revendeurs, collectionneurs
- **Refabrication** — pièces obsolètes, introuvables

---

## 7. Références

- `docs/e6-s05-auto-parts-spec.md` — Spécification auto-parts
- `prisma/schema.prisma` — Modèle `Vehicle`, `Fitment`, `Part`
- `DEBT.md` — Dette `D-tecdoc-auto-parts`
- `ROADMAP.md` — Phase E6
