# Checklist — Test Final de Bout en Bout (post-F5)

Objectif : valider que F1 à F5 fonctionnent **ensemble** sur un projet propre, créé à partir d'un CDC client.

## Étape 1 — CDC & Analyse (F1)

- [ ] Le client écrit un CDC simple (ex. « Je veux une carte qui surveille la température, pas de Wi-Fi »).
- [ ] L'IA compile la description technique **sans inventer de Wi-Fi**.
- [ ] L'interface affiche le badge « Contraintes extraites : Wi-Fi ».
- [ ] Les champs non renseignés sont marqués « À préciser ».
- [ ] Si l'IA hallucine quand même du Wi-Fi, la modale bloque la validation avec `needsReview`.

## Étape 2 — Sourcing & Netlist (F2 + F3 + F4)

- [ ] La BOM est générée avec des composants cohérents (pas de relais si le client n'en veut pas).
- [ ] La netlist est générée avec des pins valides (pas de `U2.4` sur un TO-220).
- [ ] Si un pin est invalide, un **chip rouge** apparaît avec l'infobulle indiquant les pads disponibles.
- [ ] L'édition manuelle de la netlist fonctionne (PUT transactionnel, pas de boucle PATCH).
- [ ] Le compteur de réseaux se met à jour après sauvegarde (`router.refresh()`).

## Étape 3 — Placement & Routage (F5)

- [ ] Le placement se lance sans crash SWIG.
- [ ] Si KiCad est ouvert avec des modifications non enregistrées, l'app renvoie **423 `BOARD_LOCKED_BY_KICAD`** au lieu d'écrire dans le vide.
- [ ] Après fermeture de KiCad (ou sauvegarde), le placement se lance correctement.
- [ ] Freerouting trace les pistes sans erreur.

## Étape 4 — DRC & Export

- [ ] Le DRC s'exécute et liste les violations de manière claire.
- [ ] Les violations sont catégorisées (placement / routage / pré-existantes).
- [ ] L'export Gerbers / BOM / Pos fonctionne.
- [ ] Le devis JLCPCB s'affiche (ou le fallback si pas de credentials).
