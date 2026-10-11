# PartIVA — Atelier Pièces Industrielles

SaaS / marketplace industriel (B2B) de fabrication de pièces de rechange techniques en plastique à la demande.

## Stack

- **Frontend** : Next.js 16 (App Router, React 19, Tailwind CSS 4, shadcn/ui)
- **Backend** : Next.js API Routes (Route Handlers)
- **Base de données** : PostgreSQL (Neon) + Prisma ORM 7 + pgvector (embeddings 768 dim, HNSW)
- **Auth** : BetterAuth (email/password, rôles ADMIN/USER/VIEWER)
- **Recherche** : full-text tsvector, référence (exact/préfixe), spécifications, dimensions, photo (CLIP ViT-B/32), multi-critères
- **Agrégation** : multi-sources (local_db, Wikidata, TraceParts) avec score pondéré
- **Tests** : Playwright (233 tests E2E, 5 projets)

## Démarrage

```bash
# Installer les dépendances
npm ci

# Copier les variables d'environnement
cp .env.example .env
# Éditer .env (DATABASE_URL, DIRECT_URL, ...)

# Appliquer les migrations
npx prisma migrate deploy

# Seed de développement
npx tsx prisma/seed.ts

# Lancer le serveur de développement
npm run dev
# → http://localhost:3000
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement (port 3000) |
| `npm run build` | Build de production |
| `npm run start` | Serveur de production |
| `npm run lint` | ESLint |
| `npm run format:check` | Prettier (vérification) |
| `npm run typecheck` | TypeScript (`tsc --noEmit`) |
| `npm run test:e2e` | Tests E2E Playwright |
| `npm run db:seed` | Seed de développement |
| `npm run db:backfill-embeddings` | Backfill des embeddings (nécessite `HF_API_TOKEN`) |

## Structure

```
src/
├── app/              # Pages Next.js (App Router)
│   ├── admin/        # Espace admin (rôle ADMIN)
│   ├── client/       # Espace client (rôle USER)
│   ├── api/          # Route Handlers
│   ├── (auth)/       # Auth (login, register)
│   └── (public)/     # Pages publiques
├── components/       # Composants React (domain/, layout/, ui/)
├── lib/              # Logique métier
│   ├── connectors/   # Connecteurs sources (local-db, wikidata, traceparts)
│   ├── data/         # Accès données (search, part-embeddings, ...)
│   └── scoring/      # Poids de scoring (SOURCE_WEIGHTS inter-sources)
├── schemas/          # Schémas Zod
└── i18n/             # Libellés (fr.ts)
e2e/                  # Tests E2E Playwright (admin/, user/, viewer/, public/)
prisma/               # Schéma Prisma + migrations (14)
docs/                 # Documentation (e2e-constraints.md, deployment.md)
```

## Rôles

| Rôle | Accès |
|---|---|
| **ADMIN** | Poste de contrôle atelier (`/admin/*`) — toutes les pièces, tous les clients |
| **USER** | Espace client (`/client/*`) — pièces du client uniquement |
| **VIEWER** | Lecture seule (toutes les pièces, aucune mutation) |

## Déploiement

Voir [`docs/deployment.md`](docs/deployment.md) — Vercel + GitHub Actions + Neon + Sentry.

## Qualité

- ESLint 0/0, TypeScript 0 erreur, Prettier 0 diff
- 233 tests E2E (0 failed, 3 skipped conditionnels)
- Build 55 routes

## Dettes

Voir [`DEBT.md`](DEBT.md) — registre vivant des dettes résiduelles (5 : 3 Moyennes + 2 Faibles).

## Licence

Privé — `github.com/ahmedyoussef-b/PartIVA`.
