import 'dotenv/config';
import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in environment variables');
}

/**
 * E24-R1 — Configuration explicite du pool `pg` derrière l'adaptateur Prisma.
 *
 * - `connectionTimeoutMillis: 10_000` : le driver `pg` n'a **aucun** timeout de
 *   connexion par défaut (0 = illimité) — sans valeur explicite, une connexion
 *   morte bloque la requête jusqu'au timeout du moteur Prisma. On échoue vite
 *   (fail fast) au lieu de pendre 30 s.
 * - `idleTimeoutMillis: 30_000` / `max: 10` : même valeurs que les défauts `pg`,
 *   explicitées pour documenter l'intention et éviter une dérive future.
 *
 * L'URL reste l'endpoint *pooler* Neon. À noter : avec un **driver adapter**,
 * Prisma ne lit jamais la chaîne de connexion — l'adaptateur la transmet
 * telle quelle à `new Pool()` (cf. `@prisma/adapter-pg`). Les drapeaux
 * `pgbouncer=true` / `uselibpqcompat=true` n'ont donc **aucun effet** sur le
 * runtime ; ils ne servent qu'au moteur Rust (CLI de migration).
 */
const POOL_CONFIG = {
  connectionString,
  connectionTimeoutMillis: 10_000,
  idleTimeoutMillis: 30_000,
  max: 10,
};

/**
 * Singleton global : en dev, le HMR de Next.js ré-évalue ce module. Sans
 * global, chaque ré-évaluation crée un nouveau client **et** un nouveau pool
 * (les connexions de l'ancien pool ne sont jamais fermées). On mémorise donc
 * l'adaptateur en plus du client.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaAdapter: PrismaPg | undefined;
};

const adapter =
  globalForPrisma.prismaAdapter ??
  new PrismaPg(POOL_CONFIG, {
    schema: 'public',
    // Signature d'un pooler qui tue une connexion inactive : on la trace pour
    // confirmer l'hypothèse en cas de nouvelle occurrence (cf. D-E23-PRISMA-POOLER-TIMEOUT).
    onPoolError: (err: Error) => {
      console.error('[prisma] erreur pool Neon :', err.message);
    },
  });

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdapter = adapter;
}
