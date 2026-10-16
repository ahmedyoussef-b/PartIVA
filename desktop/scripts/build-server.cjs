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
console.log('Running Next.js build...');
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

// Step 3: Copy static assets (.next/static -> desktop/server/.next/static)
console.log('Copying static assets...');
const staticSrc = path.join(root, '.next', 'static');
const staticDest = path.join(serverDir, '.next', 'static');
copyDir(staticSrc, staticDest);

const publicSrc = path.join(root, 'public');
const publicDest = path.join(serverDir, 'public');
if (fs.existsSync(publicSrc)) {
  copyDir(publicSrc, publicDest);
}

// Step 4: Patch server.js for dynamic port allocation (D-E9-R1-6) and 127.0.0.1 bind (D-E9-R1-10)
console.log('Patching server.js for dynamic port allocation...');
const serverJsPath = path.join(serverDir, 'server.js');
if (fs.existsSync(serverJsPath)) {
  const originalServerJs = fs.readFileSync(serverJsPath, 'utf8');
  const hookCode = `// --- PartIVA Dynamic Port Hook (D-E9-R1-6 & D-E9-R1-10) ---
const http = require('http');
const origListen = http.Server.prototype.listen;
http.Server.prototype.listen = function(...args) {
  if (process.env.PORT === '0' || !process.env.PORT || args[0] === 3000) {
    args[0] = 0;
  }
  if (args[1] === '0.0.0.0' || !args[1]) {
    args[1] = '127.0.0.1';
  }
  this.once('listening', () => {
    const addr = this.address();
    const port = typeof addr === 'object' && addr ? addr.port : addr;
    process.stdout.write(\`PARTIVA_SERVER_PORT=\${port}\\n\`);
  });
  return origListen.apply(this, args);
};
// --- End PartIVA Hook ---

`;
  fs.writeFileSync(serverJsPath, hookCode + originalServerJs, 'utf8');
  console.log('server.js patched successfully.');
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