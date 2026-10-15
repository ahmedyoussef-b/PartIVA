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
