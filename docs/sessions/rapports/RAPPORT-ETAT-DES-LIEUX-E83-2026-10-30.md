# RAPPORT-ETAT-DES-LIEUX-E83 — Mode Hors-Ligne PWA

## §1 — Configuration Next.js

- `next.config.mjs` : output conditionnel (`export` si `NEXT_EXPORT=true`), sinon undefined. Turbopack activé (`turbopack.root`). Next.js ^16.4.1.
- App Router (src/app).

## §2 — Dépendances PWA

- Aucune dépendance PWA installée (pas de next-pwa, workbox). package.json ne contient pas next-pwa.

## §3 — Fichiers PWA existants

- `public/manifest.json` : absent.
- `public/sw.js` : absent.
- Composant RegisterSW : absent.

## §4 — Options réalistes

- Option A (service worker manuel + manifest) : faisable, compatible Next 16/Turbopack, risque faible. Recommandé.
- Option B (next-pwa) : incompatible Turbopack/Next 16. Risqué.
- Option C (persist client) : complémentaire pour données applicatives.

## §5 — Modules isolés

- Manifest, sw.js, RegisterSW peuvent être ajoutés sans toucher aux flux stables.

## §6 — Recommandation

Option A (SW manuel minimal + manifest) comme E83-A, sans next-pwa.
