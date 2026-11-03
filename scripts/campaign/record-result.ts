import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();
const DOMAINS = [
  'AUTH',
  'ADMIN',
  'CLIENT',
  'WS',
  'REVERSE',
  'EXPORT',
  'AI',
  'CONN',
  'FILES',
  'DESKTOP',
  'PWA',
  'I18N',
  'SEC',
  'INFRA',
  'TESTS',
];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i >= 0 && process.argv[i + 1] && !process.argv[i + 1]!.startsWith('--'))
    return process.argv[i + 1]!;
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  return eq ? eq.split('=').slice(1).join('=') : undefined;
}

function hasFlag(name: string): boolean {
  return process.argv.includes(`--${name}`);
}

function domainFromId(id: string): string {
  const m = id.match(/^E2E-([A-Z]+)-\d{2}$/);
  return m ? m[1]! : '';
}

async function main() {
  const id = arg('id');
  const verdict = arg('verdict');
  const report = arg('report');
  const capture = arg('capture');
  const note = arg('note') ?? '';
  const force = hasFlag('force');
  const retest = hasFlag('retest');
  const stampOnly = hasFlag('stamp-only');

  const validVerdicts = ['SUCCESS', 'BUG', 'INNOVATION', 'SKIPPED'];

  if (!id) {
    console.error('REFUSED: --id required');
    process.exit(1);
  }
  if (!/^E2E-[A-Z]+-\d{2}$/.test(id)) {
    console.error('REFUSED: id format must be E2E-<DOMAINE>-<NN>');
    process.exit(1);
  }
  const domain = domainFromId(id);
  if (!DOMAINS.includes(domain)) {
    console.error(`REFUSED: unknown domain ${domain}`);
    process.exit(1);
  }
  if (!verdict || !validVerdicts.includes(verdict)) {
    console.error('REFUSED: --verdict must be SUCCESS|BUG|INNOVATION|SKIPPED');
    process.exit(1);
  }

  if (!report) {
    console.error('REFUSED: --report required');
    process.exit(1);
  }
  if (!existsSync(report)) {
    console.error(`REFUSED: report not found: ${report}`);
    process.exit(1);
  }
  if (!report.endsWith('.md')) {
    console.error('REFUSED: report must be a .md file');
    process.exit(1);
  }
  const reportContent = readFileSync(report, 'utf-8');
  if (reportContent.length < 200) {
    console.error('REFUSED: report must be > 200 bytes');
    process.exit(1);
  }
  if (
    !reportContent.includes('SHA') ||
    !reportContent.includes('Exit code') ||
    !reportContent.includes('Verdict')
  ) {
    console.error('REFUSED: report must contain SHA, Exit code, Verdict');
    process.exit(1);
  }

  if (capture) {
    if (!existsSync(capture)) {
      console.error(`REFUSED: capture not found: ${capture}`);
      process.exit(1);
    }
  }

  if (force) {
    if (note.length < 20) {
      console.error('REFUSED: --force requires --note >= 20 chars');
      process.exit(1);
    }
  }

  const registrePath = join(ROOT, 'docs', 'campagne-tests', 'registres', `${domain}.md`);
  mkdirSync(join(ROOT, 'docs', 'campagne-tests', 'registres'), { recursive: true });

  // read existing
  let content = '';
  if (existsSync(registrePath)) content = readFileSync(registrePath, 'utf-8');

  // anti-doublon
  const idRegex = new RegExp(`^\\|\\s*${id}\\s*\\|`, 'm');
  const hasExistingSuccess = new RegExp(
    `^\\|\\s*${id}\\s*\\|[^\\n]*\\|\\s*SUCCESS\\s*\\|`,
    'm',
  ).test(content);

  if (hasExistingSuccess && verdict === 'SUCCESS' && !force) {
    console.error('REFUSED: id already SUCCESS. Use --force to overwrite.');
    process.exit(1);
  }

  // retest check
  if (retest) {
    const snapDir = join(ROOT, 'docs', 'campagne-tests', 'preuves', id);
    if (
      !existsSync(join(snapDir, 'db-snapshot.json')) ||
      !existsSync(join(snapDir, 'db-snapshot-retest.json'))
    ) {
      console.error('REFUSED: --retest requires both db-snapshot.json and db-snapshot-retest.json');
      process.exit(1);
    }
  }

  // commit sha
  let commitSha = 'unknown';
  try {
    commitSha = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim();
  } catch {}
  const date = new Date().toISOString();

  // stamp-only
  if (stampOnly) {
    const stampDir = join(ROOT, 'docs', 'campagne-tests', 'preuves', id);
    mkdirSync(stampDir, { recursive: true });
    writeFileSync(
      join(stampDir, 'commit.txt'),
      JSON.stringify({ commitSha, timestamp: date, branch: 'main' }, null, 2),
    );
    console.log('Stamp written');
    return;
  }

  // ensure table header exists
  if (!content.includes('| ID |')) {
    content = `# Registre ${domain}\n\n| ID | Fonctionnalité | Statut | Dépend de | Commit | Date | Preuve (RAPPORT.md) | Capture (opt) | Note | Historique |\n|---|---|---|---|---|---|---|---|---|---|\n`;
  }

  // build history string
  let history = '';
  if (force && hasExistingSuccess) {
    const m = content.match(new RegExp(`^\\|\\s*${id}\\s*\\|[^\\n]*`, 'm'));
    if (m) history = `[FORCÉ] ancien: ${m[0].split('|')[3]?.trim() ?? ''}`;
  }

  const row = `| ${id} | ${id} | ${verdict}${force && hasExistingSuccess ? ' [FORCÉ]' : ''} |  | ${commitSha.slice(0, 7)} | ${date} | ${report} | ${capture ?? 'n/a'} | ${note} | ${history} |`;

  // replace existing row if force, else append
  if (force && idRegex.test(content)) {
    content = content.replace(new RegExp(`^\\|\\s*${id}\\s*\\|[^\\n]*`, 'm'), row);
  } else {
    content = content.trimEnd() + '\n' + row + '\n';
  }

  writeFileSync(registrePath, content);
  console.log(`Recorded ${id} → ${verdict} in ${registrePath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
