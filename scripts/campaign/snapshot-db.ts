import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1]) return process.argv[i + 1];
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split('=').slice(1).join('=') : undefined;
}

async function main() {
  const id = arg('id');
  const retest = process.argv.includes('--retest');
  const force = process.argv.includes('--force');

  const dbUrl = process.env.DATABASE_URL ?? '';
  if (!dbUrl.includes('partiva_test')) {
    console.error('REFUSED: DATABASE_URL must point to partiva_test');
    process.exit(1);
  }

  const { prisma } = await import('../../src/lib/prisma.js');

  const tables = (await prisma.$queryRawUnsafe(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`,
  )) as { tablename: string }[];

  const counts: Record<string, number> = {};
  for (const t of tables) {
    const name = t.tablename;
    if (name.startsWith('_')) continue;
    try {
      const r = await prisma.$queryRawUnsafe(`SELECT COUNT(*)::bigint AS c FROM "${name}"`);
      counts[name] = Number((r as { c: bigint }[])[0]?.c ?? 0);
    } catch {
      counts[name] = -1;
    }
  }
  await prisma.$disconnect();

  const fileName = retest ? 'db-snapshot-retest.json' : 'db-snapshot.json';
  let outDir: string;
  if (id) {
    outDir = join(ROOT, 'docs', 'campagne-tests', 'preuves', id);
  } else {
    outDir = join(ROOT, 'docs', 'campagne-tests');
  }
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, fileName);

  if (existsSync(outPath) && !force) {
    console.error(`REFUSED: ${outPath} exists. Use --force to overwrite.`);
    process.exit(1);
  }

  writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), counts }, null, 2));
  console.log(`Snapshot written: ${outPath}`);
  if (!id) {
    console.log(JSON.stringify(counts));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
