# DEBT — PartIVA

**Dernière mise à jour :** 2026-10-18
**Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
**Encodage :** UTF-8 sans BOM
**Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)

## Dettes actives

### Haute (0)

Aucune.

### Moyenne (0)

Aucune.

### Faible (2)

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
- **Prochaine session :** À planifier (post-E12)

#### `D-E12-NEWLINE` — `CONTEXT.md` sans newline finale

- **Statut :** Active
- **Priorité :** Très faible
- **Session origine :** E12-R0
- **Cause :** Fichier sans newline finale (POSIX recommande)
- **Périmètre :** `CONTEXT.md`
- **Effort estimé :** Très faible (1 édition)
- **Bloquant :** Non
- **Prochaine session :** E13

### Reportée (0)

Aucune.

## Dettes clôturées

### E9 (2)

- **`D-E9-R6-2`** (sidecar non supporté) — ✅ Clôturée E9-R7 (abandon sidecar)
- **`D-E9-R7-2`** (4 pages desktop non converties) — ✅ Résolue E9-R8

### E10 (9)

- **`D-E9-R3a-2`** (ESLint non exécuté) — ✅ Clôturée E10-R1 (setState-in-effect, apostrophes, window.location corrigés)
- **`D-E9-R3a-3`** (bridge SQLite mocké) — ✅ Clôturée E10-R1 (aucun mock dans le code, bridge utilise invoke réel + fetch)
- **`D-E9-R3b-3`** (non-migration pages) — ✅ Fusionnée dans `D-E9-R7-1b` (redondance — même périmètre : 9 stubs)
- **`D-E9-R3b-bis-1`** (validation GUI reportée) — ✅ Clôturée E10-R2 (oubli documentaire historique, aucune dette technique résiduelle)
- **`D-E9-R3a-1`** (flash navigation) — ✅ Clôturée E10-R2b (5 transitions `router.push` → `window.location.href`, commit `f69d84d`)
- **`D-E9-R4b1-1`** (client non miroité) — ✅ Clôturée E10-R3 (obsolète — cause introuvable après 3 sessions, aucune trace code/JOURNAL/docs)
- **`D-E9-R4b1-2`** (photos TEXT JSON) — ✅ Clôturée E10-R3 (requalifiée — choix de conception assumé, `Json?` suffisant pour 10 photos <1 Mo, refactor coûteux non justifié)
- **`D-E9-R7-1`** (11 pages web-only) — ✅ Clôturée E10-R4a (obsolète — 11/11 fonctionnelles : 9 Server Components courts + 2 via `readFileSync`)
- **`D-E9-R7-1b`** (9 stubs web-only) — ✅ Clôturée E10-R4a (obsolète — 9/9 fonctionnelles : Server Components courts + Client Components lourds, pattern Next.js standard)

### E11 (1)

- **`D-E9-R5-1`** (validation fonctionnelle Vercel) — ✅ Clôturée E11-R1 (8/8 tests Playwright passés, commit `c8e40da`)

## Notes

- **Structure :** une dette = un bloc (ID, statut, priorité, cause, périmètre, effort, prochaine session)
- **Encodage :** UTF-8 sans BOM (standard git)
- **Lecture :** `Get-Content DEBT.md -Encoding UTF8` (PowerShell sans `-Encoding UTF8` masque le contenu)
- **Redondance :** `D-E9-R3b-3` fusionnée dans `D-E9-R7-1b` (même périmètre : 9 stubs)
- **Prochaine session :** E10-R2b (`D-E9-R3a-1` : 5 edits)
- **Requalification E10-R3 :** `D-E9-R4b1-2` (photos TEXT JSON) n'est pas une dette technique mais un choix de conception. Refactor `Json?` → `Bytes?` = migration + 8 fichiers + rupture compat. Non justifié pour 10 photos <1 Mo.
- **Requalification E10-R4a :** `D-E9-R7-1`/`R7-1b` mal calibrées en E9-R7. Les 9 « stubs » (251–973 o) sont des Server Components courts déléguant à des Client Components lourds (11–36 Ko). Aucune page vide. Leçon : « petit fichier » ≠ « stub ».
- **Clôture E11 :** `D-E9-R5-1` validée (8/8 tests Playwright — 6 pages admin + login/register + healthcheck API). `D-E10-R2b-1` reste active (post-E11).
