# Audit — Violations de placement (Option B)

Date : 2026-11-27. Carte : `Test_Clignotant_LED` (`cmwwmezr7001iccfc6m1o9b3p`).
**Aucun code modifié** — rapport d'audit uniquement.

## 1. Résultat du DRC

```
violations : 54
• placement   : 15
• routage     : 39
• fabrication : 0
non-connectés : 14
```

Types bruts : `solder_mask_bridge` 15 · `via_dangling` 13 · `unconnected_items` 14 · `shorting_items` 9 · `clearance` 3.

## 2. Les 15 « violations de placement » — Liste

**Toutes sont des `solder_mask_bridge`. Aucun `courtyards_overlap`, aucun chevauchement de composants.**

Chaque violation oppose une **piste VCC_5V sur F.Cu** à un **pad GND (ou sans net)** :

| # | Piste VCC_5V (position, longueur) | Pad concerné | Écart track→pad |
|---|---|---|---|
| 1, 5, 7, 9, 15 | (94,52 ; 118,6) — 6,67 / 13,50 / 8,03 mm | U1.1 [GND] @ (86,9 ; 118,6) | 7,62 mm (la piste traverse la rangée de pads) |
| 2, 4, 8 | (86,4875 ; 118,6) — 24,20 / 5,46 mm | U1.1 [GND] | **0,41 mm** |
| 3, 6, 10, 11, 12, 14 | (87,85 ; 118,6) — 1,36 / 29,50 mm | U1.1 [GND], U1.2/3/4 [`<no net>`] | **0,95 mm** |
| 13 | (207 ; 118,6) — 34,30 mm | J1.2 [GND] @ (207 ; 86,84) | même X, la piste passe par la colonne de pads |

**Distance entre composants : aucune mesurée** — les 15 paires sont toujours `piste ↔ pad`, jamais `pad ↔ pad` ni `boîtier ↔ boîtier`. L'hypothèse de départ (courtyards / bounding boxes trop petites / `resolveOverlaps` défaillant) est donc **invalidée par les données**.

## 3. Cause racine

### 3.1 Erreur de catégorisation (cause de l'intitulé trompeur)
`src/lib/pcb/drc.ts` classe `solder_mask_bridge` dans **`placement`** de façon inconditionnelle (`PLACEMENT_TYPES`). Or KiCad émet ce code dès qu'une **ouverture de masque relie deux éléments de nets différents**, y compris une piste et un pad. Ici, l'un des deux items est toujours une **piste** → c'est un défaut de **routage**, pas de placement.
- Conséquence : le rapport affiche « 15 violations de placement » alors que le placement est sain (`courtyards_overlap` = 0).

### 3.2 Géométrie du routage VCC
Le routage assisté (`routeBoard`) trace VCC_5V en ligne droite à `Y = 118,6 mm`, exactement sur la rangée de pads de U1 (pads 1→4 espacés de 2,54 mm : 118,6 / 121,14 / 123,68 / 126,22). les pistes passent à 0,41–0,95 mm des pads GND. Même motif sur J1 (colonne X = 207).
- Cause : aucune règle de dégagement entre une piste d'un net et les pads d'un **autre** net n'est appliquée dans le routage assisté ; Freerouting importe ensuite le SES et conserve ces segments.

### 3.3 Netlist ↔ empreinte (cause profonde)
Les pads U1.2, U1.3, U1.4 sont marqués **`<no net>`** dans le DRC. La netlist LLM n'a assigné qu'une broche de U1 au GND et aucune au VCC sur cette empreinte. Le module `nets-only` valide bien les pins contre `getFootprintPadNumbers()`, mais le **cache `source-components`** (utilisé directement par `runFullFlow` via `sourced.nets`) **n'est pas validé** : des numéros de broches inventés par le LLM peuvent être persistés tels quels.
- Conséquence : des pads flottants deviennent des obstacles que les pistes croisent, générant `solder_mask_bridge` + `shorting_items`.

### 3.4 Réseau GND incomplet
13 `via_dangling` + 14 `unconnected_items` : les vias GND ne sont pas raccordés aux pads/à la zone. Le routage assisté pose des vias sans garantir la continuité jusqu'au pad (ex. U1.1 ↔ via (87,9 ; 119,6) Non connecté).

## 4. Correctifs proposés (à valider avant code)

1. **Catégorisation (trivial, 1 fichier)** — Dans `drc.ts`, classer `solder_mask_bridge` en `routage` si l'un des `items` est une piste/via ; ne garder en `placement` que les ponts `pad ↔ pad`. Le rapport affichera alors ~0 violation de placement et 54 de routage — plus conforme à la réalité.
2. **Validation des pins du cache LLM (faible effort, fort impact)** — Dans `source-components`, avant de persister `sourcingCache.nets`, filtrer/corriger les `REF.PIN` avec `getFootprintPadNumbers()` (comme le fait déjà `nets-only`). Empêche les pads `<no net>` et les broches inexistantes.
3. **Dégagement piste ↔ pads étrangers (effort moyen)** — Dans `routeBoard`, avant d'écrire chaque segment, vérifier qu'il ne passe pas à moins de `pad_clearance + mask_clearance` d'un pad appartenant à un autre net ; sinon dérouter (décalage orthogonal). Complément : passer Freerouting avec `--router.copperToEdgeClearanceUm=500` déjà actif, et ajouter une règle net-class VCC/GND.
4. **Assainissement des vias GND (effort moyen)** — Après import SES, supprimer les vias dont aucun segment ne touche le pad/le plan, ou les relier explicitement au pad le plus proche. Cible : 13 `via_dangling` → 0.
5. **Empreintes (faible effort)** — Vérifier le choix de footprint pour U1 : le DIP-8 attendu a 8 broches, or le plateau n'en montre que 4 sur la rangée concernée. Si le LLM a choisi une empreinte 4 broches pour un NE555, la corriger via le catalogue (`resolveKicadFootprint`).

## 5. Recommandation ordonnée

| Ordre | Correctif | Effort | Impact |
|---|---|---|---|
| 1 | Catégorisation DRC | Faible | Rapport exact (0 placement au lieu de 15) |
| 2 | Validation pins du cache LLM | Faible | Supprime la cause profonde (pads `<no net>`) |
| 3 | Dégagement des pistes vs pads | Moyen | Supprime 15 `solder_mask_bridge` + 9 `shorting_items` + 3 `clearance` |
| 4 | Vias GND orphelins | Moyen | Supprime 13 `via_dangling`, réduit les 14 non-connectés |
| 5 | Empreinte U1 | Faible | Cohérence topologie ↔ physique |

**Conclusion** : le placement algorithmique est sain ; les 15 violations attribuées au placement sont en réalité des défauts de routage et de correspondance netlist/empreinte. Le premier correctif à implémenter est la catégorisation, puis la validation des pins du cache LLM.
