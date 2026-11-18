/* eslint-disable @typescript-eslint/no-require-imports */
// Build script for PartIVA server sidecar
// 1. Build the Next.js app in standalone mode
// 2. Copy standalone output to desktop/server/
// 3. Copy static and public assets
// 4. Patch server.js for dynamic port allocation and localhost bind (D-E9-R1-6 & D-E9-R1-10)
// 5. Copy Node.js executable to Tauri binaries (with target triple suffix)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
process.chdir(root);
const serverDir = path.join(root, 'desktop', 'server');
const binariesDir = path.join(root, 'desktop', 'src-tauri', 'binaries');

console.log('Starting server build...');
console.log('Current directory:', process.cwd());

// Step 1: Run Next.js build
// B4 — force le mode standalone pour le sidecar (next.config.mjs l.12).
// Le build web Vercel reste output: undefined (guard local à ce process).
console.log('Running Next.js build...');
process.env.DESKTOP_BUILD = 'true';
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Copy standalone output to server directory
console.log('Copying standalone output...');
const standaloneSrc = path.join(root, '.next', 'standalone');
if (fs.existsSync(serverDir)) {
  fs.rmSync(serverDir, { recursive: true, force: true });
}
fs.mkdirSync(serverDir, { recursive: true });

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const item of fs.readdirSync(src)) {
    const srcItem = path.join(src, item);
    const destItem = path.join(dest, item);
    if (fs.statSync(srcItem).isDirectory()) {
      copyDir(srcItem, destItem);
    } else {
      fs.copyFileSync(srcItem, destItem);
    }
  }
}

copyDir(standaloneSrc, serverDir);

// B10 — Next copie `.env` dans `.next/standalone` : le retirer systématiquement
// de serverDir, sinon un secret partirait dans le bundle quelle que soit la gate.
for (const f of fs.readdirSync(serverDir)) {
  if (f.startsWith('.env')) {
    fs.rmSync(path.join(serverDir, f), { force: true });
  }
}
console.log('B10 — .env* retirés de', serverDir);

// Step 3: Copy static assets (.next/static -> desktop/server/.next/static)
console.log('Copying static assets...');
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(serverDir, '.next', 'static');
copyDir(staticSrc, staticDest);
console.log('Copié .next/static →', staticDest);

// T4.2 (V8-D-14) — GARANTIE : après copie, .next/static/chunks doit exister et
// contenir des .js. Sinon on ÉCHOUE le build (évite de livrer un server.js dont
// les chunks référencés sont absents → ChunkLoadError "404 sur chunk").
const chunksDir = path.join(staticDest, 'chunks');
const chunkCount = fs.existsSync(chunksDir)
  ? fs.readdirSync(chunksDir).filter((f) => f.endsWith('.js')).length
  : 0;
if (chunkCount === 0) {
  throw new Error(
    `build-server: .next/static/chunks vide ou absent (${chunksDir}) — build incohérent, abandon.`,
  );
}
console.log('T4.2 — vérifié .next/static/chunks →', chunkCount, 'chunks JS');

const publicSrc = path.join(root, 'public');
const publicDest = path.join(serverDir, 'public');
if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, publicDest);
  console.log('Copié public/ →', publicDest);
}

// Step 3b: Copy and tailor .env for local sidecar
// B10 — aucun secret dans le bundle par défaut : copie conditionnée à
// PARTIVA_BUNDLE_ENV=1 (opt-in explicite pour un build de test local).
const envSrc = path.join(root, '.env');
const envDest = path.join(serverDir, '.env');
if (process.env.PARTIVA_BUNDLE_ENV === '1') {
  if (fs.existsSync(envSrc)) {
    console.log('Copying and tailoring .env for server directory...');
    let envContent = fs.readFileSync(envSrc, 'utf8');
    // Neutralize static BETTER_AUTH_URL so sidecar uses dynamic loopback origin and port
    envContent = envContent.replace(
      /^BETTER_AUTH_URL=.*$/gm,
      '# BETTER_AUTH_URL (set dynamically by PartIVA hook)',
    );
    fs.writeFileSync(envDest, envContent, 'utf8');
    console.log('Tailored .env written to', envDest);
  }
} else {
  console.log('PARTIVA_BUNDLE_ENV != 1 → .env NON copié (aucun secret dans le bundle).');
}

// Step 4: Patch server.js for dynamic port allocation (D-E9-R1-6) and 127.0.0.1 bind (D-E9-R1-10)
// C1 (V8-D-14, 2026-11-17) — PATCH NEUTRALISÉ : Next.js 16 génère un server.js ESM ;
// le hook CJS (require('http')) provoquait "Cannot access 'require' before initialization"
// et le sidecar mourait au démarrage. Le port est désormais injecté par Rust
// (.env PORT/HOSTNAME) — le server.js standalone les lit nativement.
console.log('Step 4 (patch server.js) neutralisé — port injecté par env (V8-D-14).');
const serverJsPath = path.join(serverDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
  const originalServerJs = fs.readFileSync(serverJsPath, 'utf8');
  const hookCode = `// --- PartIVA Dynamic Port Hook (D-E9-R1-6 & D-E9-R1-10) — DÉSACTIVÉ (V8-D-14) ---
// Ce hook CJS est incompatible avec le server.js ESM de Next.js 16.
// L'injection du port se fait via .env() côté Rust (PORT / HOSTNAME).
`;
  void hookCode;
  void originalServerJs;
  console.log('server.js laissé intact (aucun patch).');
} else {
  console.error('Warning: server.js not found in', serverDir);
}


// Step 5: Copy Node.js executable to binaries with target triple suffix
console.log('Copying Node.js executable...');
fs.mkdirSync(binariesDir, { recursive: true });
const nodeExe = process.execPath;
console.log(`Node.js executable: ${nodeExe}`);
const targetTriple = 'x86_64-pc-windows-msvc';
const targetNodeExe = path.join(binariesDir, `node-${targetTriple}.exe`);
console.log(`Target node exe: ${targetNodeExe}`);
fs.copyFileSync(nodeExe, targetNodeExe);

console.log('Server build completed successfully.');
