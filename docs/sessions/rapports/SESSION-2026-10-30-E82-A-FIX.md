# SESSION-2026-10-30-E82-A-FIX — Correction Infobulles en Double

## §1 — Contexte

Correction de l'affichage en double des infobulles (native `title` + Radix Tooltip).

## §2 — Diagnostic

Cause : boutons avaient à la fois `title` natif et `<Tooltip>` Radix. Providers imbriqués (un par composant).

## §3 — Corrections

- Suppression des attributs `title` des boutons wrappés.
- Suppression des `TooltipProvider` redondants dans IngestZone/ViewerZone/AssistantZone.
- Ajout d'un unique `TooltipProvider` dans WorkspaceClient.

## §4 — Résultats

- `npm run typecheck` → EXIT 0.
- Lint : à vérifier.
- Test visuel : une seule infobulle par survol.

## §5 — Preuves

Imports ajustés, providers consolidés.
