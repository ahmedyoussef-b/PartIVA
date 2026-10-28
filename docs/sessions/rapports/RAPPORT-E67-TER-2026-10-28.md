# RAPPORT-E67-TER-2026-10-28 — Investigation Composant Upload

## §1 Contexte
Recherche de composant d'upload réutilisable pour IngestZone.

## §2 Composants trouvés
- docs/app/src/components/upload/file-upload-zone.tsx (FileUploadZone) — drop/click, Cloudinary/API, JSON/CSV/Excel/PDF.
- docs/app/src/components/upload/file-upload-button.tsx (FileUploadButton) — bouton upload Tauri/web, accept configurable.
- src/components/shared/image-uploader.tsx — upload images (à auditer).
- src/lib/upload.ts — utilitaires.

## §3 Analyse
FileUploadZone gère drag&drop et clic, filtres extensions, upload via /api/upload ou Tauri. FileUploadButton gère upload base64, Tauri/web, progress/results.

## §4 Plan d'intégration proposé
Réutiliser FileUploadZone pattern (drop/click + hidden input) dans IngestZone, adapter accept pour CAO (stl,step,...), conserver simulateUpload Cloudinary. Risque faible, impact isolé.

## §5 Preuves
Chemins et extraits ci-dessus.
