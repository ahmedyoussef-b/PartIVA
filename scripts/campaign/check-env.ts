import { config as dotenvConfig } from 'dotenv';
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
  groq: boolean;
};

async function main() {
  const checks: Checks = {
    server: false,
    db: false,
    migrations: false,
    seed: false,
    auth: false,
    commitShaInjected: false,
    groq: false,
  };

  // Chargement d'environnement : .env.test avec override, fallback .env
  if (existsSync('.env.test')) {
    dotenvConfig({ path: '.env.test', override: true });
  } else {
    dotenvConfig({ path: '.env' });
    console.warn('[CAMPAIGN-CHECK-ENV] .env.test absent, fallback sur .env');
  }

  // server
  try {
    const res = await fetch('http://localhost:3000');
    checks.server = res.ok || res.status < 500;
    console.log(`[CAMPAIGN-CHECK-SERVER] status=${res.status}`);
  } catch {
    checks.server = false;
    console.log('[CAMPAIGN-CHECK-SERVER] status=unreachable');
  }

  // db — connexion réelle (SELECT 1)
  try {
    const { prisma } = await import('../../src/lib/prisma.js');
    try {
      await prisma.$queryRawUnsafe('SELECT 1');
      checks.db = true;
      console.log(
        `[CAMPAIGN-CHECK-DB] url=partiva_test=${Boolean(
          process.env.DATABASE_URL?.includes('partiva_test'),
        )} ok`,
      );
    } finally {
      await prisma.$disconnect();
    }
  } catch (e) {
    checks.db = false;
    console.error(
      `[CAMPAIGN-CHECK-DB] error=${(e as Error)?.message ?? String(e)}`,
    );
  }

  // commit sha injected
  checks.commitShaInjected = Boolean(process.env.NEXT_PUBLIC_COMMIT_SHA);
  console.log(`[CAMPAIGN-CHECK-COMMIT_SHA] injected=${checks.commitShaInjected}`);

  let commitSha = 'unknown';
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  } catch {
    commitSha = 'unknown';
  }

  // migrations + seed via prisma (uniquement si db ok)
  if (checks.db) {
    try {
      const { prisma } = await import('../../src/lib/prisma.js');
      try {
        const mig = (await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::bigint AS c FROM "_prisma_migrations"`,
        )) as { c: bigint }[];
        checks.migrations = Number(mig[0]?.c ?? 0) > 0;
        console.log(
          `[CAMPAIGN-CHECK-MIGRATIONS] count=${mig[0]?.c ?? 0} ok=${checks.migrations}`,
        );
        const u = (await prisma.$queryRawUnsafe(
          `SELECT COUNT(*)::bigint AS c FROM "users"`,
        )) as { c: bigint }[];
        checks.seed = Number(u[0]?.c ?? 0) > 0;
        console.log(`[CAMPAIGN-CHECK-SEED] count=${u[0]?.c ?? 0} ok=${checks.seed}`);
      } finally {
        await prisma.$disconnect();
      }
    } catch (e) {
      console.error('DB check failed:', e);
    }
  }

  // auth — validation runtime (D-CAMPAIGN-CHECK-AUTH-VALIDITY)
  const authFile = join(ROOT, '.auth', 'admin.json');
  if (!existsSync(authFile)) {
    console.warn('[CAMPAIGN-CHECK-AUTH] file absent — cannot validate runtime session without cookie');
    checks.auth = false;
  } else {
    try {
      const raw = (await import('fs')).readFileSync(authFile, 'utf-8');
      const state = JSON.parse(raw) as { cookies?: { name: string; value: string }[] };
      const sessionCookie = (state.cookies ?? []).find((c) => c.name === 'better-auth.session_token');
      if (!sessionCookie) {
        console.error('[CAMPAIGN-CHECK-AUTH] no session cookie in storage state');
        checks.auth = false;
      } else {
        const cookieHeader = `better-auth.session_token=${sessionCookie.value}`;
        try {
          const res = await fetch('http://localhost:3000/api/auth/get-session', {
            headers: { Cookie: cookieHeader },
          });
          if (!res.ok) {
            checks.auth = false;
            console.error(`[CAMPAIGN-CHECK-AUTH] get-session status=${res.status} (cookie invalid/expired)`);
          } else {
            const body = (await res.json()) as { user?: unknown } | null;
            checks.auth = Boolean(body && body.user);
            console.log(`[CAMPAIGN-CHECK-AUTH] session alive=${checks.auth}`);
          }
        } catch (e) {
          checks.auth = false;
          console.error(`[CAMPAIGN-CHECK-AUTH] endpoint unreachable: ${(e as Error)?.message ?? String(e)}`);
        }
      }
    } catch (e) {
      checks.auth = false;
      console.error(`[CAMPAIGN-CHECK-AUTH] parse error: ${(e as Error)?.message ?? String(e)}`);
    }
  }

  // Groq (NOUVEAU)
  const groqModel = process.env.GROQ_MODEL?.trim();
  const groqVisionModel = process.env.GROQ_VISION_MODEL?.trim();
  const groqApiKey = process.env.GROQ_API_KEY;

  if ((groqModel?.startsWith('llama-') ?? false) || (groqVisionModel?.startsWith('llama-') ?? false)) {
    checks.groq = false;
    console.error('[CAMPAIGN-CHECK-GROQ] forbidden model=llama-*');
  } else if (groqApiKey && groqModel) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10_000);
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqApiKey}`,
        },
        body: JSON.stringify({
          model: groqModel,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
          stream: false,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      checks.groq = res.ok;
      console.log(`[CAMPAIGN-CHECK-GROQ] model=${groqModel} status=${res.status}`);
    } catch (e) {
      checks.groq = false;
      console.error(
        `[CAMPAIGN-CHECK-GROQ] model=${groqModel ?? '<absent>'} error=${(e as Error)?.message ?? String(e)}`,
      );
    }
  } else {
    checks.groq = false;
    console.error('[CAMPAIGN-CHECK-GROQ] key_or_model_missing');
  }

  const ok =
    checks.server &&
    checks.db &&
    checks.migrations &&
    checks.seed &&
    checks.auth &&
    checks.groq;

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
