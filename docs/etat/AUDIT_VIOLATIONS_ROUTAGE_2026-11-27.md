# Audit — Violations de routage (Option 3)

Date : 2026-11-27. Carte : `Test_Clignotant_LED` (`cmwwmezr7001iccfc6m1o9b3p`).
**Aucun correctif implémenté** — audit uniquement, en attente d'analyse commune.

## ⚠️ Réserve importante sur le jeu de données

Le plateau sur disque a été routé à plusieurs reprises lors des tests E2E successifs (reset + full flow). Le DRC actuel remonte **92 violations** (dont 21 vias orphelins et 1 intersection de zones), contre **39** lors de la dernière exécution propre rapportée dans la PR #231. L'audit porte donc sur un état **accumulé**, qui révèle un bug d'idempotence en plus des défauts intrinsèques de routage.

## 1. Répartition brute (état accumulé)

| Type | Nombre | Paires dominantes | Distance min / médiane / max |
|---|---|---|---|
| `solder_mask_bridge` | 37 | track↔pad 34, via↔pad 3 | 0,413 / 5,168 / 31,760 mm |
| `via_dangling` | 21 | via seul | — |
| `shorting_items` | 14 | track↔pad 5, pad↔track 4, via↔track 3, track↔track 2 | 0,150 / 7,620 / 31,760 mm |
| `clearance` | 10 | track↔track 3, pad↔track 3, pad↔via 2, via↔pad 1, track↔pad 1 | 0,413 / 0,850 / 7,620 mm |
| `tracks_crossing` | 6 | track↔track 6 | 0,950 / 4,771 / 31,760 mm |
| `zones_intersect` | 1 | zone↔zone (deux zones GND, priorité 0) | 0 mm |
| `hole_clearance` / `hole_to_hole` | 3 | — | — |
| **Non-connectés** | 14 | pistes/vias/pads GND | — |

## 2. Causes racines

### A. Non-idempotence du routage assisté (cause du surplus observé)
`route_board.py` ajoute **sans contrôle** une zone GND (`add_gnd_zone`) et un via par pin GND (`add_via`) à chaque exécution. Après N routages : N zones superposées (`zones_intersect`) et N× vias, dont la majorité ne sont connectés à rien (`via_dangling` 21). C'est un bug distinct de la qualité de routage : il faut supprimer les zones/vias GND existants avant de les recréer.

### B. Pistes trop proches des pads étrangers
Le correctif 3 (PR #231) ne teste que le **couloir horizontal** à `y = start.y`. Le **segment vertical de retour** (à `x = end.x`) n'est pas vérifié : il retraverse la rangée de pads de U1 / la colonne de J1. D'où 34 `solder_mask_bridge` track↔pad et 5 `shorting_items` track↔pad. Distance minimale mesurée **0,413 mm**, sous l'ouverture de masque effective (~0,25 mm + marge cuivre).

### C. Doublage de routage assisté + Freerouting
Le flux complet enchaîne `route` (pistes Manhattan) **puis** Freerouting. Les pistes assistées restent dans le plateau et deviennent des obstacles **fixes** pour Freerouting, qui ajoute ses propres pistes parallèles qui les croisent (`tracks_crossing` 6, `shorting_items` track↔track 2, `clearance` track↔track 3). Le score reste 1000 car Freerouting considère ces pistes fixes comme non modifiables.

### D. Dégagement insuffisant
`CLEARANCE_MM = 0,3` dans `route_board.py` et `--router.copperToEdgeClearanceUm=500` pour Freerouting, mais la clearance **pad↔piste** effective devrait être ≥ 0,5 mm pour absorber l'ouverture de masque. Les `clearance` pad↔via (3) et via↔pad (1) confirment que les vias posés à 0,8 mm d'un pad sont trop proches d'autres pads.

### E. Non-connectés (14)
Tous sur le réseau GND : vias orphelins (A) + pistes GND qui ne rejoignent pas le pad U1.1 / J1.2. La zone B.Cu n'est pas remplie (`kicad-cli` ne refill pas automatiquement dans notre chaîne), donc les vias ne sont pas électriquement raccordés à la zone.

## 3. Correctifs proposés (à valider avant code)

| Ordre | Correctif | Fichier | Effort | Impact estimé |
|---|---|---|---|---|
| 1 | **Idempotence** : supprimer zones GND + vias GND existants avant routage | `route_board.py` | Faible | via_dangling 21 → ~0, zones_intersect 1 → 0 |
| 2 | **Vérifier les deux segments** (horizontal **et** vertical) contre les pads étrangers ; clearance 0,5 mm | `route_board.py` | Moyen | solder_mask_bridge 37 → ~5, shorting_items -7 |
| 3 | **Éviter le double routage** : ne pas exécuter `route` quand Freerouting est disponible, ou retirer les pistes assistées avant export DSN | `runFullFlow` / `freerouting/route.ts` | Moyen | tracks_crossing 6 → 0, clearance track↔track 3 → 0 |
| 4 | **Refill de la zone GND** après import SES (`zone.Fill()` via `pcbnew.ZONE_FILLER`) | `specctra.py` / `route_board.py` | Moyen | non-connectés 14 → ~3 |
| 5 | **Règles netclass** Freerouting : dégagement explicite VCC/GND | options CLI | Faible | marge de sécurité |

**Cible après correctifs** : routage ≤ 20, non-connectés ≤ 5, score ≥ 950.

## 4. Ce qu'il ne faut pas toucher

- Placement séquentiel, orientation par signal, passe de densité : stables et validés.
- Catégorisation DRC (PR #231) : correcte.
- Validation de la netlist et du cache LLM : correcte.
- Ne pas réintroduire de routed tracks fixes avant Freerouting.
