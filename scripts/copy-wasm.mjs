import { copyFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(import.meta.resolve('libcascade/wasm'));
await mkdir('public', { recursive: true });
await copyFile(src, 'public/opencascade_single.wasm');
console.log('WASM copied to public/opencascade_single.wasm');
