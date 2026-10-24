import path from 'path';

/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  output: isExport ? 'export' : undefined,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com' },
      { protocol: 'https', hostname: '**.traceparts.com' },
    ],
    unoptimized: isExport,
    loader: 'cloudinary',
    path: 'https://res.cloudinary.com/dl8ngmflh/image/upload/',
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
};

export default nextConfig;