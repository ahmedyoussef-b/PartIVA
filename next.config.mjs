import path from 'path';

/** @type {import('next').NextConfig} */
const isExport = process.env.NEXT_EXPORT === 'true';

const nextConfig = {
  env: {
    NEXT_PUBLIC_COMMIT_SHA:
      process.env.NEXT_PUBLIC_COMMIT_SHA || process.env.COMMIT_SHA || '',
  },
  output: isExport ? 'export' : undefined,
  typescript: isExport ? { ignoreBuildErrors: true } : {},
  reactStrictMode: true,
  images: {
    domains: ['res.cloudinary.com'],
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
    unoptimized: true,
  },
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  experimental: isExport
    ? {}
    : {
        serverActions: {
          bodySizeLimit: '10mb',
        },
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