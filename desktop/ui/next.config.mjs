import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * E8P-S06 — UI desktop PartIVA (D-E8P-S06-1 = A2 : UI dédiée dans desktop/ui/,
 * réutilise le langage visuel du web sans importer le projet Next.js racine).
 * Export statique (output: 'export') — consommé par Tauri via frontendDist = ../ui/out.
 * Pas de route dynamique [id] (incompatible export) — fiche via query param /part?id= (Bloc H).
 * turbopack.root : le repo racine a son propre lockfile — sans ce réglage, Next
 * remonte la racine workspace et compile le proxy du projet web (collision).
 */
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  images: { unoptimized: true },
  trailingSlash: true,
  turbopack: { root: __dirname },
};

export default nextConfig;
