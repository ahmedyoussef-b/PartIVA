# Roadmap V7 — Reconstruction de Pièce (Photos → CAO)

**Type :** Gouvernance / Roadmap
**Version :** 1.0
**Date :** 2026-11-09
**Statut :** Proposée (validation Superviseur requise)

## Contexte

V6 (recherche intelligente NLP + photo) est terminée. L’UI de la demande client (`/admin/demandes/[id]`) affiche les photos envoyées. V7 vise un parcours réel, pas à pas, pour transformer ces photos en un fichier CAO imprimable en 3D.

## Parcours V7 (4 méthodes, 5 sous-phases)

### V7-A — Méthode 1 : Catalogue (Recherche)
- **Action admin :** "Lancer Recherche Multi-Sources".
- **Mécanique :** Query Normalizer extrait les mots-clés des photos/texte et interroge les connecteurs (step_parts, CADENAS, etc.).
- **Issue :** si pièce trouvée → fin de parcours (validation/usine).

### V7-B — Méthode 2 : Reconstruction CAO (Workspace)
- **Action admin :** "Analyser avec le Workspace".
- **Mécanique :** IA extrait les dimensions des photos et génère un modèle STL via `generate-cad.ts`.
- **Issue :** si modèle valide → fin de parcours.

### V7-C — Méthode 3 : Rétro-ingénierie (Reverse CAO)
- **Action admin :** "Bascule Reverse CAO".
- **Mécanique :** modélisation manuelle si l’IA échoue.
- **Issue :** si modèle valide → fin de parcours.

### V7-D — Méthode 4 : Import CAO
- **Action admin :** import fichier STEP/IGES fourni par le client.
- **Mécanique :** affichage dans le viewer 3D.
- **Issue :** si modèle valide → fin de parcours.

### V7-E — Clôture
- **Action admin :** "Valider → Lancer Usinage" ou "Imprimer 3D".
- **Condition :** pièce obtenue par n’importe quelle méthode (V7-A/B/C/D).

## Notes

- Parcours séquentiel possible mais non obligatoire : l’admin peut choisir la méthode adaptée.
- V7-E est la phase de clôture commune.
