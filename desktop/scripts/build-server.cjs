// Build script for PartIVA server sidecar
// 1. Build the Next.js app in standalone mode
// 2. Copy standalone output to desktop/server/
// 3. Copy Node.js executable to Tauri binaries (with target triple suffix)

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
process.chdir(root);
const serverDir = path.join(root, 'desktop', 'server');
const binariesDir = path.join(root, 'desktop', 'src-tauri', 'binaries');

console.log('Starting server build...');
console.log('Current directory:', process.cwd());

// Step 1: Run Next.js build (if not already done)
console.log('Running Next.js build...');
execSync('npm run build', { stdio: 'inherit' });

// Step 2: Copy standalone output to server directory
console.log('Copying standalone output...');
const standaloneSrc = path.join(root, '.next', 'standalone');
if (fs.existsSync(serverDir)) {
  // Remove existing server directory
  execSync(`rmdir /s /q "${serverDir}"`, { stdio: 'ignore' });
}
fs.mkdirSync(serverDir, { recursive: true });
// Copy the standalone directory contents to serverDir
function copyDir(src, dest) {
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

// Step 3: Copy Node.js executable to binaries with target triple suffix
console.log('Copying Node.js executable...');
fs.mkdirSync(binariesDir, { recursive: true });
const nodeExe = process.execPath;
console.log(`Node.js executable: ${nodeExe}`);
// Determine target triple from the target triplet used by Tauri
// We can use the target triplet from the target directory? Hardcode for now.
// From the error, we saw: x86_64-pc-windows-msvc
const targetTriple = 'x86_64-pc-windows-msvc';
const targetNodeExe = path.join(binariesDir, `node-${targetTriple}.exe`);
console.log(`Target node exe: ${targetNodeExe}`);
fs.copyFileSync(nodeExe, targetNodeExe);

console.log('Server build completed successfully.');