import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';

function sleepSync(ms) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
}

function getAllFiles(dir, acc = []) {
  if (!existsSync(dir)) return acc;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) getAllFiles(full, acc);
    else acc.push(full);
  }
  return acc;
}

function waitForStability(dir, stableMs = 500, maxWaitMs = 10000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    if (!existsSync(dir)) {
      sleepSync(200);
      continue;
    }
    const files = getAllFiles(dir).filter((f) => f.endsWith('.ts'));
    if (files.length === 0) {
      sleepSync(200);
      continue;
    }
    const now = Date.now();
    const allStable = files.every((f) => now - statSync(f).mtimeMs > stableMs);
    if (allStable) return true;
    sleepSync(200);
  }
  return false;
}

console.log('Generating route types...');

const typesDir = join(process.cwd(), '.next', 'types');
if (existsSync(typesDir)) {
  const staleFiles = getAllFiles(typesDir).filter((f) => f.endsWith('.ts') || f.endsWith('.d.ts'));
  if (staleFiles.length > 0) {
    console.log(`Cleaning ${staleFiles.length} stale type file(s) in .next/types...`);
    staleFiles.forEach((f) => unlinkSync(f));
  }
}

execSync('next typegen', { stdio: 'inherit' });

console.log('Waiting for type generation to stabilize...');
if (!waitForStability(join(process.cwd(), '.next', 'types'))) {
  console.warn('Warning: type files may still be generating (timeout 10s)');
}

const tsbuildinfo = join(process.cwd(), 'tsconfig.tsbuildinfo');
if (existsSync(tsbuildinfo)) {
  console.log('Removing stale tsconfig.tsbuildinfo...');
  unlinkSync(tsbuildinfo);
}

console.log('Running type check...');
execSync('tsc --noEmit', { stdio: 'inherit' });
