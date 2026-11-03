import 'dotenv/config';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const OUT = join(ROOT, 'docs', 'campagne-tests', 'env-ready.json');

type Checks = {
  server: boolean;
  db: boolean;
  migrations: boolean;
  seed: boolean;
  auth: boolean;
  commitShaInjected: boolean;
};

async function main() {
  const checks: Checks = {
    server: false,
    db: false,
    migrations: false,
    seed: false,
    auth: false,
    commitShaInjected: false,
  };

  // server
  try {
    const res = await fetch('http://localhost:3000');
    checks.server = res.ok || res.status < 500;
  } catch {
    checks.server = false;
  }

  // db
  const dbUrl = process.env.DATABASE_URL ?? '';
  checks.db = dbUrl.includes('partiva_test');

  // commit sha injected
  checks.commitShaInjected = Boolean(process.env.NEXT_PUBLIC_COMMIT_SHA);

  let commitSha = 'unknown';
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    commitSha = 'unknown';
  }

  // migrations + seed via prisma (dynamic import)
  if (checks.db) {
    try {
      const { prisma } = await import('../../src/lib/prisma.js');
      try {
        const mig = (await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::bigint AS c FROM "_prisma_migrations"`,
        )) as { c: bigint }[];
        checks.migrations = Number(mig[0]?.c ?? 0) > 0;
        const u = (await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS c FROM "users"`)) as {
          c: bigint;
        }[];
        checks.seed = Number(u[0]?.c ?? 0) > 0;
      } finally {
        await prisma.$disconnect();
      }
    } catch (e) {
      console.error('DB check failed:', e);
    }
  }

  // auth
  checks.auth = existsSync(join(ROOT, '.auth', 'admin.json'));

  const ok = checks.server && checks.db && checks.migrations && checks.seed && checks.auth;

  mkdirSync(join(ROOT, 'docs', 'campagne-tests'), { recursive: true });
  writeFileSync(
    OUT,
    JSON.stringify({ timestamp: new Date().toISOString(), commitSha, checks, ok }, null, 2),
  );

  if (!checks.commitShaInjected) {
    console.warn('WARNING: NEXT_PUBLIC_COMMIT_SHA not set (badge will show ???)');
  }

  if (!ok) {
    const failed = Object.entries(checks)
      .filter(([k, v]) => !v && k !== 'commitShaInjected')
      .map(([k]) => k)
      .join(', ');
    console.error(`ENV NOT READY: ${failed}`);
    process.exit(1);
  }
  console.log('ENV READY');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
