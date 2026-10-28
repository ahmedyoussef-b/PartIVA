# RAPPORT-ETAT-DES-LIEUX-E71 — Extraction des dimensions STEP

## §1 Auditer occt-import-js
Version: 0.0.23. API ReadStepFile(fileBuffer, params) retourne success, meshes (positions). Pas de bounding box dédiée; bounding box peut être calculée depuis positions.

## §2 Utilisation actuelle
cad-viewer.tsx charge via worker, construit geometry, computeBoundingSphere, normalizeGeometry (translate/scale). Pas de dimensions réelles conservées.

## §3 IngestZone
Champs length/width/height/diameter/unit + onDimensionsChange. Pas d'extraction automatique.

## §4 Flux
WorkspaceClient garde dimensions et cadFiles. ViewerZone reçoit uploadedFileUrl. Pas de bounding box remontée.

## §5 Options
A: extraire dans CadViewer et callback. B: utilitaire parse. C: worker. Option A+B recommandée: calculer dimensions avant normalisation et callback.

## §6 Modules isolés
CadViewer, IngestZone, WorkspaceClient modifiables. /api/engine reçoit dimensions.

## §7 Conclusion
Implémentation possible via callback onDimensionsExtracted.
