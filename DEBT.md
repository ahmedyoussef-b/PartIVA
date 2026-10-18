# DEBT — PartIVA

**Dernière mise à jour :** 2026-10-18
**Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
**Encodage :** UTF-8 sans BOM
**Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)

## Dettes actives

### Haute (0)

Aucune.

### Moyenne (1)

#### `D-E9-R7-1b` — 9 stubs web-only à implémenter

- **Statut :** Active
- **Priorité :** Moyenne
- **Session origine :** E9-R7
- **Cause :** Pages admin créées en placeholder (251–973 o) sans implémentation fonctionnelle
- **Périmètre :** machines, reverse-engineering, sync, usinage, demandes/[id], pieces, reverse-engineering/[id], demandes/[id]/recherche, recherche
- **Effort estimé :** Moyen (9 pages × ~30 lignes)
- **Bloquant :** Non
- **Prochaine session :** E10-R4

### Faible (2)

#### `D-E9-R7-1` — 11 pages web-only (2 fonctionnelles + 9 stubs)

- **Statut :** Requalifiée
- **Priorité :** Faible
- **Session origine :** E9-R7
- **Cause :** 11 pages web-only créées lors de la refonte export
- **Périmètre :** 2 fonctionnelles (`desktop-downloads`, `parametres` via `readFileSync` Server Component) + 9 stubs (<1000 o)
- **Sous-dette :** `D-E9-R7-1b` (implémentation des 9 stubs) — voir bloc ci-dessus
- **Effort estimé :** N/A
- **Bloquant :** Non
- **Prochaine session :** E10-R4

#### `D-E10-R2b-1` — search-bar : perte d'état au rechargement

- **Statut :** Active
- **Priorité :** Faible
- **Session origine :** E10-R2b
- **Cause :** Remplacement `router.push` → `window.location.href` (E10-R2b) — rechargement complet de la page au clic sur un résultat de recherche
- **Périmètre :** `src/components/search-bar.tsx:474`
- **Impact UX :** Perte du texte saisi, suggestions fermées, scroll reset
- **Trade-off :** Flash navigation (R3a-1) vs perte d'état (R2b-1) — choix assumé
- **Effort estimé :** Faible (état via `sessionStorage` ou query params)
- **Bloquant :** Non
- **Prochaine session :** À planifier (E10-R4 ou post-E10)

### Reportée (1)

#### `D-E9-R5-1` — Validation fonctionnelle reportée

- **Statut :** Reportée E11
- **Priorité :** Faible
- **Session origine :** E9-R5
- **Cause :** Dépend Vercel + token (environnement externe)
- **Périmètre :** N/A
- **Effort estimé :** N/A
- **Bloquant :** Non
- **Prochaine session :** E11

## Dettes clôturées

### E9 (2)

- **`D-E9-R6-2`** (sidecar non supporté) — ✅ Clôturée E9-R7 (abandon sidecar)
- **`D-E9-R7-2`** (4 pages desktop non converties) — ✅ Résolue E9-R8

### E10 (7)

- **`D-E9-R3a-2`** (ESLint non exécuté) — ✅ Clôturée E10-R1 (setState-in-effect, apostrophes, window.location corrigés)
- **`D-E9-R3a-3`** (bridge SQLite mocké) — ✅ Clôturée E10-R1 (aucun mock dans le code, bridge utilise invoke réel + fetch)
- **`D-E9-R3b-3`** (non-migration pages) — ✅ Fusionnée dans `D-E9-R7-1b` (redondance — même périmètre : 9 stubs)
- **`D-E9-R3b-bis-1`** (validation GUI reportée) — ✅ Clôturée E10-R2 (oubli documentaire historique, aucune dette technique résiduelle)
- **`D-E9-R3a-1`** (flash navigation) — ✅ Clôturée E10-R2b (5 transitions `router.push` → `window.location.href`, commit `f69d84d`)
- **`D-E9-R4b1-1`** (client non miroité) — ✅ Clôturée E10-R3 (obsolète — cause introuvable après 3 sessions, aucune trace code/JOURNAL/docs)
- **`D-E9-R4b1-2`** (photos TEXT JSON) — ✅ Clôturée E10-R3 (requalifiée — choix de conception assumé, `Json?` suffisant pour 10 photos <1 Mo, refactor coûteux non justifié)

## Notes

- **Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
- **Encodage :** UTF-8 sans BOM (standard git)
- **Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)
- **Redondance :** `D-E9-R3b-3` fusionnée dans `D-E9-R7-1b` (même périmètre : 9 stubs)
- **Prochaine session :** E10-R2b (`D-E9-R3a-1` : 5 edits)
- **Requalification E10-R3 :** `D-E9-R4b1-2` (photos TEXT JSON) n'est pas une dette technique mais un choix de conception. Refactor `Json?` → `Bytes?` = migration + 8 fichiers + rupture compat. Non justifié pour 10 photos <1 Mo.
