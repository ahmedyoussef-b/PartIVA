import path from 'path';

/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';
// B4 (V8-D-14) — build desktop : `output: 'standalone'`.
// Posé par desktop/scripts/build-server.cjs ; non défini pour le build web Vercel.
const isDesktopBuild = process.env.DESKTOP_BUILD === 'true';

const nextConfig = {
  // Le serveur de dev desktop utilise son propre dossier : le verrou Next.js
  // (.next/dev/lock) est partagé par tous les ports d'un même projet, ce qui
  // empêchait de lancer 3000 (web) et 3100 (Tauri) en parallèle.
  distDir: process.env.PARTIVA_DESKTOP_DEV === '1' ? '.next-desktop' : '.next',
  env: {
    NEXT_PUBLIC_COMMIT_SHA:
      process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.COMMIT_SHA || '',
  },
  serverExternalPackages: ['libcascade'],
  output: isDesktopBuild ? 'standalone' : isExport ? 'export' : undefined,
  typescript: isExport ? { ignoreBuildErrors: true } : {},
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  outputFileTracingExcludes: {
    '*': [
      './desktop/**',
      './e2e/**',
      './docs/**',
      './api.disabled/**',
    ],
  },
  // Plateau KiCad de démonstration — lu via fs par les routes de placement.
  // Sans tracing, le fichier n'est pas présent dans le bundle Vercel (existsSync faux).
  outputFileTracingIncludes: {
    '*': ['./src/lib/pcb/boards/**/*'],
  },
};

export default nextConfig;
