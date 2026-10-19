# Ressources impression 3D — PartIVA

**Date :** 2026-10-19
**Session :** E14-R3
**Statut :** Documentation

---

## 1. Sources de modèles 3D

| Source | Type | Accès | Licence |
|---|---|---|---|
| **3DCarParts** | Pièces auto (STL) | Public | CC BY-SA 4.0 |
| **Thingiverse** | Pièces diverses | Public | Variable (CC BY-SA, CC BY, etc.) |
| **GrabCAD** | CAO pro (STEP, IGES) | Freemium | Variable |
| **PrintYourVehicle** | Pièces auto | Freemium | Variable |

## 2. Matériaux d'impression

| Matériau | Usage | Résistance |
|---|---|---|
| **ABS** | Pièces auto intérieures | Moyenne (chaleur) |
| **PP** | Pièces flexibles | Faible (rigidité) |
| **PC** | Pièces techniques | Haute |
| **PA12 (Nylon)** | Pièces mécaniques | Très haute |
| **ASA** | Pièces extérieures (UV) | Haute |

## 3. Workflow scan-to-CAD → impression

1. **Scan 3D** (photogrammétrie, scanner 3D).
2. **Reconstruction CAO** (scan → mesh → STEP).
3. **Vérification fit** (outil de mesure, tolérances).
4. **Impression FDM** (layer 0.2mm, infill 70%, supports).
5. **Post-traitement** (ponçage, peinture, assemblage).

## 4. Avertissements sécurité

**Pièces critiques** (freinage, direction, suspension) : **ne pas imprimer en 3D** sans homologation. Le champ `safetyWarning` (E14-R1) alerte les utilisateurs.

## 5. Sources (PartIVA)

- **`printableModelUrl`** (champ `Part`, E14-R1) : URL vers un modèle STL/GLTF.
- **`StlViewer`** (composant, E14-R4) : visualisation 3D dans l'admin.
- **`FitReport`** (table, E14-R2) : retours d'expérience communautaires.