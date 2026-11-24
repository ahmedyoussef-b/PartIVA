# P12 — Feuille de route PCB Studio : du prototype à l'outil d'ingénierie

**Version :** 1.0
**Date :** 2026-11-24
**Commit de référence :** `912e422` (merge PR #167 — routage assisté partiel)
**Statut :** Roadmap validée par le coordinateur, non encore implémentée

---

## 1. Contexte et périmètre

La chaîne complète est désormais opérationnelle : **LLM → BDD → Placement intelligent → KiCad → Pistes & Zones** (PR #153 à #167). Le jalon actuel est un **routage assisté partiel** : 4 pistes, 1 zone GND, 3 vias, DRC non vérifié, 13 composants sans net restent non câblés.

Cette roadmap vise à transformer le prototype en outil d'ingénierie industrielle, par phases incrémentales et testables.

**Principe directeur :** ne pas empiler de fonctionnalités tant que la topologie (netlist) n'est pas complète et corrigeable par l'ingénieur.

---

## 2. Phase 1 — Fiabiliser la topologie (la Netlist)

*Objectif : passer de 2 nets à une netlist complète, éditable par l'admin.*

| ID | Action | Détail | Priorité |
|---|---|---|---|
| 1.1 | **Prompt LLM hiérarchique** | Modifier le prompt de `/api/pcb/requirements/nets-only` pour générer les nets **par blocs fonctionnels** (Alimentation, Communication, Analogique). Augmente le nombre de nets produits. | **P0** |
| 1.2 | **Fallback intelligent** | Si le LLM omet un net pour un composant identifié (ex. `U3` = transceiver RS‑485), appliquer une heuristique backend : relier ses pins A/B au connecteur détecté comme `db9/modbus`. Réutiliser `inferPlacementRole()` / `buildHints()` de `placement.ts`. | P1 |
| 1.3 | **Édition manuelle de la netlist** | Tableau admin : créer / modifier / supprimer un net avant placement. Persistance dans `PcbNet` + `sourcingCache.nets`. Indispensable pour corriger les erreurs du LLM. | **P0** |

**Note :** la priorité absolue est **1.1 + 1.3**. Sans netlist complète et corrigeable, le meilleur placement et le meilleur routeur restent inopérants.

---

## 3. Phase 2 — Améliorer le placement (l'algorithme)

*Objectif : un placement plus « humain », qui anticipe le routage.*

| ID | Action | Détail |
|---|---|---|
| 2.1 | **Routabilité / congestion** | Ajouter dans `calculateCost` une pénalité de congestion : si deux composants très connectés sont trop proches, les écarter pour laisser passer les pistes. |
| 2.2 | **Orientation des composants** | Règles d'orientation : connecteurs vers l'extérieur, condensateurs de découplage parallèles aux pistes d'alimentation. Le coût intègre déjà la rotation mais sans orientation cible. |
| 2.3 | **Algorithme génétique (NSGA-II)** | Remplacer le recuit simulé par une optimisation multi-objectifs (longueur, bords, découplage) pour éviter qu'un critère n'écrase les autres. Conserver la garantie de non-régression acquise en PR #165/#166. |

---

## 4. Phase 3 — Le routage complet (voie B / Freerouting)

*Objectif : passer du routage assisté au routage automatique complet.*

| ID | Action | Détail |
|---|---|---|
| 3.1 | **DSN Specctra complet** | Compléter `src/lib/pcb/autorouter.ts` (actuellement un stub) : outline Edge.Cuts, couches, netclasses, padstacks. |
| 3.2 | **Intégration Freerouting** | Binaire Java ou appel API, lancement en arrière-plan, puis import du `.ses` dans KiCad via `pcbnew`. |
| 3.3 | **DRC** | Vérification espacement / largeur / croisement via le DRC natif de KiCad (IPC) ou un script Python dédié. Comble la limite explicite du routage actuel. |

---

## 5. Phase 4 — L'expérience utilisateur (le Studio)

*Objectif : rendre l'outil utilisable par un ingénieur au quotidien.*

| ID | Action | Détail |
|---|---|---|
| 4.1 | **Canvas 3D** | Vue 3D du PCB (Three.js ou viewer KiCad) avant fabrication. |
| 4.2 | **Édition interactive** | Clic-glisser un composant sur `PcbCanvas` avec **re-routage à la volée** des pistes autour de lui. |
| 4.3 | **Historique / versioning** | Sauvegarder chaque version du PCB (avant/après placement) et permettre le retour arrière. S'appuyer sur `PcbCheckpoint` / `PcbVersion` déjà présents dans le schéma. |

---

## 6. Phase 5 — Industrialisation (fabrication)

*Objectif : préparer la carte pour JLCPCB.*

| ID | Action | Détail |
|---|---|---|
| 5.1 | **Export Gerber & BOM** | Génération en un clic via `kicad-cli` (Gerber, Drill, BOM, Pick-and-Place). Des briques existent déjà : `gerber-exporter.ts`, `bom-exporter.ts`, `kicad-cli-adapter.ts`. |
| 5.2 | **DFM JLCPCB** | Règles de vérification : largeur de piste min, perçage min, espacement min. |
| 5.3 | **Devis automatique** | Intégration d'une API fabricant (JLCPCB / PCBWay) pour un coût en temps réel selon dimensions et nombre de couches. |

---

## 7. Décision de départ

**Prochaine action retenue : Phase 1.3 — Édition manuelle de la netlist**, couplée à **1.1** (prompt hiérarchique).

Raison : c'est la seule fonctionnalité qui donne à l'ingénieur le pouvoir de corriger les erreurs du LLM, condition nécessaire pour que les phases 2 à 5 aient un sens.

---

## 8. Limites actuellement connues (à ne pas confondre avec la roadmap)

- Routage partiel : **pas de DRC**, pas de garantie d'absence de croisement, seuls les nets présents en BDD sont câblés.
- Verrous `acquireLlmGuard` et `rateLimit` en mémoire par instance (mono-instance acceptable).
- Grille : `optimizePlacement` arrondit encore à 0,1 mm alors que `computePlacement` utilise 2,54 mm (harmonisation non faite).
- Position de l'horloge `Y1` mesurée à 8,1 mm au lieu de la cible 5 mm.
