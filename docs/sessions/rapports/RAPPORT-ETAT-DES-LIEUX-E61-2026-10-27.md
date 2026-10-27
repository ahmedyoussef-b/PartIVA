# RAPPORT-ETAT-DES-LIEUX-E61-2026-10-27 — Capacités de génération CAO

## §1 — Module reconstruct actuel
- `select-candidates.ts` : détection par extension, fallback `generated` avec fileUrl vide.
- `reconstruct.ts` : succès si fichier 3D valide, sinon partial/failed.
- Aucune génération réelle.

## §2 — Capacités CAO disponibles
- `occt-import-js` : import uniquement (pas de génération).
- `three`/`@react-three` : rendu uniquement.
- Aucun service externe de génération 3D configuré.
- Groq/Cloudflare : LLM et embeddings, pas de CAO.

## §3 — Dépendances et contraintes
- Bibliothèques 3D : three, drei, fiber, occt-import-js.
- APIs : Groq, Cloudflare (embeddings).
- Contrainte : génération CAO lourde côté serveur; navigateur limité.

## §4 — Options de génération CAO
- Option A (OpenCascade serveur) : faisabilité faible (pas de binding génération).
- Option B (photogrammétrie externe) : nécessite service externe, risque moyen.
- Option C (LLM + templates) : faisable, génère des paramètres; risque moyen.
- Option D (fallback amélioré) : faisable, faible risque, valeur limitée.

## §5 — Modules isolés
- `src/core/ai-engine/skills/reconstruct/` isolé.
- Points de contact : `/api/engine`, WorkspaceClient (fileUrl).

## §6 — Preuves
- Fichiers lus : reconstruct/*, package.json, cad-viewer.tsx.
- Aucune modification code.

## §7 — Statut
Rapport d'état des lieux complet. Arrêt.
