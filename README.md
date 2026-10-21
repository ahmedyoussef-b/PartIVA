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
| E1 → E9 | Fondations, recherche, desktop | ✅ |
| E10 → E16 | Purge dettes, validation, 3D | ✅ |
| E17 → E21 | Clôture dettes, auth Vercel | ✅ |
| E22 → E24 | Refonte UI, CRUD pièces, robustesse Prisma | ✅ |
| E25 | Correctif timeout sources externes | ✅ |
| E26 | Réforme de la procédure de coopération | 🟡 En cours |

**Baseline :** ESLint 0/0 · TypeScript 0 · Prettier 0 · Build 61/61 pages (prerender `/admin/machines` bloqué par `D-E23-PRISMA-POOLER-TIMEOUT`) · E2E 4/4 setups.

**Dettes actives :** 6 (voir `docs/etat/DETTES.md`).

**Structure documentaire :** `docs/gouvernance/`, `docs/etat/`, `docs/modeles/`, `docs/sessions/`.

---

## 6. Index documentaire

| Document | Rôle |
|---|---|
| `PROMPT_DE_REPRISE.md` | Point d'entrée pour une nouvelle conversation |
| `AGENTS.md` | Instructions pour les agents de développement |
| `docs/gouvernance/CHARTE.md` | Principes de gouvernance |
| `docs/etat/ETAT_COURANT.md` | État actuel du projet |
| `docs/etat/DETTES.md` | Dettes actives |
| `docs/etat/DECISIONS.md` | Décisions validées |
| `docs/sessions/INDEX.md` | Index des sessions |
| `docs/modeles/MODELE_TACHE.md` | Modèle de tâche |
| `docs/sessions/rapports/SESSION-AAAA-MM-JJ-E<num>.md` | Rapports de session |
| `docs/archive/` | Archives (lecture seule) |
| `docs/architecture.md` | Architecture technique |
| `docs/deployment.md` | Déploiement |
| `docs/3d-format-support.md` | Support des formats 3D |
| `docs/e2e-constraints.md` | Contraintes E2E (Playwright) |
| `docs/migration-drift.md` | Procédure de gestion du drift Prisma |

---

## 7. Licence

[À définir]
