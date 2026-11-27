/* eslint-disable @typescript-eslint/no-require-imports */
// Dev server for PartIVA Desktop (`tauri dev`).
// 1. Load local config from %APPDATA%\PartIVA\db.toml (or PARTIVA_* env vars).
// 2. Inject DATABASE_URL / BETTER_AUTH_SECRET / optional LLM keys.
// 3. Run the Next.js dev server on port 3100 (no standalone build, no sidecar).
//
// This script is used as Tauri's `beforeDevCommand`; Rust navigates the webview
// to http://localhost:3100/ and skips the Node sidecar in dev mode.

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const net = require('net');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
// Must match `build.devUrl` in desktop/src-tauri/tauri.conf.json.
const port = '3100';

function readKey(content, wanted) {
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    if (line.slice(0, eq).trim() !== wanted) continue;
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, '');
    if (value) return value;
  }
  return null;
}

const appData = process.env.APPDATA || '';
const configFile = appData ? path.join(appData, 'PartIVA', 'db.toml') : null;
let content = null;
if (configFile && fs.existsSync(configFile)) {
  // T4.1 — remove a UTF-8 BOM (PowerShell `>` / `Out-File` often adds one).
  content = fs.readFileSync(configFile, 'utf8').replace(/^\uFEFF/, '');
  console.log(`[dev] config: ${configFile}`);
} else {
  console.log('[dev] config: db.toml absent (variables PARTIVA_* uniquement)');
}

const env = { ...process.env };

const databaseUrl =
  process.env.PARTIVA_DATABASE_URL?.trim() || (content ? readKey(content, 'DATABASE_URL') : null);
if (databaseUrl) env.DATABASE_URL = databaseUrl;

// Stable secret in all cases (avoids Better Auth's per-process default secret).
env.BETTER_AUTH_SECRET =
  process.env.PARTIVA_BETTER_AUTH_SECRET?.trim() ||
  (content ? readKey(content, 'BETTER_AUTH_SECRET') : null) ||
  'partiva-desktop-dev-secret-32-chars-min';
env.BETTER_AUTH_URL = `http://localhost:${port}`;
// Enables desktop-only routes (KiCad launch) from the dev server.
env.PARTIVA_DESKTOP = '1';
// Cache/verrou Next.js dédiés au dev desktop (peut cohabiter avec le dev web).
env.PARTIVA_DESKTOP_DEV = '1';

const llmKeys = [
  'GROQ_API_KEY',
  'GROQ_MODEL',
  'GROQ_BASE_URL',
  'CEREBRAS_API_KEY',
  'CEREBRAS_MODEL',
  'OPENROUTER_API_KEY',
  'OPENROUTER_MODEL',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'GOOGLE_AI_API_KEY',
  'LLM_PROVIDER',
];
const injected = [];
for (const key of llmKeys) {
  const value = process.env[key]?.trim() || (content ? readKey(content, key) : null);
  if (value) {
    env[key] = value;
    injected.push(key);
  }
}

// Never log secret values, only presence.
console.log(`[dev] DATABASE_URL ${databaseUrl ? 'injectée' : 'absente (écran de configuration)'}`);
console.log(`[dev] clés LLM injectées: ${injected.length ? injected.join(', ') : 'aucune'}`);

const nextBin = path.join(root, 'node_modules', 'next', 'dist', 'bin', 'next');
if (!fs.existsSync(nextBin)) {
  console.error(`[dev] next introuvable: ${nextBin} (npm install requis)`);
  process.exit(1);
}

const args = [nextBin, 'dev', '-p', port];
if (process.env.PARTIVA_DEV_WEBPACK === '1') args.push('--webpack');
// Le client Prisma doit refléter le schéma courant, sinon les routes qui
// utilisent un modèle ajouté récemment plantent avec "reading 'findMany'".
console.log('[dev] prisma generate (client à jour)');
execSync('npx prisma generate', { cwd: root, stdio: 'inherit' });

console.log(`[dev] next dev -p ${port} (${root})`);

// Un serveur déjà à l'écoute sur 3100 est réutilisé : deux `tauri dev`
// simultanés ne doivent pas faire échouer beforeDevCommand (EADDRINUSE).
function portIsListening(portNumber) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port: portNumber });
    socket.setTimeout(1000, () => {
      socket.destroy();
      resolve(false);
    });
    socket.on('connect', () => {
      socket.end();
      resolve(true);
    });
    socket.on('error', () => resolve(false));
  });
}

function startNext() {
  const child = spawn(process.execPath, args, {
    cwd: root,
    env,
    stdio: 'inherit',
  });

  let stopping = false;
  function stop(code) {
    if (stopping) return;
    stopping = true;
    try {
      child.kill();
    } catch {
      // ignore
    }
    process.exit(code);
  }

  process.on('SIGINT', () => stop(0));
  process.on('SIGTERM', () => stop(0));
  process.on('exit', () => {
    try {
      child.kill();
    } catch {
      // ignore
    }
  });
  child.on('exit', (code) => {
    stopping = true;
    process.exit(code ?? 0);
  });
  child.on('error', (err) => {
    console.error('[dev] échec du lancement de next dev:', err.message);
    process.exit(1);
  });
}

portIsListening(Number(port)).then((listening) => {
  if (listening) {
    console.log(`[dev] serveur déjà actif sur ${port}, réutilisation.`);
    process.exit(0);
  }
  startNext();
});
