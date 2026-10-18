# DETTE — PartIVA

**Dernière mise à jour :** 2026-10-18

## Dettes actives

### Haute
- Aucune

### Moyenne
- `D-E9-R7-1b` (9 pages web-only stubs) — Moyenne, planifiée E10-R4

### Faible
- `D-E9-R3a-1` (flash navigation) — Amélioration UX
- `D-E9-R3b-3` (non-migration pages) — Refactorisation
- `D-E9-R3b-bis-1` (validation GUI reportée) — Fonctionnalité
- `D-E9-R4b1-1` (client non miroité) — Requalifiée, non bloquante
- `D-E9-R4b1-2` (photos TEXT JSON) — Requalifiée, non bloquante
- `D-E9-R5-1` (validation fonctionnelle) — Reportée E11 (dépend Vercel + token)
- `D-E9-R7-1` (11 pages web-only) — Requalifiée, 2 fonctionnelles + 9 stubs
  - ⤷ Sous-dette : `D-E9-R7-1b` (implémentation des 9 stubs)

## Clôturées
- `D-E9-R3a-2` (ESLint non exécuté) — ✅ Clôturée E10-R1 (setState-in-effect, apostrophes, window.location corrigés)
- `D-E9-R3a-3` (bridge SQLite mocké) — ✅ Clôturée E10-R1 (aucun mock dans le code, bridge utilise invoke réel + fetch)
- `D-E9-R6-2` (sidecar non supporté) — ✅ Clôturée E9-R7 (abandon sidecar)
- `D-E9-R7-2` (4 pages desktop non converties) — ✅ Résolue E9-R8

## Notes
- Les dettes Faible sont réparties entre E10 (nettoyage technique) et roadmap fonctionnelle
- Aucun blocage critique pour la clôture E9