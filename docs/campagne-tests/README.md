# Chaîne d'environnement — Campagne PartIVA

## Règles de chargement (état réel après V1.1)

| Contexte | Ordre de chargement | Fichier source |
|---|---|---|
| Next.js serveur (`npm start` / `npm run dev`) | `.env` puis `.env.local` | Next.js natif |
| Playwright | `.env` puis `.env.test` (override) | `playwright.config.ts:11-12` |
| `e2e/global-setup.ts` | `.env.test` seul (override) | `e2e/global-setup.ts:2` |
| Scripts `campaign:*` | `.env` puis `.env.test` (override) | `scripts/campaign/check-env.ts` |
| Prisma CLI | `.env` seul | `prisma7.config.ts:3` |

## Règles

- `.env.local` n'est JAMAIS chargé par la campagne ; il n'affecte que le serveur Next.js.
- `.env.test` doit rester en miroir des clés de `.env` nécessaires à la campagne (Cloudinary, Groq, auth E2E, DB test). Toute nouvelle clé doit être ajoutée aux deux fichiers.
- `.env.local` n'est pas versionné et n'est pas inclus dans le périmètre de la campagne.
