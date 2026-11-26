# P12 — Feuille de route PCB Studio : du prototype à l'outil d'ingénierie

**Version :** 2.0
**Date :** 2026-11-26
**Commit de référence :** `f1dac1a` (merge PR #218 — source unique de vérité pour l'affichage)
**Statut :** Roadmap mise à jour suite à l'audit croisé IA interne / IA externe. Phase 1 (topologie) complète. Phase 2-3 en cours. Phases 4-8 à venir.

---

## 1. Contexte et périmètre

La chaîne complète est désormais opérationnelle : **LLM → BDD → Placement intelligent → KiCad → Pistes & Zones** (PR #153 à #218). Le jalon actuel :

- Routage assisté partiel : pistes + zone GND, DRC non vert (140 violations sur la carte de test).
- Placement déterministe (force dirigée + recuit simulé) avec règles métier CDC.
- Affichage gated : « Lancer » → processus complet en arrière-plan → « Afficher les résultats ».
- Reset, reload KiCad, wizard guide pur, polling temps réel.

Cette roadmap vise à transformer le prototype en outil d'ingénierie industrielle, par phases incrémentales et testables.

**Principe directeur :** ne pas empiler de fonctionnalités tant que la topologie (netlist) n'est pas complète et corrigeable par l'ingénieur. Le LLM reste cantonné à la topologie logique ; le placement et le routage sont déterministes.

---

## 2. État de l'art (audit IA externe × codebase)

L'IA externe a proposé 10 nouveautés. L'IA interne les a confrontées au code réel. Synthèse :

| # | Nouveauté | Statut dans le code | Effort | Priorité |
|---|---|---|---|---|
| 1 | ERC KiCad | Partiel — pas de schéma généré | Élevé | Remplacer par validation interne |
| 2 | Placement séquentiel par blocs | Partiel — rôles mais pas de verrouillage strict | Moyen | **Haute** |
| 3 | Congestion multi-objectifs | Partiel — pairwise, pas de densité globale | Moyen | Moyenne |
| 4 | Orientation par flux de signal | Absent | Moyen | Moyenne |
| 5 | Découplage opposite side | Absent | Élevé | Basse (différer) |
| 6 | Freerouting v2.5+ copper pour | Partiel (v2.0.1 installé) | **Faible** | **Haute** |
| 7 | Score de routage | Absent | Faible-Moyen | Moyenne |
| 8 | Rip-up & reroute | Partiel (passes uniformes) | Faible-Moyen | Moyenne |
| 9 | DRC catégorisé | Absent | Moyen | Moyenne |
| 10 | DFM JLCPCB | Absent | Moyen | Basse (différer) |

---

## 3. Roadmap détaillée

### 🎯 Étape 1 : Mise à jour Freerouting v2.6.0
*Objectif : Réduire drastiquement les violations DRC et activer les nouvelles fonctionnalités.*

- **1.1** Télécharger `freerouting-2.6.0.jar`, remplacer `tools/freerouting.jar`, vérifier la version.
- **1.2** Activer `-mp 20`, `-inc GND,VCC`, `-dr` (rip-up) dans l'appel CLI (`freerouting/route.ts`).
- **1.3** Parser le score de routage (0-1000) depuis le stdout et l'afficher dans le toast.
- **1.4** Test : re-router la carte test, cible réduction de 30% des violations.

### 🎯 Étape 2 : Placement séquentiel par blocs
*Objectif : Éliminer les placements aléatoires en imposant un ordre logique.*

- **2.1** Verrouiller les connecteurs sur les bords (passe préalable, immobiles pendant le recuit).
- **2.2** Placer les ICs principaux (mcu, regulator, serial, clock) dans une zone centrale, espacement 5 mm.
- **2.3** Attacher les passifs (capacitor, resistor) à leurs ICs parent via les nets, rayon 5 mm, pénalité forte si éloignés.
- **2.4** Placer les secondaires (LED, test points) dans les espaces libres.
- **2.5** Test : vérifier visuellement + métriques (longueur nets, respect contraintes de bord).

### 🎯 Étape 3 : Catégorisation DRC
*Objectif : Distinguer les violations de placement des violations de routage.*

- **3.1** Parser le rapport DRC JSON pour extraire chaque violation avec son type.
- **3.2** Classifier : placement (`courtyards_overlap`, `solder_mask_bridge`), routage (`clearance`, `unconnected_items`), fabrication (`silk_overlap`, `edge_clearance`).
- **3.3** Afficher dans l'interface : "Placement : X, Routage : Y, Fabrication : Z" + bouton "Voir les détails".
- **3.4** Test : lancer le DRC sur la carte test, vérifier la catégorisation.

### 🎯 Étape 4 : Densité de congestion globale
*Objectif : Éviter que les composants s'agglutinent et bloquent le routage.*

- **4.1** Diviser le plateau en grille (ex. 10×10 cellules), compter les composants par cellule.
- **4.2** Ajouter une pénalité de densité dans `calculateCost` si une cellule dépasse 3 composants.
- **4.3** Test : vérifier que les composants sont répartis sur toute la surface.

### 🎯 Étape 5 : Orientation par flux de signal
*Objectif : Aligner les composants pour minimiser les croisements de pistes.*

- **5.1** Calculer l'axe du signal principal pour chaque net critique (horloge, alimentation).
- **5.2** Aligner les composants sur cet axe (cristal face au MCU, dissipateur vers le bord).
- **5.3** Test : vérifier visuellement l'alignement.

### 🎯 Étape 6 : Validation interne (remplace ERC)
*Objectif : Vérifier la cohérence électrique sans schéma KiCad.*

- **6.1** Vérifier que tous les pins des nets appartiennent à des composants existants.
- **6.2** Vérifier que chaque IC a au moins une broche VCC et une broche GND.
- **6.3** Vérifier que l'horloge est connectée entre cristal et MCU, et la communication entre transceiver et connecteur.
- **6.4** Bloquer le placement si validation échoue, avec message clair.

### 🎯 Étape 7 : Score de routage et itération
*Objectif : Permettre à l'utilisateur de comparer plusieurs routages.*

- **7.1** Afficher le score Freerouting dans le récapitulatif final.
- **7.2** Bouton "Re-router avec score minimum" (seuil configurable).
- **7.3** Historique des routages avec graphique de progression.

### 🎯 Étape 8 : DFM JLCPCB (différée)
*Objectif : Vérifier que la carte est fabricable chez JLCPCB.*

- **8.1** Charger le profil JLCPCB (largeur min 0.1 mm, espacement min 0.1 mm, perçage min 0.3 mm).
- **8.2** Vérifier les règles DFM.
- **8.3** Export Gerber + BOM via `kicad-cli`.
- **8.4** Devis automatique (optionnel).

---

## 4. Résumé de la roadmap

| Étape | Effort | Impact | Priorité |
|---|---|---|---|
| 1. Freerouting v2.6 | Faible | Fort | **Immédiate** |
| 2. Placement séquentiel | Moyen | Fort | **Haute** |
| 3. DRC catégorisé | Faible | Moyen | **Haute** |
| 4. Congestion globale | Moyen | Moyen | Moyenne |
| 5. Orientation signal | Moyen | Moyen | Moyenne |
| 6. Validation interne | Moyen | Fort | Moyenne |
| 7. Score routage | Faible | Moyen | Basse |
| 8. DFM JLCPCB | Moyen | Fort | Différée |

---

## 5. Décision de départ

**Action suivante retenue : Étape 1 (Freerouting v2.6) puis Étape 2 (Placement séquentiel).** Ces deux étapes sont les plus rentables pour l'objectif "zéro erreur + pas d'emplacement aléatoire" avec un effort modéré.

---

## 6. Limites actuellement connues

- Routage partiel : DRC non vert (140 violations sur la carte de test).
- Grille : `optimizePlacement` arrondit encore à 0,1 mm alors que `computePlacement` utilise 2,54 mm (harmonisation non faite).
- Freerouting v2.0.1 installé ; v2.6.0 disponible.
- Le LLM reste cantonné à la topologie (ne pas demander de coordonnées).
- Ne pas introduire de ML/RL (trop lourd pour une app desktop).

---

*Roadmap mise à jour le 2026-11-26. Basée sur l'audit croisé IA interne (exploration complète de `src/lib/pcb/`, `src/app/api/pcb/`, 386 tests verts) et IA externe (10 nouveautés proposées).*
