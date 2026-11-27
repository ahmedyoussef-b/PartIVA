# Audit — Apprentissage continu / mémoire de cas (2026-11-27)

*Rapport d'audit, aucun code modifié.*

## 1. État actuel — aucun apprentissage

- `src/lib/pcb/placement.ts` : uniquement des **poids constants** (`DENSITY_WEIGHT = 30`, `ROTATION_WEIGHT = 20`, `CLOCK_WEIGHT = 80`, `THERMAL_WEIGHT = 50`, `EDGE_TOP_WEIGHT = 600`…), force dirigée, recuit simulé (PRNG mulberry32 déterministe), passe séquentielle. Aucun retour d'expérience, aucune mise à jour de poids, aucune persistance de placement réussi.
- `scripts/kicad/route_board.py` : routage déterministe (contournement, clearance, zone GND). Idempotent depuis PR #235, mais **sans mémoire**.
- LLM : pré-entraîné et figé ; utilisé uniquement pour la topologie (BOM + nets). Il ne "voit" jamais le DRC final et ne s'adapte pas.
- Conclusion : reproductibilité excellente, **amélioration continue absente**. 100 placements identiques → 100 fois le même résultat.

## 2. Faisabilité RL (Voie A) — déconseillée

Intégrer un environnement type PCBWorld nécessiterait : des milliers de cartes d'entraînement, des semaines de GPU, une expertise PPO/GRPO + reward shaping, et un routeurwrapper compatible avec KiCad 10. Coût estimé : **plusieurs mois-homme + infrastructure GPU**. Risques majeurs : non-reproductibilité, dérive des politiques, dépendance à un moteur de routage externe. **Hors de portée pour une petite équipe sans GPU.**

## 3. Faisabilité Case-Based Reasoning (Voie B) — recommandée

L'infrastructure existe déjà :
- `embedTexts()` (`src/lib/ai/cloudflare-embeddings.ts`) pour les embeddings de texte ;
- pgvector + `document_chunks` et `searchVectorial()` (`src/lib/ai/rag-search.ts`) pour la recherche par similarité ;
- `PcbWizardValidation` / `PcbRoutingAttempt` pour identifier les projets aboutis (score, DRC).

Architecture proposée (3 étapes) :
1. **Capitaliser** : table `PcbPlacementExperience` — `projectId`, `cdcEmbedding vector`, `boardType`, `criticalNets`, `placements Json` (ref → x/y/rotation/layer), `drcScore`, `routingScore`, `createdAt`. Alimentée uniquement pour les projets dont le DRC est vert (ou dont le score ≥ seuil).
2. **Récupérer** : à la création d'un projet, embedder le CDC, requête `ORDER BY embedding <=> $1::vector LIMIT 1` avec filtre sur le type de carte, seuil de similarité (ex. 0,8). Retourner le placement du cas le plus proche.
3. **Injecter** : `optimizePlacement(components, nets, board, seedPositions?)` — utiliser les positions du cas similaire comme **point de départ du recuit** au lieu du placement initial. Le recuit reste déterministe ; seul l'initialisation change. Ajouter un `fallback` explicite si aucun cas similaire.

Effort estimé : **2 à 3 jours** (migration + table + service de capitalisation + paramètre seed + tests). Aucun GPU, réutilisation de l'infra RAG existante. Risque principal : similarité sémantique imparfaite entre CDC — mitigé par le seuil et le fallback.

## 4. Recommandation

**Voie B (mémoire de cas).** Elle transforme le système expert actuel en système **expérientiel** tout en conservant reproductibilité, déterminisme et simplicité. Le LLM reste cantonné à la topologie (ce qu'il sait faire) ; la géométrie reste aux heuristiques (ce qu'elles font bien). C'est la seule voie rentable dans notre contexte.

Ordre d'implémentation suggéré : (1) table + service de capitalisation, (2) récupération par embedding, (3) injection comme seed du recuit, (4) test sur deux projets similaires.
