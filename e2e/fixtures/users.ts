/**
 * E2E test users — credentials from env with dev fallback.
 * Precedence : E2E_*_EMAIL/PASSWORD (spécifique E2E),
 * puis ADMIN_EMAIL/ADMIN_PASSWORD (seed production, E7-S01),
 * puis valeurs mock (dev uniquement — correspondent à prisma/seed.ts).
 */

export type Role = 'ADMIN' | 'USER' | 'VIEWER';

export interface TestUser {
  role: Role;
  email: string;
  password: string;
  storageStatePath: string;
}

const adminEmail = process.env.E2E_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? 'admin@partiva.dev';
const adminPassword =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'PartIVA-dev-2026!';

export const users: Record<Role, TestUser> = {
  ADMIN: {
    role: 'ADMIN',
    email: adminEmail,
    password: adminPassword,
    storageStatePath: '.auth/admin.json',
  },
  USER: {
    role: 'USER',
    email: process.env.E2E_USER_EMAIL ?? process.env.ADMIN_EMAIL ?? 'user@partiva.dev',
    password: process.env.E2E_USER_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'PartIVA-dev-2026!',
    storageStatePath: '.auth/user.json',
  },
  VIEWER: {
    role: 'VIEWER',
    email: process.env.E2E_VIEWER_EMAIL ?? process.env.ADMIN_EMAIL ?? 'viewer@partiva.dev',
    password: process.env.E2E_VIEWER_PASSWORD ?? process.env.ADMIN_PASSWORD ?? 'PartIVA-dev-2026!',
    storageStatePath: '.auth/viewer.json',
  },
};
