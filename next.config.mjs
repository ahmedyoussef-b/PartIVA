import path from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.traceparts.com' },
    ],
  },
  // Fix E9-R2-ter (H4): forcer la racine Turbopack et exclure les répertoires volumineux
  // (desktop/ avec node_modules, src-tauri/target et server/) pour éviter une boucle
  // ou un blocage infini lors du file-tracing en mode standalone.
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
};

export default nextConfig;