# RAPPORT-ETAT-DES-LIEUX-E68-2026-10-28 — ViewerZone

## §1 ViewerZone actuel
- Props: fileUrl?: string | null.
- Affiche CadViewer si STEP/IGES, sinon ModelViewer.
- fileUrl provient de result?.reconstruct?.candidates?.[0]?.fileUrl (WorkspaceClient), pas de l'upload.

## §2 Composants visualisation
- CadViewer: src, height, timeoutMs, maxSizeMb, bare. STEP/IGES via worker.
- ModelViewer: src, alt, height, bare. Dispatch par extension.
- StlViewer pour maillages.

## §3 Flux données
- WorkspaceClient: cadFiles state. ViewerZone fileUrl = result reconstruct candidate. Aucun lien direct entre cadFiles uploadés et ViewerZone.
- cadFiles sont des blob/Cloudinary URLs disponibles avant /api/engine.

## §4 Options
A: afficher fichier uploadé dès sélection (cadFiles[0]) dans ViewerZone. Faisable, faible risque.
B: afficher uploadé + résultat reconstruction (deux vues). Plus complexe.
C: afficher uploadé uniquement si reconstruction partial. Moyen.

## §5 Modules isolés
ViewerZone et WorkspaceClient isolés; impact limité.

## §6 Preuves
Extraits ci-dessus.
