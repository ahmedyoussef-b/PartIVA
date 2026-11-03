# Registre ADMIN

| ID | FonctionnalitÃ© | Statut | DÃ©pend de | Commit | Date | Preuve (RAPPORT.md) | Capture (opt) | Note | Historique |
|---|---|---|---|---|---|---|---|---|---|
| E2E-ADMIN-01 | E2E-ADMIN-01 | BUG |  | 4abd4db | 2026-11-02T20:57:03.001Z | docs/campagne-tests/preuves/E2E-ADMIN-01/RAPPORT.md | n/a | BUG : upload image admin Ã©choue avec Invalid api_key Cloudinary. PiÃ¨ce crÃ©Ã©e sans image. Dettes D-ADMIN-CLOUDINARY-API-KEY + D-ADMIN-CREATION-PARTIAL. |  |
| E2E-ADMIN-02 | E2E-ADMIN-02 | BUG |  | 4abd4db | 2026-11-02T21:22:06.501Z | docs/campagne-tests/preuves/E2E-ADMIN-02/RAPPORT.md | n/a | BUG : aucun chemin d'Ã©dition visible. PiÃ¨ce en lecture seule. Dettes D-ADMIN-NO-EDIT-UI + D-ADMIN-READONLY-UI. |  |
| E2E-ADMIN-03 | E2E-ADMIN-03 | BUG |  | 4abd4db | 2026-11-03T09:15:10.033Z | docs/campagne-tests/preuves/E2E-ADMIN-03/RAPPORT.md | n/a | BUG : 2 défauts sur /admin/demandes. (1) Recherche ne couvre pas partName ('Pignon' → 0 résultat). (2) Bouton Actualiser non connecté (onClick absent). Dettes D-ADMIN-SEARCH-PARTNAME-MISSING + D-ADMIN-REFRESH-BUTTON-DEAD. |  |
