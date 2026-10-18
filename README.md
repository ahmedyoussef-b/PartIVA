# PartIVA

**SaaS/marketplace industriel B2B** — Recherche fédérée multi-sources, reverse engineering, scoring multi-critères, workflow de fabrication.

**Positionnement :** [docs/positioning.md](docs/positioning.md)

---

## 1. Stack

| Composant | Version |
|---|---|
| Next.js | 16.4.0 |
| React | 19.3.0 |
| Prisma | 7.10.0 |
| TypeScript | 5.9.3 |
| Tailwind | 4.3.3 |
| BetterAuth | 1.7.7 |
| Zod | 4.6.5 |
| Playwright | 1.64.0 |
| PostgreSQL | Neon (pgvector 0.8.0) |

---

## 2. Démarrage rapide

### 2.1 Prérequis

- Node.js ≥ 22
- npm ≥ 10
- PostgreSQL (Neon recommandé)

### 2.2 Installation

```bash
npm install
```

### 2.3 Variables d'environnement

Voir [docs/deployment.md](docs/deployment.md).

### 2.4 Base de données

```bash
npx prisma migrate deploy
npx prisma db seed
```

### 2.5 Développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

---

## 3. Scripts

| Script | Objet |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Build production |
| `npm start` | Serveur production |
| `npm run lint` | ESLint |
| `npm run format` | Prettier (écriture) |
| `npm run format:check` | Prettier (vérification) |
| `npm run typecheck` | TypeScript |
| `npm run db:seed` | Seed DB |
| `npm run test:e2e` | Tests E2E Playwright |

---

## 4. Architecture

Voir [docs/architecture.md](docs/architecture.md).

---

## 5. État du projet

| Phase | Objet | Statut |
|---|---|---|
| E1 | Fondations | ✅ |
| E2 | Recherche (6 modes) | ✅ |
| E3 | Sources externes | ✅ |
| E4 | Consolidation | ✅ |
| E5 | TecDoc mock | ✅ |
| E6 | Déblocage, catalogue, auto-parts | ✅ |
| E7 | Déblocage 5 Moyennes | 🟠 Bloquée (credentials) |
| E8 | Stabilisation, production | ✅ |
| E9 | Desktop Tauri (export) | ✅ |

**Baseline :** ESLint 0/0 · TS 0 · Prettier 0 · Build 22 routes · E2E 284/0/4 · Prisma 15 migrations.

---

## 6. Documentation

- [docs/architecture.md](docs/architecture.md) — Architecture
- [docs/positioning.md](docs/positioning.md) — Positionnement
- [docs/deployment.md](docs/deployment.md) — Déploiement
- [docs/e2e-constraints.md](docs/e2e-constraints.md) — Contraintes E2E
- [docs/migration-drift.md](docs/migration-drift.md) — Drift migration
- [docs/e6-close-report.md](docs/e6-close-report.md) — Clôture phase E6
- [docs/e8-s02-audit.md](docs/e8-s02-audit.md) — Audit E8-S02

---

## 7. Licence

[À définir]
