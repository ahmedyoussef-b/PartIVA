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
  // E27 — Better Auth limite par défaut /sign-in/* à 3 requêtes / 10 s
  // (node_modules/better-auth/dist/api/rate-limiter/index.mjs, getDefaultSpecialRules).
  // La suite Playwright émet ~104 sign-ins par run (authRequest + sign-in directs) :
  // sans levée explicite, tout appel au-delà du 3e renvoie 429 et masque la cause
  // réelle des échecs. Levée strictement via E2E_DISABLE_RATE_LIMIT=true (job CI « e2e »
  // uniquement) — la production conserve la limite par défaut.
  rateLimit:
    process.env.E2E_DISABLE_RATE_LIMIT === 'true'
      ? { customRules: { '/sign-in/email': false } }
      : {},
  baseURL: process.env.BETTER_AUTH_URL,

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
