# Rapport d'état — Fonctionnalité PCB PartIVA (2026-11-26)

Document de synthèse pour l'IA externe. Compare les 10 nouveautés proposées avec l'état réel du codebase.

## 1. Architecture actuelle (ce qui existe)

### Pipeline complet (flux "Lancer")
1. `source-components` (LLM) → BOM + netlist (persistés en BDD + cache).
2. `place/batch` (optimize=true) → placement déterministe (force dirigée + recuit simulé) à partir de la netlist, puis écriture atomique du `.kicad_pcb`.
3. `nets-only` (LLM, cache) → génération GND/VCC, validation des pins contre les pads réels, assignation aux pads du plateau (`assignBoardNets`).
4. `route` → routage assisté (pistes + zone GND) via `routeBoard`.
5. `autoroute/freerouting` → export DSN (assaini ANSI) → Freerouting jar → import SES → DRC (`kicad-cli`).

### Fichiers clés
- `src/lib/pcb/placement.ts` — `inferPlacementRole`, `buildHints`, `calculateCost`, `forceDirected`, `simulatedAnnealing`, `optimizePlacement`, `optimizeRotations`, `resolveOverlaps`.
- `src/lib/pcb/drc.ts` — `runDrc` (kicad-cli pcb drc --format json).
- `src/lib/pcb/kicad-cli-adapter.ts` — `runErc`, `runDrc`, `exportGerbers`, `exportGlb`.
- `src/lib/pcb/erc-drc-parser.ts` — `parseErcReport`, `parseDrcReport`.
- `src/app/api/pcb/autoroute/freerouting/route.ts` — chaîne DSN→SES→DRC.
- `src/app/api/pcb/place/batch/route.ts` — placement batch + optimisation.
- `src/app/api/pcb/requirements/nets-only/route.ts` — nets + assignation pads.
- `src/app/api/pcb/requirements/source-components/route.ts` — BOM LLM.

### État actuel du routage
- Freerouting **v2.0.1** installé (`tools/freerouting.jar`, 66 Mo, Java 21). V2.6.0 disponible.
- Dernière chaîne rejouée : 6 pads assignés → DSN 21 446 o → 6 wires + 3 vias → 10 pistes → DRC **140 violations** (83 solder_mask_bridge, 15 silk_over_copper, 13 clearance, 7 courtyards_overlap, 5 copper_edge_clearance, 3 via_dangling) + 3 non connectés.
- Le DRC n'est **pas vert**. C'est le blocage actuel.

---

## 2. Évaluation des 10 nouveautés proposées

### 1. Validation croisée Netlist ↔ Footprints avec KiCad ERC — **PARTIEL (difficile)**
- **Ce qui existe** : `runErc` + `parseErcReport` dans `kicad-cli-adapter.ts` / `erc-drc-parser.ts`. Validation des pins contre les pads réels dans `nets-only/route.ts` (`validPins`, `padsByRef`). Fallback silencieux sur les pins inexistants.
- **Ce qui manque** : l'ERC est un check de **schéma** (`.kicad_sch`). Notre pipeline ne génère **aucun schéma** — seulement un PCB. On ne peut donc pas lancer `kicad-cli sch erc` sans générer un schéma KiCad. De plus, l'ERC n'est **pas appelé** dans le flux (ni full flow, ni manuel).
- **Effort** : Élevé. Générer un schéma KiCad minimal depuis la netlist, puis câbler ERC. Alternative : valider électriquement la netlist en interne (chaque composant doit avoir GND + VCC, pas de pin orphelin) — effort faible, déjà partiellement fait.
- **Verdict** : pas applicable tel quel. Remplacer par une validation interne de la netlist (pins existants + présence GND/VCC par composant).

### 2. Placement séquentiel déterministe par blocs fonctionnels — **PARTIEL**
- **Ce qui existe** : rôles (`connector`, `mcu`, `regulator`, `clock`, `serial`, `capacitor`, `sensitive`) dans `inferPlacementRole`. `guidedPosition` place les connecteurs sur le bord supérieur, l'horloge près du MCU, le régulateur près de son connecteur, le serial près de son connecteur. Les connecteurs sont repositionnés en début de `optimizePlacement` (lignes 591-603). `calculateCost` contient des règles métier (clock↔MCU, regulator↔sensitive away, regulator↔input connector, serial↔connector, connectors top edge).
- **Ce qui manque** : ce n'est pas un verrouillage strict séquentiel. Le recuit simulé peut déplacer les connecteurs (contraints à Y fixe mais X libre). Les passifs (découplage, cristal) ne sont pas attachés rigidement à leurs ICs. L'ordre JLCPCB (mécanique → IC → passifs support → secondaires) n'est pas imposé comme passe distincte avec verrouillage.
- **Effort** : Moyen. Ajouter une passe de verrouillage : (a) positionner les connecteurs sur les bords et les marquer immobiles, (b) placer les ICs/régulateurs, (c) attacher les passifs à leurs ICs (offset fixe), (d) placer les secondaires. Le recuit ne touche plus aux composants verrouillés.
- **Verdict** : amélioration rentable, effort moyen. C'est la nouveauté la plus impactante pour "pas d'emplacement aléatoire".

### 3. Fonction de coût multi-objectifs avec pénalité de congestion — **PARTIEL**
- **Ce qui existe** : `calculateCost` combine longueur de fils + règles métier + chevauchement (×100) + `congestionPenalty` (écart entre bords des bounding boxes, minClearance 2mm, poids 10). `forceDirected` a une répulsion entre composants.
- **Ce qui manque** : la congestion est **pairwise** (entre deux composants). Pas de **densité globale** ni de seuil de canal de routage. Pas de réserve d'espace pour les pistes entre blocs fonctionnels. L'external AI propose un prédicteur de congestion par hypergraphes (ACM 2026) — trop lourd pour nous.
- **Effort** : Moyen. Ajouter un terme de densité par cellule (grille coarse, ex. 5mm) qui pénalise les zones dépassant un seuil. Plus simple et suffisant.
- **Verdict** : amélioration incrémentale, effort moyen. Utile mais pas critique.

### 4. Orientation intelligente basée sur le flux de signal — **ABSENT**
- **Ce qui existe** : `optimizeRotations` met rotation=0° pour connector/regulator/capacitor/mcu/clock/serial. Tout le reste garde sa rotation (recuit libre).
- **Ce qui manque** : aucune rotation basée sur le flux de signal. Le régulateur ne tourne pas son dissipateur vers l'extérieur. Le cristal n'est pas aligné face au MCU. Le recuit optimise la rotation aléatoirement (0/90/180/270) mais sans logique métier.
- **Effort** : Moyen. Ajouter des règles : cristal → broches face au MCU (rotation minimisant la longueur du net d'horloge), régulateur → dissipateur vers le bord, connecteurs → broches vers l'extérieur. Appliquer avant le recuit.
- **Verdict** : impact visible sur la qualité, effort moyen.

### 5. Placement des découplages par "opposite side" — **ABSENT**
- **Ce qui existe** : placement mono-face (F.Cu uniquement). Pas de composants sur B.Cu. Le `ParsedFootprint.layer` est lu mais le placement ne gère pas la face.
- **Ce qui manque** : tout. Placer les condensateurs de découplage sur la face opposée, sous les broches d'alimentation de l'IC.
- **Effort** : Élevé. Requires : gestion de la face dans `PlacementComponent`, écriture du layer dans le `.kicad_pcb`, assignation des nets sur B.Cu, vérification DRC des vias. Risque de régression.
- **Verdict** : haute valeur pour la HF, mais effort élevé. À différer après les priorités 1-2.

### 6. Freerouting v2.5+ avec copper pour & power plane awareness — **PARTIEL**
- **Ce qui existe** : Freerouting **v2.0.1** (jar 66 Mo, Java 21). Options CLI : `-de`, `-do`, `-mp <passes>`, `--gui.enabled=false`. DSN assaini (Ω→Ohm, µ→u). Assignation des nets aux pads avant routage.
- **Ce qui manque** : version ancienne (2.0.1 vs 2.6.0 disponible). Pas d'options copper pour / power plane. Pas de `-inc` pour ignorer les nets gérés par la zone. Pas de fanout pré-pass.
- **Effort** : Faible. Télécharger v2.6.0, mettre à jour les options CLI, tester.
- **Verdict** : le plus facile à améliorer, impact immédiat sur la complétion du routage. À faire en priorité.

### 7. Score de routage (Router Score) — **ABSENT**
- **Ce qui existe** : on reporte `pistes`, `vias`, `violations DRC`. Pas de score 0-1000.
- **Ce qui manque** : Freerouting v2.0.1 n'expose probablement pas le score. Les versions récentes oui.
- **Effort** : Faible (si on met à jour Freerouting). Parsing du rapport SES ou du log.
- **Verdict** : dépend de la mise à jour Freerouting (point 6).

### 8. Rip-up and reroute sur les nets critiques — **PARTIEL**
- **Ce qui existe** : `-mp <passes>` (default 10, env `FREEROUTING_PASSES`). Freerouting fait des passes d'optimisation internes.
- **Ce qui manque** : pas de fanout pré-pass explicite, pas de micro-neckdown fallback, pas de rip-up ciblé sur les nets critiques (horloge, alimentation). Les passes sont uniformes.
- **Effort** : Faible à moyen. Options CLI supplémentaires dans les versions récentes.
- **Verdict** : dépend de la mise à jour Freerouting.

### 9. DRC avec catégorisation des violations pré-existantes — **ABSENT**
- **Ce qui existe** : `runDrc` retourne `violations` (total) + `unconnected`. `parseDrcReport` normalise par sévérité. Pas de distinction placement vs routage, ni pré-existant vs introduit.
- **Ce qui manque** : Freerouting v2.5 distingue les violations introduites par le routeur des violations déjà présentes. Notre DRC KiCad natif ne fait pas cette distinction.
- **Effort** : Moyen. Nécessite Freerouting v2.5+ et parsing de son rapport. Alternative : catégoriser par type de violation (solder_mask_bridge = placement, clearance = routage) avec des heuristiques.
- **Verdict** : utile pour le diagnostic. La catégorisation par type est faisable sans mise à jour Freerouting.

### 10. Validation DFM intégrée (JLCPCB) — **ABSENT**
- **Ce qui existe** : export Gerber (`exportGerbers`), export GLB. Pas de profil JLCPCB ni de validation DFM.
- **Ce qui manque** : tout. Pas de règles de largeur/espacement par fabricant.
- **Effort** : Moyen. Créer un profil JSON des règles JLCPCB et une passe de validation.
- **Verdict** : important pour la fabrication, mais pas bloquant pour le routage. À différer.

---

## 3. Tableau récapitulatif

| # | Nouveauté | Statut | Effort | Priorité |
|---|---|---|---|---|
| 1 | ERC KiCad | Partiel/Non applicable (pas de schéma) | Élevé | Remplacer par validation interne |
| 2 | Placement séquentiel par blocs | Partiel | Moyen | **Haute** |
| 3 | Congestion multi-objectifs | Partiel (pairwise) | Moyen | Moyenne |
| 4 | Orientation par flux de signal | Absent | Moyen | Moyenne |
| 5 | Découplage opposite side | Absent | Élevé | Basse (différer) |
| 6 | Freerouting v2.5+ copper pour | Partiel (v2.0.1) | Faible | **Haute** |
| 7 | Score de routage | Absent | Faible-Moyen | Moyenne |
| 8 | Rip-up & reroute | Partiel (passes uniformes) | Faible-Moyen | Moyenne |
| 9 | DRC catégorisé | Absent | Moyen | Moyenne |
| 10 | DFM JLCPCB | Absent | Moyen | Basse (différer) |

---

## 4. État de santé actuel du pipeline (diagnostic)

- **Topologie** : bonne. Netlist LLM + validation pins. Pas d'ERC.
- **Placement** : déterministe, multi-objectifs, règles métier CDC. Manque la séquentialité stricte et l'orientation par flux.
- **Routage** : Freerouting v2.0.1, 140 violations DRC, 3 non connectés. Score non mesuré.
- **Affichage** : canvas rend pistes/vias/zones. KiCad s'ouvre sous le nom du projet. Reset fonctionne.
- **UX** : flux "Lancer" complet + affichage gated + placement manuel. Wizard guide sans exécuter.

---

## 5. Suggestions (mes recommandations)

### A. Actions immédiates (faible effort, fort impact)
1. **Mettre à jour Freerouting vers v2.6.0** (point 6). Télécharger le jar, mettre à jour `freeroutingJar()` et les options CLI. Activer `-mp 20` (rip-up) et tester si les 140 violations baissent.
2. **Catégoriser les violations DRC par type** (point 9, sans mise à jour Freerouting) : dans `runDrc` ou un post-traitement, grouper par `type` (solder_mask_bridge, clearance, etc.) et afficher "X violations de placement, Y de routage". C'est déjà partiellement faisable avec le rapport JSON existant.
3. **Ajouter une passe séquentielle de placement** (point 2) : verrouiller les connecteurs sur les bords, placer les ICs, attacher les passifs (découplage, cristal) à leurs ICs avec un offset fixe. Désactiver le mouvement de ces composants dans le recuit. Effort moyen, impact fort sur "pas d'emplacement aléatoire".

### B. Actions à moyen terme
4. **Orientation par flux de signal** (point 4) : règles de rotation pour cristal, régulateur, connecteurs. Appliquer avant le recuit simulé.
5. **Congestion par densité de grille** (point 3) : ajouter un terme de densité par cellule 5mm dans `calculateCost`. Plus simple que l'hypergraphe ACM.
6. **Score de routage** (point 7) : parser le log Freerouting ou le rapport pour extraire un score. Afficher dans l'UI.

### C. Actions à différer
7. **ERC KiCad** (point 1) : remplacer par une validation interne de la netlist (chaque composant doit avoir GND + au moins un net d'alimentation, pas de pin orphelin). L'ERC vrai nécessite un schéma.
8. **Découplage opposite side** (point 5) : nécessite la gestion 2 faces. À faire après la stabilisation du routage.
9. **DFM JLCPCB** (point 10) : utile pour la fabrication, pas pour le routage. À faire en Phase 5 (export fabrication).
10. **Traceforge** : outil Python intéressant mais redondant avec notre pipeline. Pas nécessaire.

### D. Suggestion pour l'IA externe
Le prompt le plus rentable pour l'IA interne : **"Implémenter la passe séquentielle de placement (connecteurs verrouillés sur les bords → ICs → passifs attachés → secondaires) et la catégorisation DRC par type de violation."** Ces deux points sont les plus rentables pour l'objectif "zéro erreur + pas d'emplacement aléatoire" avec un effort modéré.

---

## 6. Ce que je ne recommande pas de changer

- **Le LLM reste cantonné à la topologie** : c'est déjà le cas (source-components génère BOM + nets, le placement est déterministe). Ne pas demander au LLM de fournir des coordonnées.
- **Ne pas introduire de ML/RL** : trop lourd pour une app desktop. Les métaheuristiques (recuit simulé) + règles métier suffisent.
- **Ne pas réécrire le placement en Python** : l'algorithme TypeScript est testable et intégré. Garder en TS.

---

*Généré le 2026-11-26. Basé sur l'exploration complète de `src/lib/pcb/`, `src/app/api/pcb/`, et des tests associés (386 tests verts).*
