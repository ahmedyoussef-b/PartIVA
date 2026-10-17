import { betterAuth } from 'better-auth';
import { bearer } from 'better-auth/plugins';
import { prismaAdapter } from '@better-auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  emailAndPassword: {
    enabled: true,
  },
  // E9-R2-septies — autoriser localhost et 127.0.0.1 (ports dynamiques sidecar Tauri)
  trustedOrigins: [
    'http://127.0.0.1:*',
    'http://localhost:*',
    'tauri://localhost',
    'https://part-iva.vercel.app',
  ],
  advanced: {
    // E9-R2-septies — pas de cookie __Secure- en HTTP local (sidecar 127.0.0.1)
    useSecureCookies:
      process.env.NODE_ENV === 'production' &&
      Boolean(process.env.BETTER_AUTH_URL?.startsWith('https://')),
  },
  // E8P-S09-quater-ter — support des tokens Bearer pour le client desktop Rust
  // (sans ce plugin, getSession ne lit QUE le cookie → /api/desktop/sync/* en 401).
  plugins: [bearer()],
  user: {
    additionalFields: {
      role: {
        type: 'string',
        required: false,
        defaultValue: 'USER',
      },
    },
  },
});
