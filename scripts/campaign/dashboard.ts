import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const ROOT = process.cwd();
const REG_DIR = join(ROOT, 'docs', 'campagne-tests', 'registres');
const OUT = join(ROOT, 'docs', 'campagne-tests', 'REGISTRE.md');

function parseRows(text: string): { id: string; status: string }[] {
  const rows: { id: string; status: string }[] = [];
  for (const line of text.split('\n')) {
    const m = line.match(
      /^\|\s*(E2E-[A-Z]+-\d{2})\s*\|\s*[^|]*\|\s*(SUCCESS|BUG|INNOVATION|SKIPPED)/,
    );
    if (m) rows.push({ id: m[1]!, status: m[2]! });
  }
  return rows;
}

async function main() {
  mkdirSync(join(ROOT, 'docs', 'campagne-tests'), { recursive: true });
  const files = existsSync(REG_DIR) ? readdirSync(REG_DIR).filter((f) => f.endsWith('.md')) : [];

  const domainStats: Record<string, { S: number; B: number; I: number; K: number }> = {};
  const openBugs: string[] = [];

  for (const f of files) {
    const domain = f.replace('.md', '');
    const text = readFileSync(join(REG_DIR, f), 'utf-8');
    const rows = parseRows(text);
    const stat = { S: 0, B: 0, I: 0, K: 0 };
    for (const r of rows) {
      if (r.status === 'SUCCESS') stat.S++;
      else if (r.status === 'BUG') {
        stat.B++;
        openBugs.push(r.id);
      } else if (r.status === 'INNOVATION') stat.I++;
      else if (r.status === 'SKIPPED') stat.K++;
    }
    domainStats[domain] = stat;
  }

  let out = '# Registre agrégé — Campagne de tests réels PartIVA\n\n';
  out += '> Généré automatiquement par `npm run campaign:dashboard`. Ne pas éditer à la main.\n\n';
  out += '## Par domaine\n\n';
  out += '| Domaine | SUCCESS | BUG | INNOVATION | SKIPPED | Total |\n|---|---|---|---|---|---|\n';
  for (const [d, s] of Object.entries(domainStats)) {
    out += `| ${d} | ${s.S} | ${s.B} | ${s.I} | ${s.K} | ${s.S + s.B + s.I + s.K} |\n`;
  }
  out += '\n## BUG ouverts\n\n';
  if (openBugs.length === 0) out += '_Aucun._\n';
  else for (const b of openBugs) out += `- ${b}\n`;

  writeFileSync(OUT, out);
  console.log('Dashboard generated:', OUT);
}

// need existsSync import
import { existsSync } from 'fs';
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
